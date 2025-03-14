import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
{
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
    },
    timeToSend: {
        type: Date,
        default: Date.now 
    },
    sentTime: {
        type: Date,
        default: Date.now 
    },
    status: {
        type: String,
        enum: ["Sent", "Pending", "failed"],
        default: "pending" 
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true
    }
}, { timestamps: true });

export const Messages = mongoose.model("Messages", messageSchema);
