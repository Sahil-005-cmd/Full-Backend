import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import bcrypt from "bcrypt"

const generateAccessRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken;
        // console.log(user.refreshToken)
        await user.save({validateBeforeSave : false})

        return {accessToken,refreshToken}

    } catch (err) {
        console.log(err)
        throw new ApiError(500,"Not able to generate access refresh token...")
    }
}

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

const loginUser = asyncHandler(async (req,res)=>{
    // email / username, password
    // user exist or not 
    // process the values we have got(trim and lowercase)
    // bcrypt the password and verify
    // tokens
    // send cookie
    console.log(req.body)
    const {username,email,password} = req.body
    // const givenEmail = email?true:false;
    // const givenUsername = username?true:false;

    if(!(username || email)){
        throw new ApiError(400,"Provide either username or email")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })
    // console.log(user)

    if(!user){
        throw new ApiError(404,"User not found")
    }

    if(!password){
        throw new ApiError(400,"Enter Password")
    }
    // console.log(password)
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    // console.log(isPasswordCorrect)
    if(!isPasswordCorrect){
        throw new ApiError(401,"Incorrect password")
    }

    const {accessToken , refreshToken} = await generateAccessRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User loggen in successfully!!"
        )
    )
})


const logoutUser= asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            } 
        },
        {
            new:true
        }
    )

    const  options = {
        httpOnly :true,
        secure:true
    } 

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Successfully logged out"))
})

export {
    registerUser,
    loginUser,
    logoutUser
}