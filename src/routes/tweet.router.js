import Router from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet
} from '../controllers/tweet.controller.js';

const router = Router();

router.use(verifyJWT);
// router.route("/createTweet").post(createTweet);
// router.route("/getUserTweets").get(getUserTweets);
// router.route("/updateTweet/:tweetId").patch(updateTweet);
// router.route("/deleteTweet/:tweetId").post(deleteTweet);

router.route("/").post(createTweet);
router.route("/user").get(getUserTweets);

router
    .route("/:tweetId")
    .patch(updateTweet)
    .delete(deleteTweet);

export default router;