import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.models.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js"
import { Comment } from "../models/comment.models.js";
import { Tweet } from "../models/tweet.models.js";
import mongoose, { isValidObjectId } from "mongoose";

const toggleVideoLike = asyncHandler(async(req,res) => {
    const {videoId} = req.params;
    const user = req.user;
    const userId = user._id;

    if (!(videoId && isValidObjectId(videoId))) {throw new ApiError(400,"Invalid Video ID")};

    const isVideoAvailable = await Video.findById(videoId);
    if (!isVideoAvailable) {throw new ApiError(400, "Video Not Found")};

    const isVideoLiked = await Like.find({
        video: new mongoose.Types.ObjectId(videoId),
        likedBy: new mongoose.Types.ObjectId(userId)
    })
    // console.log(isVideoLiked);
    
    let responseData, responseMsg;
    if (isVideoLiked.length != 0){
        //Video is liked by user -> Delete like from video by user
        const unlikedVideo = await Like.findByIdAndDelete(isVideoLiked[0]._id).select("-_id");
        // console.log(unlikedVideo);
        
        responseData = unlikedVideo;
        responseMsg = "Video Like Removed Successfully"
    } else {
        //Video is not liked by user -> Create like for video by user
        const likedVideo = await Like.create({
            video: new mongoose.Types.ObjectId(videoId),
            likedBy: new mongoose.Types.ObjectId(userId)
        });
        responseData = likedVideo;
        responseMsg = "Video Liked Successfully"
    }

    res.status(200)
    .json(
        new ApiResponse(
            201,
            responseData,
            responseMsg
        )
    )
})

const toggleCommentLike = asyncHandler(async(req,res) => {
    const {commentId} = req.params;
    const userId = req.user._id;
    if (!(commentId && isValidObjectId(commentId))) {throw new ApiError(400,"Invalid Comment ID")};

    const isCommentAvailable = await Comment.findById(commentId);
    if (!isCommentAvailable) {throw new ApiError(404,"Comment Not Found")};

    const isVideoLiked = await Like.find({
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(userId)
    })

    let responseData,responseMsg;
    if (isVideoLiked.length != 0){
        const unlikeComment = await Like.findByIdAndDelete(isVideoLiked[0]._id);
        responseData = unlikeComment;
        responseMsg = "Comment Like Removed Successfully"
    } else {
        const likeComment = await Like.create({
            comment: new mongoose.Types.ObjectId(commentId),
            likedBy: new mongoose.Types.ObjectId(userId)
        })
        responseData = likeComment;
        responseMsg = "Comment Liked Successfully"
    }

    res.status(200)
    .json(
        new ApiResponse(
            201,
            responseData,
            responseMsg
        )
    )

})

const toggleTweetLike = asyncHandler(async(req,res) => {
    const {tweetId} = req.params;
    const userId = req.user._id;
    if (!(tweetId && isValidObjectId(tweetId))) {throw new ApiError(400,"Invalid Tweet ID")};

    const isTweetAvailable = await Tweet.findById(tweetId);
    if (!isTweetAvailable) {throw new ApiError(404,"Tweet Not Found")};

    const isTweetLiked = await Like.find({
        tweet: new mongoose.Types.ObjectId(tweetId),
        likedBy: new mongoose.Types.ObjectId(userId)
    })

    let responseData,responseMsg;
    if (isTweetLiked.length != 0){
        const unlikeTweet = await Like.findByIdAndDelete(isTweetLiked[0]._id);
        responseData = unlikeTweet;
        responseMsg = "Tweet Like Removed Successfully"
    } else {
        const likeTweet = await Like.create({
            tweet: new mongoose.Types.ObjectId(tweetId),
            likedBy: new mongoose.Types.ObjectId(userId)
        })
        responseData = likeTweet;
        responseMsg = "Tweet Liked Successfully"
    }

    res.status(200)
    .json(
        new ApiResponse(
            201,
            responseData,
            responseMsg
        )
    )

})

const getLikedVideos = asyncHandler(async(req,res) => {
    const user = req.user;

    const likedVideos = await Like.find({
        likedBy: new mongoose.Types.ObjectId(user._id)
    }).select("-_id -likedBy")
    
    res.status(200)
    .json(
        new ApiResponse(
            201,
            likedVideos,
            `Fetched Liked Videos SuccessFully. User have Liked ${likedVideos.length} videos`
        )
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}
