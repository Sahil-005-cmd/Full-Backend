import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req,res)=>{
    // ! May change later

    const {video} = req.params.video // here video is a complete obj not just id
    if(!video){
        throw ApiError(400,"Video does not exist")
    }
    
    const comments = await Comment.find({video:video._id})
    if(!comments){
        throw ApiError(400,"No comments present in the video")
    }
    
    // Aggregate funciton to be used for fetching the comments
    
})

const createComment = asyncHandler(async (req,res)=>{

    //! May change later

    const {user} = req.user
    const {video} = req.video
    const {commentContent} = req.body.commentContent

    if(!user){
        throw ApiError(401,"Unauthorized access to comment on video")
    }
    if(!video){
        throw ApiError(401,"Video does not exist, that you want to comment")
    }
    if(!commentContent){
        throw ApiError(401,"not able to get the comment to post on video")
    }

    const comment =await Comment.create({
        owner:user.id,
        content:commentContent,
        video: video._id // ! May change later
    })
    
    res.status(200).json(
        new ApiResponse(200,comment,"Commented on the video successfully...")
    )
})

const deleteComment = asyncHandler(async (req,res)=>{

    //! May change later

    const {user} = req.user
    const {video} = req.video
    const {comment} = req.comment

    if(!user){
        throw ApiError(401,"Unauthorized access to comment on video")
    }
    if(!video){
        throw ApiError(401,"Video does not exist, that you want to comment")
    }
    if(!comment){
        throw ApiError(401,"comment is not getting passed")
    }

    let deleteComment;
    try {
        deleteComment = await Comment.findByIdAndDelete(comment._id)
    } catch (err) {
        throw new ApiError(400,"Comment does not exist")
    }

    console.log(deleteComment)

    res.status(200).json(
        new ApiResponse(200,deleteComment,"Comment has been deleted successfully...")
    )
})
const updateComment = asyncHandler(async (req,res)=>{

    //! May change later

    const {user} = req.user
    const {video} = req.video
    const {comment} = req.comment
    const {newcomment} = req.body.newcomment

    if(!user){
        throw ApiError(401,"Unauthorized access to comment on video")
    }
    if(!video){
        throw ApiError(401,"Video does not exist, that you want to comment")
    }
    if(!comment){
        throw ApiError(401,"comment is not getting passed")
    }
    if(!newcomment){
        throw ApiError(401,"New commnet is not provided to be updated")
    }

    let existingComment;

    try {
        existingComment = await Comment.findById(comment._id)
    } catch (err) {
        throw new ApiError(400,"Comment does not exist")
    }
    if(!existingComment){
        throw ApiError(401,"Comment does not exist")
    }

    existingComment.content = newcomment
    existingComment.save({validateBeforeSave: false});

    res.status(200).json(
        new ApiResponse(200,updateComment,"Comment has been updated successfully...")
    )
})

export {getVideoComments, createComment, deleteComment ,updateComment}