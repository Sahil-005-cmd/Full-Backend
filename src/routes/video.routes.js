import { Router } from "express";
import { deleteVideo, getVideoById, publishAvideo, tooglePublishButton, updateVideo } from "../controllers/video.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

//! .js in imports

const router = Router();

router.use(verifyJWT)

router.route("/watch/:videoId").get(getVideoById)

router.route("/:videoId")
.get(getVideoById)
.post(upload.fields(
    [
    {
        name:"videoFile",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }]),
    publishAvideo)
 //! yet to implement the updation of full vidoe
.patch(upload.fields(
    [{
        name:"thumbnail",
        maxCount:1
    }]),
    updateVideo)
.delete(deleteVideo)


router.route("/toogle/publish/:videoId").put(tooglePublishButton)
export default router