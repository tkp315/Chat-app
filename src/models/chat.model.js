import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
{
chatName:{
    type:String,
    required:true
},
isGroupChat:{
    type:Boolean,
    required:true
},
groupMembers:[{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}],
sender:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
},
allMessages:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Messages"
    }
],
groupDP:{
type:String,
},
Admin:{
    type:mongoose.Schema.Types.ObjectId,
   ref:"User"
},
latestMessage:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Messages"
}
},{timestamps:true})

export const Chat = mongoose.model("Chat",chatSchema)