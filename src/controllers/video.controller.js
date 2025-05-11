import { Video } from "../models/video.model"
import { ApiError } from "../utils/apiError"
import { ApiResponse } from "../utils/apiResponse"
import { asyncHandler } from "../utils/asyncHandler"
import { uploadOnCloudinary } from "../utils/cloudinary"

//! yet to check for js
//! yet to redefine the comments
//! any CUD operation req authentication if user is owner separate funciton is not implemented 
//! not mentioned return statement at end of every method

const publishAvideo = (asyncHandler(async (req,res)=>{
    // authentication, videoFile, title, thumbnail, description
    const {user} = req.user
    const {title,description} = req.body
    const videoFileLocalPath = req.files?.videoFile[0]?.path
    
    let thumbnailLocalPath;
    thumbnailLocalPath = req.files?.thumbnail[0]?.path
    // !  thumbnail case needs to be handled
    
    if(!(user && title && description && videoFile)){
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

    if(!videoFile){
        throw new ApiError(500,"Video is not published")
    }

    res.status(200)
    .json(new ApiResponse(200),video,"Video has been published successfully...")
}))

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(500,"Video id is not provided")
    }
    
    const video = await Video.findById(videoId)
    
    if(!video){
        throw new ApiError(500,"Video does not exist")
    }

    res.status(200).json(new ApiResponse(200,video,"Video has been fetched successfully..."))
}) 

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {user} = req.user

    //! Fresh new video file updation is not managed yet

    // if not owner
    const video = await Video.findById(videoId)
    if(user._id !== video.owner){
        throw new ApiError(400,"Unauthorized access to modify the video")
    }

    const updateData = {}
    if(req.body.title !== undefined) updateData.title = req.body.title
    if(req.body.description !== undefined) updateData.description = req.body.description

    let thumbnailLocalPath;
    thumbnailLocalPath = req.files?.thumbnail[0]?.path


    const thumbnail = thumbnailLocalPath ?await uploadOnCloudinary() : undefined;
    if(!thumbnail) updateData.thumbnail = thumbnail

    
    for(const [key,val] of Object.entries(updateData)){
        video[key] = val;
    }
    video.save()

    res.status(200).json(new ApiResponse(200,updateData,"Data has been updated successfully..."))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {user} = req.user

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

export { publishAvideo, getVideoById, updateVideo, deleteVideo }