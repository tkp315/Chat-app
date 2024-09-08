import app from "./app.js";
import {  isOnline, lastSeen } from "./controllers/socket.js";
import { connectToDB } from "./database/db.js";
import dotenv from 'dotenv'
import {Server} from 'socket.io'

dotenv.config({path:`./.env`});

const port = process.env.PORT||3000
var userId;
connectToDB().then(()=>{

    const server = app.listen(port, () => {
        console.log(`Server is running on ${port}`);
        try {
          const io = new Server(server, {
            cors: {
              origin: 'https://chat-app-1-vrhe.onrender.com',
              credentials: true
            }
          });
      
          io.on('connection', (socket) => {
            console.log(`User is connected with socket Id: `, socket.id);
      
            socket.on('setup', async (userData) => {
              console.log(userData._id);
              socket.join(userData._id);
              socket.emit('connection');
              userId = userData._id;
      
              // Update user online status
              try {
                const data = await isOnline(userData._id, true, null);
                io.emit('user_online', data); // Emit user online status to everyone
              } catch (err) {
                console.log("User not found", err);
              }
            });
      
            // Joining a chat
            socket.on('join_room', (chatId) => {
              socket.join(chatId);
              console.log("Socket joins room", chatId);
            });
      
            // New message handling
            socket.on('new_message', (newMessageReceived) => {
              const chat = newMessageReceived.chat;
              if (!newMessageReceived) {
                return console.log("There is no message");
              }
              if (chat.groupMembers.length === 0) {
                return console.log("No members inside the chat");
              }
      
              console.log(newMessageReceived);
      
              const timeToSend = newMessageReceived.timeToSend;
              if (timeToSend) {
                const interval = new Date(timeToSend).getTime() - Date.now();
                socket.emit('receive_message', newMessageReceived); // Emit immediately to sender
      
                if (interval > 0) {
                  socket.emit('status_changed', { time: new Date(timeToSend).getTime(), status: 'Pending' });
                  setTimeout(() => {
                    socket.broadcast.emit('receive_message', newMessageReceived);
                    socket.emit('status_changed', { time: new Date(timeToSend).getTime(), messageId: newMessageReceived._id });
                  }, interval);
                }
              } else {
                io.emit('receive_message', newMessageReceived); // Emit instantly to all if no scheduled time
              }
            });
      
            // Handle disconnection
            socket.on('disconnect', async () => {
              try {
                const data = await isOnline(userId, false, new Date());
                io.emit('user_online', data); // Emit offline status to everyone
              } catch (err) {
                console.log("User not found", err);
              }
            });
          });
        } catch (error) {
          console.log("Socket initialization error", error);
        }
      });
})
.catch((error)=>{
    console.log(`problem occuring while connecting to DB`,error)
})

