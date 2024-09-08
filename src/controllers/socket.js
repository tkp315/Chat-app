import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandlerFunction from "../utils/asyncHandler.js";
const isOnline = async (userId, isOnlineStatus, lastSeen) => {
    if (!userId) throw new ApiError(401, "userId not found");
  
    const user = await User.findByIdAndUpdate(
      userId,
      { isOnline: isOnlineStatus, lastSeen: lastSeen },
      { new: true }
    );
    console.log(user);
    return { isOnline: user.isOnline, lastSeen: user.lastSeen };
  };

const lastSeen = async(userId)=>{
   
    const user=await User.findByIdAndUpdate(userId,{
        isOnline:false,
        lastSeen:new Date()
    })
    console.log(user)
    return {user}
}

export {isOnline,lastSeen}