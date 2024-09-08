import newOtp from 'otp-generator'

export const otpGenerator=(length)=>{
const otp = newOtp.generate(length,{
upperCaseAlphabets:false,
lowerCaseAlphabets:false,
specialChars:false,
digits:true
})

return otp
}