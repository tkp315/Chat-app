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
        default: Date.now // Corrected: Removed parentheses
    },
    sentTime: {
        type: Date,
        default: Date.now // Corrected: Removed parentheses
    },
    status: {
        type: String,
        enum: ["Sent", "Pending", "failed"],
        default: "pending" // Optional: Set a default value
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true
    }
}, { timestamps: true });

export const Messages = mongoose.model("Messages", messageSchema);
