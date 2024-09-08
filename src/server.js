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
                    origin:'https://66dd93e65363bf324d26732f--connectwithworld.netlify.app',
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
    
                //
                socket.on('new_message',(newMessageReceived)=>{
                    const chat = newMessageReceived.chat;
                    if(newMessageReceived)console.log("There is no message")
                    if(chat.groupMembers.length===0)return console.log("no members inside it");
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

