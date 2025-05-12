import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

//! yet to check for js
//! yet to redefine the comments
//! any CUD operation req authentication if user is owner separate funciton is not implemented 
//! not mentioned return statement at end of every method


const publishAvideo = (asyncHandler(async (req,res)=>{
    // authentication, videoFile, title, thumbnail, description
    const user = req.user
    const {title,description} = req.body
    const videoFileLocalPath = req.files?.videoFile[0]?.path
    let thumbnailLocalPath;
    thumbnailLocalPath = req.files?.thumbnail[0]?.path
    // ! thumbnail case needs to be handled
    
    if(!(user && title && description && videoFileLocalPath)){
        throw new ApiError(400,"All of the fields except thumbnail are required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath) // complete obj is returned not url
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath) // complete obj is returned not url

    if(!videoFile){
        throw new ApiError(500,"cloudinary video file return problem")
    }

    
    const video = await Video.create({
        owner:user._id,
        duration: videoFile.duration, // to be managed
        videoFile:videoFile.url,
        thumbnail:thumbnail?.url || "",
        title,
        description,
    })

    if(!video){
        throw new ApiError(500,"Video is not published")
    }

    res.status(200)
    .json(new ApiResponse(200),video,"Video has been published successfully...")
}))

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // console.log(typeof videoId )
    if(!videoId){
        throw new ApiError(500,"Video id is not provided")
    }
    console.log(videoId)
    const video = await Video.findById(new mongoose.Types.ObjectId( videoId ))
    
    if(!video){
        throw new ApiError(500,"Video does not exist")
    }

    res.status(200).json(new ApiResponse(200,video,"Video has been fetched successfully..."))
}) 

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const user = req.user

    //! Fresh new video file updation is not managed yet

    // if not owner
    const video = await Video.findById(new mongoose.Types.ObjectId( videoId ))
    if(String(user._id) !== String(video.owner)){
        throw new ApiError(400,"Unauthorized access to modify the video")
    }

    const updateData = {}
    if(req.body.title !== undefined) updateData.title = req.body.title
    if(req.body.description !== undefined) updateData.description = req.body.description

    let thumbnailLocalPath;
    thumbnailLocalPath = req.files?.thumbnail[0]?.path

    const thumbnail = thumbnailLocalPath ? await uploadOnCloudinary(thumbnailLocalPath) : undefined;
    if(thumbnail) updateData.thumbnail = thumbnail.url

    
    for(const [key,val] of Object.entries(updateData)){
        video[key] = val;
    }
    await video.save()

    res.status(200).json(new ApiResponse(200,updateData,"Data has been updated successfully..."))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const user = req.user

    if(!videoId){
        throw new ApiError(400,"Video id not provided")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Video does not exist")
    }

    if(user._id !== video.owner){
        throw new ApiError(400,"Unauthorized access to modify the video")
    }

    await video.deleteOne();

    return res.status(200).json(new ApiResponse(200,{},"Video has been deleted successfully..."))
})

const tooglePublishButton = asyncHandler(async (req,res)=>{
    const {videoId}=  req.params
    const {published}= req.body
    const user = req.user
    
    if(!videoId){
        throw new ApiError(400,"No id provided to toogle publish")
    }
    const video = await Video.findById(new mongoose.Types.ObjectId( videoId ))

    if(String(user._id) !== String(video.owner)){
        throw new ApiError(400,"Unauthorized access to toogle publish button")
    }

    video.isPublished = published
    await video.save()
    
    if(!video){
        throw new ApiError(400,"No vidoe found with corresponding id")
    }

    res.status(200).json(new ApiResponse(200,{isPublished:video.isPublished},"Toogle button has been changed"))
})

export { publishAvideo, getVideoById, updateVideo, deleteVideo, tooglePublishButton}