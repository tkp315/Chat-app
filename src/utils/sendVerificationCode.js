import asyncHandlerFunction from '../utils/asyncHandler.js'
import { sendMail } from './mailSetup.js'
const verificationCode = asyncHandlerFunction(async(email,otp)=>{
    try {
        const  mailResponse = await sendMail(`Verification code is ${otp}`,email,"OTP ")
        console.log(mailResponse)
    } catch (error) {
        console.log("Message Not sent",error)
    }
})
export {verificationCode}