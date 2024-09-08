import nodemailer from 'nodemailer'

const sendMail =async(body,email,title)=>{
   try {
     const transporter = nodemailer.createTransport({
         host:'smtp.gmail.com',
         port: 465,
         secure:true,
         auth:{
           user:process.env.MAIL_USER,
           pass:process.env.MAIL_PASSWORD
         }
     })
     
     transporter.verify(function(error,success){
         if(error)console.log(error)
         else console.log(`server is ready to take our messages`)
     })
     
     let info = await transporter.sendMail({
         to:`${email}`,
         subject:`${title}`,
         from:`Chat App | belivers`,
         html:`${body}`
     })
     console.log(info)
     return info
   } catch (error) {
    console.log(`Error while sending email`,error)
   }
}
export {sendMail}