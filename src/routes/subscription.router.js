import {Router} from "express";
import {
    getSubscribedChannels,
    getUserChannelSubcribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

// router.route("/toggleSubscription/:channelId").post(toggleSubscription);
// router.route("/getUserChannelSubcribers/:channelId").get(getUserChannelSubcribers);

router
    .route("/s/:channelId")
    .get(verifyJWT,getUserChannelSubcribers)
    .post(verifyJWT,toggleSubscription);

router.route("/getSubscribedChannels").get(getSubscribedChannels)

// router.route("/subscribe/:channelId").post(verifyJWT, subscribe);
// router.route("/unSubscribe/:channelId").post(verifyJWT, unSubscribe);

export default router;