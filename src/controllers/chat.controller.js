import mongoose from "mongoose";
import { Chat } from "../models/chat.model.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandlerFunction from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/*
1.create chat 
2.extract all the messages 
 */
const createChat = asyncHandlerFunction(async (req, res) => {
    const { receiverId } = req.body;  // Corrected spelling
    const userId = req.user._id;

    // Check if there's already a single chat between the two users
    const existingSingleChat = await Chat.findOne({
        isGroupChat: false,
        groupMembers: {
            $all: [userId, receiverId]  // Removed unnecessary ObjectId conversion
        }
    })
    .populate("latestMessage", "content sentTime")
    .populate("groupMembers", "fullName email avatar")  // Corrected spacing in field selection
    .populate("sender", "fullName email avatar");

    if (existingSingleChat) {
        throw new ApiError(401,"This is already a Chat");
    }

    const receiver = await User.findById(receiverId);
    const nameOfReceiver = receiver.fullName

    // Create a new chat if it doesn't exist
    const newChat = await Chat.create({
        chatName: nameOfReceiver,
        isGroupChat: false,
        groupMembers: [receiverId, userId],
        sender: userId
    });
    
    const updateUser = await User.findByIdAndUpdate(userId,{
      $push:{
        Chats:newChat._id
      }
    },{new:true})

    const newlyCreatedChat = await Chat.findById(newChat._id)
        .populate("sender", "fullName email avatar")
        .populate("groupMembers", "fullName email avatar");


    return res.status(200).json(new ApiResponse(200, {newlyCreatedChat,updateUser}, "New chat created"));
});


const fetchAllChats = asyncHandlerFunction(async (req, res) => {
    const userId = req.user._id;
  
    // Fetch all chats with proper await
    let allChats = await Chat.find(
       {
        $or:[
            {sender:userId},
            {groupMembers:{$elemMatch:{$eq:userId}}}
        ]
       }
    )
      .populate("groupMembers","fullName avatar email")
      .populate("Admin", "fullName avatar email")
      .populate("latestMessage","content sentTime")
      .sort({ updatedAt: -1 });
  
    // Further populate latestMessage sender
    allChats = await User.populate(allChats, {
      path: "latestMessage.sender",
      select: "name avatar phone",
    });
  
    return res
      .status(200)
      .json(new ApiResponse(200, { allChats }, "Fetched All Chats"));
  });

const selectedChat = asyncHandlerFunction(async (req, res) => {
  const { chatId } = req.params;
  const cid = new mongoose.Types.ObjectId(chatId);
  const userId = req.user._id;

  const chat = await Chat.findById(cid)
  .populate("groupMembers")
  .populate("sender","fullName avatar email lastSeen isOnline")
  .populate("allMessages","content sentTime")
  .populate("Admin","fullName avatar email lastSeen isOnline")
  .populate({
    path:"latestMessage",
    select:"content sentTime",
    populate:{
      path:"sender",
      select:"fullName"
    }
  })
    



  return res
    .status(200)
    .json(new ApiResponse(200, { chat }, "All Info of chats found"));
});

const deleteChat = asyncHandlerFunction(async(req,res)=>{
  const {chatId}=req.params;
  const userId = req.user._id;
  if(!chatId)throw new ApiError(401,"Chat Id Not Found")
  const cid = new mongoose.Types.ObjectId(chatId);
  
  const user = await User.findById(userId);

  user.Chats = user.Chats.filter((e)=>!e._id.equals(cid))
  await user.save();

  const chat = await Chat.findByIdAndDelete(cid);

  return res.status(200)
  .json(new ApiResponse(200,user.Chats,'Chat Deleted'))

})



/*
**************Group Chat ******************
1.create group chat
2. all groupDetails: 1. allmessages,groupMembers,latestMessage,admin, dp,etc.
3. fetch all groups
4. add a member
5. remove a member
6. leave group for admin and member both
7. edit the groupName and dp
8. delete the group
9. make admin to others
filter on the basis of groups chats and individual chats
 */
const isAdmin =async (chatId,userId)=>{
    const cid = new mongoose.Types.ObjectId(chatId)
    const chat = await  Chat.findById(cid)
    if(!chat)throw new ApiError(401,"No chats found");
   

    const admin = chat.Admin;
    if(!admin.equals(userId))return {chatDetail:chat,isGroupAdmin:false};
return {chatDetail:chat,isGroupAdmin:true}
}

