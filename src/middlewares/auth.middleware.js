import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError.js";
import asyncHandlerFunction from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


const sessionTime = asyncHandlerFunction(async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "").trim();
  
  if (!refreshToken) {
  throw new ApiError(401,"token expired, sorry");
  }


  try {
    const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "User not found");
  }
    const newAccessToken = jwt.sign(
      {
        name: user.name,
        _id: user._id,
        email: user.email,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: `${process.env.ACCESS_TOKEN_EXPIRY}m`,
      }
    );
  
    req.user = user;
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Adjusted for local environment
    });
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid token");
  }
  
  

 
});

const verifyJWT = asyncHandlerFunction(async (req, res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "").trim();
 
  if (!token) {
    return sessionTime(req, res, next);
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401,"user not found");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Handle the expired token
      return sessionTime(req, res, next);
    } else {
      // Handle other JWT errors
      return res.status(401).json({ message: error.message });
    }
  }
});



export { verifyJWT };
