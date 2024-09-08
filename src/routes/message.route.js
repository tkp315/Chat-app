import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllMessages, sendMessage } from "../controllers/message.controller.js";

const messageRouter = Router()

messageRouter.route("/send-message/:chatId").post(verifyJWT,sendMessage)
messageRouter.route("/get-message/:chatId").post(verifyJWT,getAllMessages)


export {messageRouter}