import {Router} from "express";
import {
    getSubscribedChannels,
    getUserChannelSubcribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/toggleSubscription/:channelId").post(verifyJWT,toggleSubscription);
router.route("/getUserChannelSubcribers/:channelId").get(verifyJWT,getUserChannelSubcribers);
router.route("/getSubscribedChannels").get(verifyJWT,getSubscribedChannels)

// router.route("/subscribe/:channelId").post(verifyJWT, subscribe);
// router.route("/unSubscribe/:channelId").post(verifyJWT, unSubscribe);

export default router;