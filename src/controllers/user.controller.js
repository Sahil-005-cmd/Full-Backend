import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"

const registerUser = asyncHandler(async (req,res)=>{
    // http://localhost:5000/api/v1/users/register


    // all values input 
    // validation - not empty
    // check if user already exist : username ,email
    // check avatar
    // upload to cloudinary
    // create user object - create entry 
    // remove password and refreshtoken from response
    // check for user creation
    // return res

    const {fullName,username,email,password} = req.body
    
    if([fullName,email,username,password].some(val => val?.trim() ==="")){
        throw new ApiError(400,"All text fields are required")
    }

    const userNameExist =await User.findOne({
        username
    })
    const emailExist =await User.findOne({
        email 
    })

    if(userNameExist || emailExist){
        let msg = "";
        if(userNameExist) { msg += "Username " }
        if(emailExist) { msg += " email" }
        msg += "already exist!!"
        throw new ApiError(409,msg)
    }
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath; 
  

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length> 0){
    coverImageLocalPath = req.files?.coverImage[0]?.path

    }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file required")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        username:username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering a user...")
    }
    
    return res.status(200).json(
        new ApiResponse(200,createdUser,"User registered Successfully...")
    )
})

export {registerUser}