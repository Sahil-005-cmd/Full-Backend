import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req,_,next)=>{
    try {
        const token = req.cookies?.accessToken || req.headers.Authorization?.replace("Bearer ","")
    
        if(!token){
            throw new ApiError(404,"Unauthorized Request")
        }
    
        const decodedToken = await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
    
        req.user = user
        next()
    } catch (err) {
        throw new ApiError(401,err?.message || "Invalid Access Token ")
    }
    
})