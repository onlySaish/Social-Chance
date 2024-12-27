import mongoose, { isValidObjectId } from "mongoose";
import {Subscription} from "../models/subscription.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js";
import {User} from "../models/user.models.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { subscribe } from "diagnostics_channel";

// const subscribe = asyncHandler(async(req,res) => {
//     const {channelId} = req.params;
//     const user = req.user;
//     const userId = user._id;

//     // console.log(channelId,userId);    
//     if (!(userId)) {throw new ApiError(404, "userId not found")}
//     if (!(isValidObjectId(channelId))) {throw new ApiError(400,"Incorrect ChannelId")}

//     const addSubscriber = await Subscription.create({
//         subscriber : userId,
//         channel: channelId
//     })

//     if (!addSubscriber) {throw new ApiError(400, "Something went wrong while subscribing channel")};

    // return res.status(200)
    // .json(
    //     new ApiResponse(201, "Subscribed Successfully")
    // )

// })

// const unSubscribe = asyncHandler(async(req,res) => {
//     const user = req.user;
//     const {channelId} = req.params;

    
//     if (!(channelId && isValidObjectId(channelId)) ) {throw new ApiError(400,"Error Getting ChannelId")};
//     // console.log(channelId,user._id);
    
//     const checkSubscribe = await Subscription.find({
//         subscriber: user._id,
//         channel: channelId
//     })

//     if (!checkSubscribe) {throw new ApiError(400, "User is not subscribed")};

//     // console.log(checkSubscribe, checkSubscribe[0]._id);

//     const unsubscribedUser = await Subscription.findByIdAndDelete(checkSubscribe[0]._id);

//     return res.status(200)
//     .json(
//         new ApiResponse(
//             201,
//             {unsubscribedUser},
//             "Unsubscribed Successfully"
//         )
//     )
// })

const toggleSubscription = asyncHandler(async(req,res) => {
    const {channelId} = req.params;
    const user = req.user
    const userId = user._id;

    if (!(channelId && isValidObjectId(channelId))) {throw new ApiError(400, "Error getting Channel Id")};

    const isSubscribed = await Subscription.find({
        subscriber: userId,
        channel: channelId
    })

    // console.log(isSubscribed);

    if (isSubscribed.length != 0) {
        //Here user is Subscribed so Unsubscribe here
        const unsubscribedUser = await Subscription.findByIdAndDelete(isSubscribed[0]._id);
        return res.status(200)
        .json(
            new ApiResponse(
                201,
                {unsubscribedUser},
                "Unsubscribed Successfully"
            )
        )
    } else {
        //Here user is not Subscribed so Subscribe here
        const addSubscriber = await Subscription.create({
            subscriber: userId,
            channel: channelId
        })
        if (!addSubscriber) {throw new ApiError(400, "Error subscribing channel")};

        return res.status(200)
        .json(
            new ApiResponse(201,{addSubscriber}, "Subscribed Successfully")
        )
    }
})

// const getUserChannelSubcribers = asyncHandler(async(req,res) => {
//     const user = req.user;
//     const channelId = user._id;

//     // if (!(channelId && isValidObjectId(channelId))) {throw new ApiError(400,"Error getting ChannelId")};
//     if (!channelId) {throw new ApiError(404,"Channel Not found")}

//     const subscribers = await Subscription.find({
//         channel: channelId
//     })

//     let subs = [];

//     subscribers.map((val) => (
//         console.log(val.subscriber)
//     ))

//     console.log(subscribers);
//     res.status(200);
// })

const getUserChannelSubcribers = asyncHandler(async(req,res) => {
    const user = req.user;
    const {channelId} = req.params;

    // const aggregate = await User.aggregate([
    //     {
    //         $match: {
    //             _id : new mongoose.Types.ObjectId(channelId)
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "subscriptions",
    //             localField: "_id",
    //             foreignField: "channel",
    //             as: "subscribers",
    //             pipeline: [
    //                 {
    //                     $lookup: {
    //                         from: "users",
    //                         localField: "subscriber",
    //                         foreignField: "_id",
    //                         as: "subs",
    //                         pipeline: [
    //                             {
    //                                 $project: {
    //                                     username: 1
    //                                 }
    //                             }
    //                         ]
    //                     }
    //                 },
    //                 {
    //                     $addFields: {
    //                         fans: {
    //                             $first: "$subs"
    //                         }
    //                     }
    //                 },
    //                 {
    //                     $project: {
    //                         fans:1
    //                     }
    //                 }
    //             ]
    //         }
    //     },
    //     {
    //         $addFields: {
    //             subscribersCount : {
    //                 $size: "$subscribers"
    //             }
    //         }
    //     },
    //     {
    //         $project: {
    //             subscribersCount: 1
    //         }
    //     }
    // ])

    const aggregate = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberInfo",
                pipeline: [
                    {
                        $project: {
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriberDetails : {
                    $first : "$subscriberInfo"
                }
            }
        },
        {
            $project: {
                _id: 0,
                subscriberDetails:1
            }
        }
    ])

    // console.log(aggregate);

    res.status(200)
    .json(
        new ApiResponse(
            201,
            aggregate,
            "Fetched Subscribers Success"
        )
    )
})

const getSubscribedChannels = asyncHandler(async(req,res) => {
    const user = req.user;

    const aggregate = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(user._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channelInfo: {
                    $first: "$subscribedChannels"
                }
            }
        },
        {
            $project: {
                channelInfo: 1,
                _id: 0
            }
        }
    ])

    // console.log(aggregate,aggregate.length);

    res.status(200)
    .json(
        new ApiResponse(
            201,
            aggregate,
            "Fetched Subscribed Channels Successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubcribers,
    getSubscribedChannels
}