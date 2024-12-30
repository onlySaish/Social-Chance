import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

const getChannelVideos = asyncHandler(async(req,res) => {
    const userId = req.user._id;

    const aggregate = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "channelVideos"
            }
        }
    ])

    // console.log(aggregate[0].channelVideos);

    res.status(200)
    .json(
        new ApiResponse(
            201,
            aggregate[0].channelVideos,
            "Fetched Channel Videos Successfully"
        )
    )
})

const getChannelStats = asyncHandler(async(req,res) => {
    const userId = req.user._id;

    const videoAggregate = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "channelVideos"
            }
        }
    ])
    // console.log(videoAggregate[0].channelVideos)

    const totalVideos = (videoAggregate[0].channelVideos).length;
    // console.log(totalVideos);

    let totalViews = 0;
    if (totalVideos != 0) {
        (videoAggregate[0].channelVideos).map((vid) => {
            totalViews += vid.views;
        })
    }
    // console.log(totalViews);

    const subsAggregate = await User.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "channelSubs"
            }
        }
    ]);
    // console.log(subsAggregate[0].channelSubs)

    const totalSubscribers = (subsAggregate[0].channelSubs).length;
    // console.log(totalSubscribers);

    const likesAggregate = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "channelVideos",
                pipeline: [
                    {
                        $lookup: {
                            from : "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "videoLikes"
                        }
                    },
                    {
                        $lookup: {
                            from: "comments",
                            localField: "_id",
                            foreignField: "video",
                            as: "videoComments"
                        }
                    },
                    {
                        $addFields: {
                            currVideoLikes: {
                                $size: "$videoLikes"
                            },
                            currVideoComments: {
                                $size: "$videoComments"
                            }
                        }
                    },
                    {
                        $project: {
                            currVideoLikes: 1,
                            currVideoComments: 1
                        }
                    }
                ]
            }
        }
    ])
    // console.log(likesAggregate[0].channelVideos);

    let totalLikes = 0;
    let totalComments = 0;
    
    if ((likesAggregate[0].channelVideos).length != 0){
        (likesAggregate[0].channelVideos).map((val) => {
            totalLikes += val.currVideoLikes;
            totalComments += val.currVideoComments;
        })
    }
    // console.log(totalLikes,totalComments);

    let responseData = {
        totalSubscribers : totalSubscribers,
        totalVideos: totalVideos,
        totalVideoViews: totalViews,
        totalVideoLikes: totalLikes,
        totalVideoComments: totalComments
    }

    res.status(200)
    .json(
        new ApiResponse(
            201,
            responseData,
            "Fetched Channel Stats Successfully"
        )
    )
    
})

export {
    getChannelVideos,
    getChannelStats
}