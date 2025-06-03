import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req,res)=>{
    // ! May change later

    const video = req.params.video // here video is a complete obj not just id
    if(!video){
        throw ApiError(400,"Video does not exist")
    }
    
    const commentObjArray = await Comment.find({video:video._id})
    if(!commentObjArray){
        throw ApiError(400,"No comments present in the video")
    }
        
    // Aggregate funciton to be used for fetching the comments
    res.status(200).json(
        new ApiResponse(200,commentObjArray,"All Comments fetched successfully!")
    )
})

const createComment = asyncHandler(async (req,res)=>{

    //! May change later

    const user = req.user
    const video = req.video
    const commentContent = req.body.commentContent

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
    //! assuming the front end will provide the id
    //! assuming delete option will not be shown to other users rather than commentee himself
    const user = req.user
    const video = req.video
    const comment = req.comment // complete comment obejct

    if(!user){
        throw ApiError(401,"Unauthorized access to comment on video")
    }
    if(!video){
        throw ApiError(401,"Video does not exist, that you want to comment")
    }
    if(!comment){
        throw ApiError(401,"comment is not getting passed")
    }

    if(comment.owner !== user._id){
        throw new ApiError(400,"Unauthorized accesss to delete commetn")
    }

    try {
        const deleteComment = await Comment.findByIdAndDelete(comment._id)
        
        console.log(deleteComment)
        if(!deleteComment){
            throw new ApiError(401,"Somehting went wrong ");
        }
        res.status(200).json(
            new ApiResponse(200,deleteComment,"Comment has been deleted successfully...")
        )
    } catch (err){
        throw new ApiError(400,"Comment could not be deleted")
    }
})

const updateComment = asyncHandler(async (req,res)=>{

    //! May change later

    const user = req.user
    const video = req.video
    const comment = req.comment
    const newcomment = req.body.newcomment

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

    const updatedCommentRes = Comment.findById(comment._id)
    res.status(200).json(
        new ApiResponse(200,updatedCommentRes,"Comment has been updated successfully...")
    )
})

export {getVideoComments, createComment, deleteComment ,updateComment}