import { Router } from "express";
import { changeDP, logout, resetPassword, sendOTP, sendToken, signup,login, userInfo, makeFriend} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.js";

const userRouter = Router()

userRouter.route("/sendOTP").post(sendOTP)
userRouter.route("/signup").post(upload.single("avatar"),signup)
userRouter.route("/login").post(login)
userRouter.route("/logout").post(verifyJWT,logout)
userRouter.route("/send-reset-token").post(sendToken)

userRouter.route("/reset-password").post(resetPassword)

userRouter.route("/change-dp").post(verifyJWT,upload.single("avatar"),changeDP)
userRouter.route("/user-info").get(verifyJWT,userInfo)
userRouter.route("/new-friend").post(verifyJWT,makeFriend)




export {userRouter}