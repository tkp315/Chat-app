import app from "./app.js";
import {  isOnline, lastSeen } from "./controllers/socket.js";
import { connectToDB } from "./database/db.js";
import dotenv from 'dotenv'
import {Server} from 'socket.io'

dotenv.config({path:`./.env`});

const port = process.env.PORT||3000
var userId;
connectToDB().then(()=>{

    const server =app.listen(port,()=>{
        console.log(`Server is running on ${port}`)
        
        try {
            const io = new Server(server,{
                cors:{
                    // origin:'http://localhost:5173',
                    origin:'https://connectwithworld.netlify.app',
                    credentials:true
                }
            })
            io.on('connection',(socket)=>{
                console.log(`user is connected with socket Id: `,socket.id)
                socket.on('setup',(userData)=>{
                 console.log(userData._id);
                 socket.join(userData._id);
                 socket.emit('connection')
                 userId=userData._id
                 io.emit('user_online',isOnline(userId,true,null))
                })
    
                // joining a chat 
    
                socket.on('join_room',(chatId)=>{
                    socket.join(chatId);
                    console.log("socket joins room",chatId)
                    
                })
    
                /* **********video-call************************* */
                // 1. call to ,send video call offer 2.accept offer(receiver) 3. end call 4. // ice-candidates
                 socket.on('video_call_offer',(data)=>{
                   const {offer,recieverId,callerId}=data;
                   socket.to(recieverId).emit('video_call_offer',{from:callerId ,offer})
                 })

                 socket.on('video_call_answer',(data)=>{
                   const {answer,callerId}=data;

                   socket.to(callerId).emit('video_call_answer',{to:callerId,answer});
                 })
                
                 socket.on('ice-candidate', (data) => {
                    const { candidate, peerId } = data;
                    socket.to(peerId).emit('ice-candidate', { candidate });
                });




                socket.on('new_message',(newMessageReceived)=>{
                    const chat = newMessageReceived.chat;
                    if(newMessageReceived)console.log("There is no message")
                    if(chat.groupMembers.length===0)return ;
                    
                    console.log(newMessageReceived)
                   
                   
                    const timeToSend = newMessageReceived.timeToSend;
                    
    
                    if(timeToSend){
                       
                        let interval = new Date(timeToSend).getTime()-Date.now();
                        socket.emit('receive_message',newMessageReceived)
                       if(interval>0){
                        socket.emit('status_changed',{time: new Date(timeToSend).getTime(),status:'Pending'});
                        setTimeout(()=>{
                            socket.broadcast.emit('receive_message',newMessageReceived)
                            socket.emit('status_changed',{time: new Date(timeToSend).getTime(),messageId:newMessageReceived._id});
                        },interval)
                       }
                    }else{
                        console.log('message recieved by group members')
                        io.emit('receive_message',newMessageReceived)
                    }
    
                   
    
                })
              socket.off('disconnect',()=>{
                io.emit('user_online',isOnline(userId,false,new Date()))
              })
            })
            
        
        } catch (error) {
            console.log("socket is not found")
        }
        
     })
    }) 
    

.catch((error)=>{
    console.log(`problem occuring while connecting to DB`,error)
})

