import Router from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment
} from "../controllers/comment.controller.js";

const router = Router();

// router.route("/getVideoComments/:videoId").get(getVideoComments);
// router.route("/addComment/:videoId").post(addComment);
// router.route("/updateComment/:commentId").patch(updateComment);
// router.route("/deleteComment/:commentId").post(deleteComment);

router.use(verifyJWT);
router
    .route("/v/:videoId")
    .get(getVideoComments)
    .post(addComment);

router
    .route("/c/:commentId")
    .patch(updateComment)
    .delete(deleteComment);

export default router;