import {Video} from '../models/video.models.js'
import { User } from "../models/user.models.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import ApiError from '../utils/ApiError.js';
import { deleteFromCloudinary, getPublicIdFromUrl, uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from 'mongoose';
import { query } from 'express';

// const getAllVideos = asyncHandler(async(req,res) => {
//     // const { page = 1,limit = 10, query, sortBy,sortType, userId} = req.query
//     const {userId, page = 1,limit = 10} = req.body
//     const options = {
//         page, limit
//     }

//     const user = await User.aggregate([
//         {
//             $match: {
//                 _id: new mongoose.Types.ObjectId(userId)
//             }
//         },
//         {
//             $lookup: {
//                 from: "videos",
//                 localField: "_id",
//                 foreignField: "owner",
//                 as: "channelVideos",
//                 pipeline: [
//                     {
//                         $project: {
//                             _id: 0,
//                             videoFile: 1,
//                             thumbnail: 1,
//                             title: 1,
//                             description: 1,
//                             duration: 1,
//                             views: 1,
//                             isPublished: 1,
//                         }
//                     }
//                 ]
//             }
//         },
//     ])

//     if (!user.length) {throw new ApiError(400,"Videos Not Available")}

//     user.paginateExec(options, function(err,res){   
//         if(err) {
//             console.err(err);
//         }
//         else {
//             console.log(results);
//         }
//     })
//     // console.log(user[0].channelVideos)
//     // console.log(user);

//     // await User.aggregatePaginate(user,options, function(err,res){
//     //     if (!err){
//     //         console.log(res)
//     //     } else {
//     //         console.log(err);
//     //     }
//     // })

//     // const result = await User.aggregatePaginate(user, options)
//     // console.log(result);        

//     // console.log(user[0].channelVideos)

//     return res.status(200)
//     .json(
//         new ApiResponse(
//             201,
//             user[0].channelVideos,
//             "All Videos Fetched Successfully"
//         )
//     )
// })

const getAllVideos = asyncHandler(async(req,res) => {
        const {userId, page = 1,limit = 10,query, sortBy, sortType} = req.query

        const match = {}
        if (userId) {match._id = new mongoose.Types.ObjectId(userId)} 
        if (!query) {
            match.$or = [
                {title: {$regex : query, $options : "i"}},
                {description: {$regex : query, $options : "i"}}
            ]
        }

        const aggregate = await User.aggregate([
                    {
                        $match: match
                    },
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "channelVideos",
                            pipeline: [
                                {
                                    $sort: {
                                        [sortBy]: sortType === 'desc'? -1 : 1
                                    }
                                },
                                {
                                    $skip: (page-1)*limit
                                },
                                {
                                    $limit: parseInt(limit)
                                },
                                {
                                    $project: {
                                        _id: 0,
                                        videoFile: 1,
                                        thumbnail: 1,
                                        title: 1,
                                        description: 1,
                                        duration: 1,
                                        views: 1,
                                        isPublished: 1,
                                    }
                                }
                            ]
                        }
                    },

                ])
            
        if (!aggregate.length) {throw new ApiError(400,"Videos Not Available")}
        
        // const total = await User.countDocuments(aggregate[0].channelVideos)

        res.status(200)
        .json(
            new ApiResponse(
                201,
                {
                    videos : aggregate[0].channelVideos,
                    pagination: {
                        currentPage : parseInt(page),
                        // totalVideos: total,
                        // totalPages: Math.ceil(total/limit)
                    }
                },
                "Videos Fetched Success"
            )
        )
})

const publishVideo = asyncHandler(async(req,res) => {
    const owner = req.user?._id;
    if (!owner) {throw new ApiError(400, "Unauthorized Access")}

    const {title, description} = req.body
    if ( !(title && description) ) {throw new ApiError(404, "All fields are Required")};

    const videoLocalPath = req.files?.video[0].path;
    if (!videoLocalPath) {throw new ApiError(404, "Video not Found")};

    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    if (!thumbnailLocalPath) {throw new ApiError(404, "Thumbnail not Found")}

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    if (!videoFile) {throw new ApiError(500, "Video Upload on Cloudinary Failed")}

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {throw new ApiError(500, "Thumbnail Upload on Cloudinary Failed")}

    const duration = videoFile.duration;

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner,
        title,
        description,
        duration,
        isPublished: true
    })

    if (!video) {throw new ApiError(400, "Error while uploading Video")}

    return res.status(200)
    .json(
        new ApiResponse(
            201,
            {video},
            "Video Uploaded Successfully"
        )
    )

})

const getVideobyId = asyncHandler(async(req,res) => {
    const {videoId} = req.params;
    if (!videoId) {throw new ApiError(400,"Video ID not found")};

    const video = await Video.findById(
        new mongoose.Types.ObjectId(videoId)
    );
    if (!video) {throw new ApiError(404, "Video not Found")};

    const videoUrl = video.videoFile;
    return res.status(200)
    .json(
        new ApiResponse(
            201,
            videoUrl,
            "Video Fetched Successfully"
        )
    )
})

const updateVideo = asyncHandler(async(req,res) => {
    const {videoId} = req.params;
    const {title,description} = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!videoId) {throw new ApiError(400,"Video ID not found")};
    if ( !(title && description && thumbnailLocalPath) ) {throw new ApiError(404, "All Fields are Required")};

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail) {throw new ApiError(400, "Error while uploading Thumbnail on Cloudinary")}

    const vid = await Video.findById(videoId);
    const oldThumbnail = vid.thumbnail;

    const video = await Video.findByIdAndUpdate(
        new mongoose.Types.ObjectId(videoId),
        {
            title: title,
            description: description,
            thumbnail: thumbnail.url
        },
        {new: true}
    );

    if (!video) {throw new ApiError(400, "Video not Found")};
    
    try {
        getPublicIdFromUrl(oldThumbnail)
        .then((value) => deleteFromCloudinary(value,"image"))
    } catch (error) {
        throw new ApiError(400, "Error Deleting old file from cloudinary")
    }
    

    return res.status(200)
    .json(
        new ApiResponse(
            201,
            video,
            "Updated Video Details Successfully"
        )
    )
})

const deleteVideo = asyncHandler(async(req,res) => {
    const {videoId} = req.params;

    const video = await Video.findById(videoId);
    if (!video) {throw new ApiError(404, "Video not Found")}

    const thumbnail = video.thumbnail;
    const videoFile = video.videoFile;

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    try {
        getPublicIdFromUrl(thumbnail)
        .then(async(val) => deleteFromCloudinary(val,"image"));
    
        getPublicIdFromUrl(videoFile)
        .then(async(val) => deleteFromCloudinary(val,"video"));
    } catch (error) {
        throw new ApiError(400, "Error deleting files from cloudinary")
    }

    return res.status(200)
    .json(
        new ApiResponse(
            201,
            {deletedVideo},
            "Video Deleted Successfully"
        )
    )
})

const togglePublishStatus = asyncHandler(async(req,res) => {
    const {videoId} = req.params;

    const video = await Video.findById(videoId);
    if (!video) {throw new ApiError(404, "Video Not Found")};

    video.isPublished = !(video.isPublished);
    await video.save({validateBeforeSave : false});

    return res.status(200)
    .json(
        new ApiResponse(
            201,
            video.isPublished,
            "Toggled Video Publish Status Successfully"

        )
    )
})

export {
    publishVideo,
    getVideobyId,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos
}