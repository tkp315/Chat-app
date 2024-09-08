import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { changeDp, createChat, createGroup, deleteChat, deleteGroup, editGroupName, fetchAllChats, fetchAllGroups, IncludeNewMember, leaveGroup, makeAdmin, removeMember, search, searchChats, selectedChat } from "../controllers/chat.controller.js";
import { upload } from "../middlewares/multer.js";
import { changeDP } from "../controllers/user.controller.js";

const chatRouter = Router();

chatRouter.route("/create-chat").post(verifyJWT,createChat)

chatRouter.route("/fetchAllChats").post(verifyJWT,fetchAllChats)

chatRouter.route("/selectedChat/:chatId").post(verifyJWT,selectedChat)
chatRouter.route("/delete-chat/:chatId").post(verifyJWT,deleteChat)


/* *******Search-Query*******/ 
// -------unchecked-------------

chatRouter.route(`/search`).get(verifyJWT,search)
chatRouter.route(`/search-chats`).get(verifyJWT,searchChats)


/* ********Group-Chat********** */

chatRouter.route("/create-group").post(verifyJWT,upload.single("groupDP"),createGroup)

chatRouter.route("/make-admin/:chatId").post(verifyJWT,makeAdmin)

chatRouter.route("/add-new-Member/:chatId").post(verifyJWT,IncludeNewMember)

chatRouter.route("/remove-member/:chatId").post(verifyJWT,removeMember)

chatRouter.route("/leave-group/:chatId").post(verifyJWT,leaveGroup)

chatRouter.route("/delete-group/:chatId").post(verifyJWT,deleteGroup)

chatRouter.route("/change-dp/:chatId").post(verifyJWT,upload.single("groupDP"),changeDp)

chatRouter.route("/edit-group-name/:chatId").post(verifyJWT,editGroupName)

chatRouter.route("/fetch-all-groups").get(verifyJWT,fetchAllGroups)

export {chatRouter}