const createGroup = asyncHandlerFunction(async(req,res)=>{
    const userId = req.user._id;
    const {groupName,groupMembers}=req.body;
    if(!groupName)throw new ApiError(401,"please Enter group Name")
      console.log(groupName)
     const alreadyGroupName = await Chat.findOne({chatName:groupName});
     console.log(alreadyGroupName)
    if(alreadyGroupName)throw new ApiError(401,"Choose different group Name")
    let allUsers = Array.isArray(groupMembers)? groupMembers:JSON.parse(groupMembers);
    if(groupMembers.length<=2)throw new ApiError(401,`select ${3-groupMembers.length} more members`);

    const groupDPLocalStorage = req.file?.path;
    console.log(groupDPLocalStorage)
    const groupDP = await uploadOnCloudinary(groupDPLocalStorage,process.env.Socket);

    // make admin
    // groupchat true
    //put userid in groupMembers array

    allUsers.push(userId);
    const groupChat = await Chat.create({
        chatName:groupName,
        isGroupChat:true,
        groupMembers:allUsers,
        groupDP:groupDP?.secure_url||"https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg?s=612x612&w=0&k=20&c=yBeyba0hUkh14_jgv1OKqIH0CCSWU_4ckRkAoy2p73o=",
        Admin:userId,
    })

    const newChat = await Chat.findById(groupChat._id).populate("groupMembers","fullName avatar email")
    // .populate("allMessages","content sentTime")
    .populate("Admin","fullName avatar email")
    // .populate("latestMessage","content sentTime")

    const updateUser = await User.findByIdAndUpdate(userId,{
      $push:{
        Chats:newChat._id
      }
    },{new:true})

    return res
    .status(200)
    .json(new ApiResponse(200,{newChat,updateUser},"new group is created"));

})

const makeAdmin = asyncHandlerFunction(async(req,res)=>{
    const {newAdminId}= req.body;
    const {chatId}=req.params
    const userId = req.user._id;
    const result = await isAdmin(chatId,userId);
    const isGroupAdmin =result.isGroupAdmin;
    const chat = result.chatDetail;
    if(!isGroupAdmin)throw new ApiError(401,"You are not the ADMIN");
    
     chat.Admin = newAdminId
     await chat.save();
    return res
    .status(200)
    .json(new ApiResponse(200, chat.Admin,"new Admin assigned"));
})


const IncludeNewMember= asyncHandlerFunction(async(req,res)=>{
    const {newMemberId}=req.body
    
    const nmid = new mongoose.Types.ObjectId(newMemberId);
    const {chatId}= req.params;
    
    const userId = req.user._id;
    const result=await isAdmin(chatId,userId);
    const chat = result.chatDetail;
    const isGroupAdmin= result.isGroupAdmin;

    if(!isGroupAdmin)throw new ApiError(401,'You are not Admin');

   const isFound =chat.groupMembers.find((e)=>e._id.equals(nmid));
   if(isFound)throw new ApiError(401,"This is already part of your group");
    console.log(nmid)

    // chat.groupMembers.push(nmid);
    chat.groupMembers=[...chat.groupMembers,nmid];
    await chat.save();

   


    return res
    .status(200)
    .json(new ApiResponse(200,chat.groupMembers,"Added a new Group Member"))
    
    
})

const removeMember = asyncHandlerFunction(async(req,res)=>{
    const{personId}= req.body;
    console.log(personId)
    if(!personId)throw new ApiError(401,"select any user")
    const pid = new mongoose.Types.ObjectId(personId);
    const {chatId}= req.params;
    const userId = req.user._id;

    const result = await isAdmin(chatId,userId);
    const chat = result.chatDetail;
    const isGroupAdmin = result.isGroupAdmin;

    if(!isGroupAdmin)throw new ApiError(401,"You are not the Admin");
    if(isGroupAdmin && pid===userId ) throw new ApiError("First make a new Admin")
   chat.groupMembers= chat.groupMembers.filter((user)=>!user._id.equals(pid));
    await chat.save();

    return res
    .status(200)
    .json(new ApiResponse(200, chat,"Removed a member"));


})

const leaveGroup = asyncHandlerFunction(async (req, res, next) => {
    const { chatId } = req.params;
    const userId = req.user._id; // ID of the logged-in user
    console.log(chatId)
    const result = await isAdmin(chatId, userId);
   
    const isGroupAdmin = result.isGroupAdmin;
    const chat = result.chatDetail;

    if (isGroupAdmin) {
        // If the user is an admin, handle the case where they need to assign a new admin
        // You may need to include logic for setting a new admin
        return next(new ApiError(400, "You are the admin. Please make someone else an admin before leaving the group"));
    }

    const isMemberInGroup = chat.groupMembers.some(user => user._id.equals(userId));
    if (!isMemberInGroup) {
        return next(new ApiError(404, "You are not a member of this group"));
    }

    // Remove the user from the group
    chat.groupMembers = chat.groupMembers.filter(user => !user._id.equals(userId));

    // Save the updated chat document
    await chat.save();

    return res.status(200).json(new ApiResponse(200, chat, "You have left the group"));
});


