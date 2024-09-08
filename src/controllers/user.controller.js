/*
1. send otp
2. signup
3. login
4. logout
5. edit dp
6. reset password
 */
import bcrypt from 'bcrypt'
import asyncHandlerFunction from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";


import { OTP } from "../models/otp.model.js";
import { otpGenerator } from "../utils/generateOTP.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { BsThreads } from "react-icons/bs";
import { sendMail } from '../utils/mailSetup.js';


const sendOTP = asyncHandlerFunction(async(req,res)=>{
    const {email}=req.body
    if(!email)throw new ApiError(401,"Email not Found");

    const uniqueOTP = otpGenerator(6);

    if(!uniqueOTP)throw new ApiError(401,"otp not obtained");

    const newOTP = await OTP.create({
        email:email,
        otp:uniqueOTP,
        expiryIn:Date.now()+10*60*1000
    })
    
   return res.status(200)
   .json(new ApiResponse(200,{newOTP},"OTP sent successfully"))
})

const signup = asyncHandlerFunction(async(req,res)=>{
    const{fullName,password,confirmPassword,otp,email}=req.body

    if([fullName,password,confirmPassword,otp,email].some((e)=>e===""))throw new ApiError(401,"something is missing");

    const user = await User.findOne({email:email});
    if(user)throw new ApiError(401,"Kindly login, you are already registerd");
    
    const isMatching = password===confirmPassword
    if(!isMatching)throw new ApiError(401,"password not matching");

    const currentOTP=await OTP.findOne({email:email}).sort({expiryIn:-1})
   
    if(!currentOTP)throw new ApiError(401,"OTP is not found")
    const userOTP = currentOTP.otp;
     if(Date.now()>currentOTP.expiryIn)throw new ApiError(401,"otp expired")
    if(!userOTP)throw new ApiError(401,"user otp is not found");
    if(otp!==userOTP)throw new ApiError(401,"incorrect otp");

    const avatarLocalStorage = req.file?.path
    console.log(req.file)
             
    const avatar = await uploadOnCloudinary(avatarLocalStorage,process.env.Socket)

    const newUser = await User.create({
        fullName:fullName,
        email:email,
        password:password,
        avatar:avatar?.secure_url||"https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg?s=612x612&w=0&k=20&c=yBeyba0hUkh14_jgv1OKqIH0CCSWU_4ckRkAoy2p73o=",
        
        
    })
    return res.status(200).json(new ApiResponse(200,newUser,"new user registered successfully"))
})

const login = asyncHandlerFunction(async(req,res)=>{
    const {email,password}=req.body;
    const user =await User.findOne({email});
    if(!email)throw new ApiError(401,"please enter email ");
    if(!password)throw new ApiError(401,"please enter password");
    if(!user)throw new ApiError(401,"User is not registered ");

    const iscorrectPassword= await bcrypt.compare(password,user.password);
    if(!iscorrectPassword)throw new ApiError(401,"Incorrect Password")

    const loggedInUser = await User.findById(user._id);
    if(!loggedInUser)throw new ApiError(401,"Invalid user ");

    const accessToken = user.generateAccessToken(loggedInUser._id)
    if(!accessToken)throw new ApiError(401,"accessToken not found ");
    const refreshToken = user.generateRefreshToken(loggedInUser._id)
    if(!refreshToken)throw new ApiError(401,"refreshToken not found ");

     loggedInUser.refreshToken=refreshToken;
     await loggedInUser.save();

    const options = {
        httpOnly:true,
        secure:process.env.NODE_ENV='production',
        sameSite:'none'
        
    }
    // const option1= {
    //     httpOnly:true
    // }

    return res.
    status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refrehToken",refreshToken,options)
    .json(new ApiResponse(200,loggedInUser,"User Logged In Successfully"))

})

const logout = asyncHandlerFunction(async(req,res)=>{
    const userId = req.user._id;
    if(!userId)throw new ApiError(401,"User is not logged In");
    const option1 ={
        httpOnly:true
    }
    const refrehToken= await User.findByIdAndUpdate(userId,{
        $set:{
            refreshToken:undefined
        }
    })

    const options = {
        httpOnly:true,
        secure:process.env.NODE_ENV='production',
        sameSite:'none'
        
    }
    return res
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user successfully logged out"))
})

const userInfo = asyncHandlerFunction(async(req,res)=>{
    const userId = req.user._id

     const user = await User.findById(userId)
    .populate({
        path:"Chats",
        select:"chatName isGroupChat ",
        populate:{
            path:"groupMembers",
            select:"fullName, avatar email"
        },
        // latest message 
    });

    return res.status(200).json(new ApiResponse(200,{user},"User Info SuccessFully Got"))
})

const makeFriend = asyncHandlerFunction(async (req, res) => {
    const { email } = req.body;
    const userId = req.user._id;
  
    if (!email) throw new ApiError(401, "Please enter an email");
  
    const friend = await User.findOne({ email: email }).select("fullName email avatar");
    
    if (!friend) throw new ApiError(404, "User with this email not found");
  
    const user = await User.findById(userId);
  
    const isAlreadyFriend = user.FriendList.some((e) => e.equals(friend._id));
  
    if (isAlreadyFriend) throw new ApiError(401, "They are already your friend");
  
    user.FriendList.push(friend._id)
    await user.save();
  
    const friendData=user.populate("FriendList","fullName avatar email")
    return res
      .status(200)
      .json(new ApiResponse(200, { friend,friendData}, "New friend added"));
  });


// reset password

const sendToken=asyncHandlerFunction(async(req,res)=>{
const {email}=req.body
if(!email)throw new ApiError(401,"please enter email");
const user = await User.findOne({email:email});

if(!user)throw new ApiError(401,"User is not registered");

const token =  crypto.randomUUID()
  user.resetToken=token
  await user.save();

const sendmessage = await sendMail(`Token for reseting Password  ${token} `,email,"Reset Password");


return res
.status(200)
.json(new ApiResponse(200,{response:sendmessage.response,token},"Token sent successfully"));

})

const resetPassword = asyncHandlerFunction(async(req,res)=>{
    const {token,newPass,confirmPassword}=req.body;

    if([token,newPass,confirmPassword].some((e)=>e===""))throw new ApiError(401,"please Enter all the fileds");

    const user = await User.findOne({resetToken:token});
    if(!user)throw new ApiError(401,"Invalid request ");

    const iscorrectPassword = newPass===confirmPassword
    if(!iscorrectPassword)throw new ApiError(401,"Password not matching");

    user.password=newPass;
    await user.save();

    sendMail('Password Reset Successfully ', user.email, "Reset Password Confirmation")

    return res
    .status(200)
    .json(new ApiResponse(200,{user},"Password reset Successfully"))
     
    
})
// profile things
const changeDP = asyncHandlerFunction(async(req,res)=>{
    const userId = req.user._id;
    
    const avatarLocalStorage= req.file?.path;
    const avatar = await uploadOnCloudinary(avatarLocalStorage,process.env.Socket);

    const user = await User.findByIdAndUpdate(userId,{
        $set:{
            avatar:avatar.secure_url
        }
    },{new:true})

   return res.status(200).json(new ApiResponse(200,{user},"DP changed successfully"));
})


export {
    sendOTP,
    signup,
    login,
    logout,
    sendToken,
    resetPassword,
    changeDP,
    userInfo,
    makeFriend
}