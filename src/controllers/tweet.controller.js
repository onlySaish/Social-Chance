import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.models.js";
import mongoose, { isValidObjectId } from "mongoose";

const createTweet = asyncHandler(async(req,res) => {
    const {tweetContent} = req.body;
    const userId = req.user._id;

    if (!(tweetContent)) {throw new ApiError(400,"Tweet Content is Required")};

    const newTweet = await Tweet.create({
        owner: new mongoose.Types.ObjectId(userId),
        content: tweetContent
    })

    if (!newTweet) {throw new ApiError(400,"Error Creating New Tweet")};
    res.status(200)
    .json(
        new ApiResponse(
            201,
            newTweet,
            "Successfully created New Tweet"
        )
    )
})

const getUserTweets = asyncHandler(async(req,res) => {
    const userId = req.user._id;

    const userTweets = await Tweet.find({
        owner: new mongoose.Types.ObjectId(userId)
    }).select("-owner")

    res.status(200)
    .json(
        new ApiResponse(
            201,
            userTweets,
            `Fetched User Tweets Successfully. User have ${userTweets.length} Tweets`
        )
    )
})

const updateTweet = asyncHandler(async(req,res) => {
    const {tweetId} = req.params;
    const {tweetContent} = req.body;

    if (!(tweetId && isValidObjectId(tweetId))) {throw new ApiError(400,"Invalid Tweet ID")};
    if (!tweetContent) {throw new ApiError(400, "Tweet Content is Required")};

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {throw new ApiError(404,"Tweet not Found")};

    tweet.content = tweetContent;
    await tweet.save({validateBeforeSave: false});

    res.status(200)
    .json(
        new ApiResponse(
            201,
            tweet,
            "Tweet Updated Successfully"
        )
    )

})

const deleteTweet = asyncHandler(async(req,res) => {
    const {tweetId} = req.params;
    if (!(tweetId && isValidObjectId(tweetId))) {throw new ApiError(400,"Invalid Tweet ID")};

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!deletedTweet) {throw new ApiError(400,"Tweet not Found")};

    res.status(200)
    .json(
        new ApiResponse(
            201,
            deletedTweet,
            "Tweet Deleted Successfully"
        )
    )

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}