import mongoose, {  Schema } from "mongoose";
import { sendMail } from "../utils/mailSetup.js";
import { verificationCode } from "../utils/sendVerificationCode.js";

const otpSchema = new Schema(
{
otp:{
    type:String,
    required:true,   
},
expiryIn:{
    type:Date,
    default: Date.now()+10*60*1000
},
email:{
    type:String,
    required:true
}

},{timestamps:true})

otpSchema.pre("save",async function (next){
     await verificationCode(this.email,this.otp)
    next()
})

export const OTP = mongoose.model("OTP",otpSchema);