const deleteGroup = asyncHandlerFunction(async(req,res)=>{
    const {chatId}= req.params;
    const userId = req.user._id;

    const result = await isAdmin(chatId,userId);
    const isGroupAdmin = result.isGroupAdmin;
    const chat = result.chatDetail;

    if(!isGroupAdmin)throw new ApiError(401,"You are not the group Admin");
    
    const currentChat = await Chat.findByIdAndDelete(chatId);

    return res 
    .status(200)
    .json(new ApiResponse(200,{},"Group Deleted"));

})

const changeDp = asyncHandlerFunction(async(req,res)=>{
    const userId = req.user._id

    const {chatId}= req.params;
  

    const result = await isAdmin(chatId,userId);
    const isGroupAdmin = result.isGroupAdmin;
    const chat = result.chatDetail;
    console.log(result)

    if(isGroupAdmin){
        const groupDPLocalStorage= req.file?.path;
        console.log(req.file)
    const groupDP = await uploadOnCloudinary(groupDPLocalStorage,process.env.Socket);

    chat.groupDP = groupDP.secure_url;
    await chat.save();
    };
   
   

    return res
    .status(200)
    .json(new ApiResponse(200,chat.groupDP,"DP changed"));
})

const editGroupName = asyncHandlerFunction(async(req,res)=>{
    const {chatId}= req.params;
    const userId = req.user._id;
    const {newGroupName}=req.body
    if(!newGroupName)throw new ApiError(401,"Name is not found")
    const result = await isAdmin(chatId,userId);
    const isGroupAdmin = result.isGroupAdmin;
    const chat = result.chatDetail;

    if(!isGroupAdmin)throw new ApiError(401,"You are not the group Admin");

    chat.chatName = newGroupName
    await chat.save();

    return res.status(200).json(new ApiResponse(200,chat,"Group Name is updated"))


})

const fetchAllGroups = asyncHandlerFunction(async(req,res)=>{
  const userId = req.user._id

  if(!userId)throw new ApiError(401,"user not found");

  const totalGroupChats = await Chat.find({groupMembers:{$in:[userId]}},{isGroupChat:true}).select("chatName latestMessage groupDP")
  return res.status(200).json(new ApiResponse(200,{totalGroupChats},"Fetched all group Chats"));
})

/* **********Search************* */

const search = asyncHandlerFunction(async (req, res) => {
    const { query } = req.query;
  
    // Validate query parameter
    if (!query || typeof query !== 'string') {
      throw new ApiError(400, "Query parameter is required and must be a string");
    }
  
    const regex = new RegExp(`^${query}`, 'i');
  
    try {
      // Perform the search
      const result = await User.find({
        $or: [
          { fullName: { $regex: regex } },
          { email: { $regex: regex } }
        ]
      })
      .select("fullName avatar email")
      .limit(12);
  
      // Send response
      return res.status(200)
        .json(new ApiResponse(200, result, "Search results fetched successfully"));
    } catch (error) {
      // Handle any errors
      console.error('Search error:', error);
      throw new ApiError(500, "An error occurred while searching");
    }
  });

const searchChats = asyncHandlerFunction(async(req,res)=>{
  const {chatName}= req.query;
  console.log(req.query);
  const userId = req.user._id;

  if(!chatName || typeof(chatName)!=='string')throw new ApiError(401,"Invalid Query")

  const regex = new RegExp(`^${chatName}`,'i');

  const user= await User.findById(userId).populate({
    path:"Chats",
    populate:{
      path:"groupMembers"
    }
  })

  
  // i want to search in chats array matching 
 const searchResult =user.Chats.filter((chat)=>{
  return (
    regex.test(chat.chatName)
  )
 })
 
  

  if(searchResult.length===0)throw new ApiError(401,"No Result Found");

 


  return res
  .status(200)
  .json(new ApiResponse(200,searchResult, "Found results"));

})

export { createChat, fetchAllChats, selectedChat, deleteChat,
    createGroup,makeAdmin,IncludeNewMember,removeMember,changeDp,editGroupName,leaveGroup,deleteGroup,fetchAllGroups,
    search,searchChats
};
