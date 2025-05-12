import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

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

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.headers.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(400,"refreshToken not present in cookies or headers")
    }

    const verifiedToken = jwt.verify(
        incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET
    )
    
    const user = await User.findById(verifiedToken._id).select("-password")

    if(!user){
        throw new ApiError(400,"Invalid refresh token")
    }

    if(user.refreshToken !== incomingRefreshToken){
        throw new ApiError(400,"Refresh Token is expired")
    }

    const options = {
        httpOnly:true,
        secure:true
    } 

        const {accessToken,newRefreshToken} = await generateAccessRefreshTokens(user._id);

        res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "New access and refresh tokens are created"
            )
        )
})


const changeCurrentPassword = asyncHandler(async (req,res)=>{
    // old pass, new pass
    // validation like anything wrong or missing
    // if old pass does not match
    // new pass store

        const {oldPassword,newPassword} = req.body;

        if(!oldPassword || !newPassword){
            throw new ApiError(400,"Provide both of the fields")
        }

        if(!req.user){
            throw new ApiError(400,"Unauthorized access to chagne password")
        }
        const user = await User.findById(req.user._id);

        if (!user) {
            throw new ApiError("Unauthorized access")
        }

        const verifyUser = await user.isPasswordCorrect(oldPassword)

        if(!verifyUser){
            throw new ApiError(400,"Unauthorized access with incorrect oldPassword")
        }
        user.password= newPassword
        await user.save({validateBeforeSave: false})

        const options = {
            httpOnly :true,
            secure :true
        }
        return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(
            new ApiResponse(200,{},"Password has been changed successfully.")
        )
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"Current user fetched successfully")

    )
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {fullName,email} = req.user

    if(!req.user){
        throw new ApiError(400,"Not able to get user from req")
        
    }
    if(!fullName &&  !email){
        throw new ApiError(400,"Atleast One field is required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            user,
            "Account details updated successfully"
        )
    )

})

const updateUserAvatar = asyncHandler(async (req,res)=>{
    const avatarLocalPath = req.file?.path
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar  on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")

    res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar has been updated successfully")
    )
})

const updateUserCoverImage= asyncHandler(async (req,res)=>{
    const coverImageLocalPath = req.file?.path
    
    if(!coverImageLocalPath){
        throw new ApiError(400,"CoverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading coverImage on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    res
    .status(200)
    .json(
        new ApiResponse(200,user,"CoverImage has been updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req,res)=>{
    const {username } = req.params 
    if(!username?.trim()){
        throw new ApiError(400,"User doesn't exhist")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField: "channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount :{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                coverImage:1,
                avatar:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1
            }
        }
    ])

    if(channel?.length){
        throw new ApiError(400,"channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"user Channed fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req,res)=>{
    const user= await User.aggregate([
        {
            $match:{_id:new mongoose.Types.ObjectId(req.user._id)}
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:_id,
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        avatar:1,
                                        coverImage:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully")
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}