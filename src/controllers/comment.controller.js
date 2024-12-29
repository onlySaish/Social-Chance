import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import mongoose, { isValidObjectId } from "mongoose";

const getVideoComments = asyncHandler(async(req,res) => {
    const {videoId} = req.params;
    const {page = 1,limit = 10} = req.query;

    const aggregate = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from : "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentOwner",
                pipeline: [
                    {
                        $project: {
                            username:1,
                            _id: 0
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                commentOwner : {
                    $first: "$commentOwner"
                }
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
                _id:0,
                content:1,
                commentOwner:1
            }
        }
    ])

    // console.log(aggregate);
    res.status(200)
    .json(
        new ApiResponse(
            201,
            aggregate,
            `Fetched All Comments Successfully. Video has ${aggregate.length} comments`
        )
    )
})

const addComment = asyncHandler(async(req,res) => {
    const {commentContent} = req.body;
    const userId =  req.user._id;
    const {videoId} = req.params;

    if (!commentContent) {400, "Comment Cannot be Empty"};
    if (!(videoId && isValidObjectId(videoId))) {400,"Invalid VideoId"}

    const isVideoAvailable = await Video.findById(videoId);
    if (!isVideoAvailable) {throw new ApiError(400,"Video not Found")}

    const newComment = await Comment.create({
        content: commentContent,
        video: new mongoose.Types.ObjectId(videoId),
        owner: new mongoose.Types.ObjectId(userId) 
    })
    
    if (!newComment) {throw new ApiError(400, "Error adding new Comment")};

    res.status(200)
    .json(
        new ApiResponse(
            201,
            newComment,
            "Added New Comment Successfully"
        )
    )
})

const updateComment = asyncHandler(async(req,res) => {
    const {commentContent} = req.body;
    const userId =  req.user._id;
    const {commentId} = req.params;

    if (!commentContent) {400, "Comment Cannot be Empty"};
    if (!(commentId && isValidObjectId(commentId))) {400,"Invalid Comment ID"};

    const comment = await Comment.findById(commentId);
    if (!comment) {throw new ApiError(400, "Comment Not Found")}

    comment.content = commentContent;
    await comment.save({validateBeforeSave : false});

    res.status(200)
    .json(
        new ApiResponse(
            201,
            comment,
            "Comment Updated Successfully"
        )
    )
})

const deleteComment = asyncHandler(async(req,res) => {
    const userId =  req.user._id;
    const {commentId} = req.params;

    if (!(commentId && isValidObjectId(commentId))) {400,"Invalid Comment ID"};

    const comment = await Comment.findByIdAndDelete(commentId);
    if (!comment) {throw new ApiError(400, "Comment Not Found")}

    res.status(200)
    .json(
        new ApiResponse(
            201,
            comment,
            "Comment Deleted Successfully"
        )
    )
})

export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
}