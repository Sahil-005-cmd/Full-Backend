import { Router } from "express";
import { deleteVideo, getVideoById, publishAvideo, tooglePublishButton, updateVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

//! .js in imports

const router = Router();

router.use(verifyJWT)


router.route("/").post(upload.fields(
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

    
router.route("/:videoId")
    .get(getVideoById)
     //! yet to implement the updation of full vidoe
    .patch(upload.fields(
        [{
            name:"thumbnail",
            maxCount:1
        }]),
        updateVideo)
    .delete(deleteVideo)


router.route("/toogle/publish/:videoId").patch(tooglePublishButton)
export default router