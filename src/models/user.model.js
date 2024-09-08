import mongoose,{Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema =new  Schema(
{
fullName:{
    type:String,
    required:true,
    trim:true
},
email:{
    type:String,
    required:true,
    trim:true ,
     unique:true
},
password:{
    type:String,
    required:true
},
avatar:{
    type:String,
    default:"https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg?s=612x612&w=0&k=20&c=yBeyba0hUkh14_jgv1OKqIH0CCSWU_4ckRkAoy2p73o=",
    required:false
},

Chats:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Chat"
    }
],
FriendList:[
    {
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    }
],

refreshToken:{
    type:String
},
resetToken:{
    type:String
},
lastSeen:{
  type:Date,
},
isOnline:{
  type:Boolean
}

},{timestamps:true})


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
  
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });
  
  userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
      {
        password: this.password,
        _id: this._id,
        fullName: this.fullName,
        email: this.email,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: `${process.env.ACCESS_TOKEN_EXPIRY}d`,
      }
    );
  };
  
  userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
      {
        password: this.password,
        _id: this._id,
        fullName: this.fullName,
        email: this.email,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: `${process.env.REFRESH_TOKEN_EXPIRY}d`,
      }
    );
  };

export const User = mongoose.model("User",userSchema);