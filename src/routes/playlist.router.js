import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";

const router = Router();

// router.route("/createPlaylist").post(verifyJWT,createPlaylist);
// router.route("/getUserPlaylists/:userId").get(verifyJWT,getUserPlaylists);  

// router.route("/getPlaylistById/:playlistId").get(verifyJWT,getPlaylistById);
// router.route("/deletePlaylist/:playlistId").post(verifyJWT,deletePlaylist);
// router.route("/updatePlaylist/:playlistId").patch(verifyJWT,updatePlaylist);

// router.route("/addVideoToPlaylist/:playlistId/:videoId").post(verifyJWT,addVideoToPlaylist);
// router.route("/removeVideoFromPlaylist/:playlistId/:videoId").post(verifyJWT,removeVideoFromPlaylist);

router.use(verifyJWT);
router.route("/").post(createPlaylist);
router.route("/user/:userId").get(getUserPlaylists);  

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

router.route("/add/:playlistId/:videoId").patch(addVideoToPlaylist);
router.route("/remove/:playlistId/:videoId").patch(removeVideoFromPlaylist);

export default router;