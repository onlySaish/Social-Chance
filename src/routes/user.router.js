import { Router } from "express";
import { changeCurrentPassword, getCurrentUserDetails, refreshAccessToken, updateAccountDetails, updateAvatar, updateCoverImage, userLogin, userLogout, userRegister } from "../controllers/user.controller.js";
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
router.route("/updateAccountDetails").post(verifyJWT,updateAccountDetails);
router.route("/updateAvatar").post(upload.single("avatar"),verifyJWT,updateAvatar);
router.route("/updateCoverImage").post(upload.single("coverImage"),verifyJWT,updateCoverImage);

export default router;