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

// router.route("/publishVideo").post(verifyJWT, upload.fields([
//     {
//         name: "video",
//         maxCount: 1    
//     },
//     {
//         name: "thumbnail",
//         maxCount: 1
//     }
// ]),publishVideo);
// router.route("/getAllVideos").get(verifyJWT,getAllVideos);

// router.route("/v/:videoId").get(verifyJWT,getVideobyId);
// router.route("/updateVideo/:videoId").patch(verifyJWT,upload.single("thumbnail"),updateVideo);
// router.route("/deleteVideo/v/:videoId").delete(verifyJWT,deleteVideo);

router.use(verifyJWT);

router
.route("/")
.get(getAllVideos)
.post(upload.fields([
        {
            name: "video",
            maxCount: 1    
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),publishVideo);

router
    .route("/v/:videoId")
    .get(getVideobyId)
    .patch(upload.single("thumbnail"),updateVideo)
    .delete(deleteVideo);

router.route("/togglePublishStatus/v/:videoId").patch(togglePublishStatus);

export default router;