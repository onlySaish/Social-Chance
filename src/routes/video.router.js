import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    deleteVideo,
    getAllVideos,
    getVideobyId,
    publishVideo,
    togglePublishStatus,
    updateVideo
} from "../controllers/video.controller.js";

const router = Router();

router.route("/publishVideo").post(verifyJWT, upload.fields([
    {
        name: "video",
        maxCount: 1    
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]),publishVideo);

router.route("/v/:videoId").get(verifyJWT,getVideobyId);
router.route("/updateVideo/:videoId").patch(verifyJWT,upload.single("thumbnail"),updateVideo);
router.route("/deleteVideo/v/:videoId").post(verifyJWT,deleteVideo);
router.route("/togglePublishStatus/v/:videoId").patch(verifyJWT,togglePublishStatus);
router.route("/getAllVideos").get(verifyJWT,getAllVideos);

export default router;