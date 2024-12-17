import { Router } from "express";
import {
    changeCurrentPassword,
    getChannelDetails,
    getCurrentUserDetails,
    getWatchHistory,
    refreshAccessToken,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    userLogin,
    userLogout,
    userRegister
    } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ])
,userRegister);

router.route("/login").post(userLogin);

//Secure Routes
router.route("/logout").post(verifyJWT, userLogout);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/changePassword").post(verifyJWT,changeCurrentPassword);
router.route("/currentUser").get(verifyJWT,getCurrentUserDetails);
router.route("/updateAccountDetails").patch(verifyJWT,updateAccountDetails);
router.route("/updateAvatar").patch(verifyJWT,upload.single("avatar"),updateAvatar);
router.route("/updateCoverImage").patch(verifyJWT,upload.single("coverImage"),updateCoverImage);
router.route("/c/:username").get(verifyJWT,getChannelDetails);
router.route("/watchhistory").get(verifyJWT,getWatchHistory);

export default router;