import mongoose,{mongo, Schema} from "mongoose";

const tweetSchema = new Schema({
    owner:{type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    content:{type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
},{timestamps:true})

const Tweet = mongoose.model("Tweet",tweetSchema)

export {Tweet}