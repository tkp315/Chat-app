import cors from "cors";
import express, { json } from "express";
import cookieParser from "cookie-parser";
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());

app.use(json({ limit: "20KB" }));

app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

import { userRouter } from "./routes/user.route.js";
import { chatRouter } from "./routes/chat.route.js";
import { messageRouter } from "./routes/message.route.js";

app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/message", messageRouter);


export default app;
