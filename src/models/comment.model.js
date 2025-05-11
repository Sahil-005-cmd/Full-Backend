import mongoose,{mongo, Schema} from "mongoose";

const commentSchema = new Schema({
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    content:{
        type:String,
        required:true
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video",
        required:true
    }
},{timestamps:true})

const Comment = mongoose.model("Comment",commentSchema)

export {Comment}