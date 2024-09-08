//send Message
//getAllMessages

import mongoose from "mongoose";
import asyncHandlerFunction from "../utils/asyncHandler.js";
import { Messages } from "../models/message.model.js";
import { Chat } from "../models/chat.model.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";




const sendMessage = asyncHandlerFunction(async(req,res)=>{
    const {content,timeToSend}=req.body;
    const {chatId}= req.params;
    console.log(chatId);
    const senderId = req.user._id;
    const cid = new mongoose.Types.ObjectId(chatId);
    console.log(content)
    
   if(timeToSend && timeToSend<Date.now())throw new ApiError(401,"You entered past time")
   const status = timeToSend>Date.now()?"Pending":"Sent"
   console.log(timeToSend)
    const createNewMessage = await Messages.create({
        sender:senderId,
        content:content,
        sentTime:timeToSend?timeToSend:Date.now(),
        status:status,
        timeToSend:timeToSend,
        chat:cid
    })
    const newlyCreatedMessage = await Messages.findById(createNewMessage._id).populate({
        path:"chat",
        populate:{
            path:"groupMembers",
            select:"fullName avatar email"
        }
        
    }).populate("sender","fullName avatar email")

const addInChat = await Chat.findByIdAndUpdate(cid,{
  $push:  {
        allMessages:createNewMessage._id
    },
    latestMessage:createNewMessage._id
},{new:true}).populate({
    path:"allMessages",
    select:"content sentTime timeToSend",
    populate:{
        path:"sender",
        // select:"fullName avatar email"
    },
}).populate("latestMessage","content sentTime timeToSend")

   
// status: sent at time of socket 
  return res
  .status(200)
  .json(new ApiResponse(200,{newlyCreatedMessage,addInChat},"message is created"));

})


const getAllMessages = asyncHandlerFunction(async(req,res)=>{
    const {chatId}=req.params
    const cid = new mongoose.Types.ObjectId(chatId);

    const messages = await Chat.findById(chatId).populate({
        path:"allMessages",
        select:"content sentTime timeToSend",
        populate:{
            path:"sender",
            // select:"fullName avatar email"
        },
    }).populate("latestMessage","content sentTime timeToSend")

    return res
    .status(200)
    .json(new ApiResponse(200,{messages},'All messages got'));
})

export{sendMessage,getAllMessages}