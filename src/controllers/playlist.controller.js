import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async(req,res) => {
    const {name,description} = req.body;    
    const user = req.user;

    if (!(name && description)) {throw new ApiError(404, "Playlist Name and Description not found")}

    const newPlaylist = await Playlist.create({
        name : name,
        description: description,
        owner : user._id,
    })

    if (!newPlaylist) {throw new ApiError(400, "Some Error Occured while creating new playlist")}
    // console.log(newPlaylist);

    res.status(200)
    .json(
        new ApiResponse(
            201,
            newPlaylist,
            "PLaylist Created Successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async(req,res) => {
    const {userId} = req.params;
    // console.log(userId);
    if (!(userId && isValidObjectId(userId))) {throw new ApiError(400,"Invalid userId")}

    const userPlaylists = await Playlist.find({
        owner: new mongoose.Types.ObjectId(userId)
    }).select("-_id -owner")

    // console.log(userPlaylists);
    if (!userPlaylists.length) {throw new ApiError(400, "User does not have any playlists")}

    res.status(200)
    .json(
        new ApiResponse(
            201,
            userPlaylists,
            "Fetched User Playlists Successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async(req,res) => {
    const {playlistId} = req.params;
    if (!(playlistId && isValidObjectId(playlistId))) {throw new ApiError(400,"Invalid Playlist ID")};

    const playlist = await Playlist.findById(playlistId).select("-_id -owner");

    if (!playlist) {throw new ApiError(400, "Playlist Not Found")};

    res.status(200)
    .json(
        new ApiResponse(
            201,
            playlist,
            "Playlist Fetched Successfully"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async(req,res) => {
    const {playlistId,videoId} = req.params;
    if (!(playlistId && videoId)) {throw new ApiError(400,"Error getting playlist & video ID")}

    const playlist = await Playlist.updateOne(
        {_id: new mongoose.Types.ObjectId(playlistId)},
        { $push: {videos: new mongoose.Types.ObjectId(videoId)} }
    )

    if (!playlist) {throw new ApiError(400, "Error adding video to playlist")};
    // console.log(playlist);
    
    res.status(200)
    .json(
        new ApiResponse(
            201,
            playlist,
            "Successfully Added Video to Playlist"
        )
    )

})

const removeVideoFromPlaylist = asyncHandler(async(req,res) => {
    const {playlistId,videoId} = req.params;
    if (!(playlistId && videoId && isValidObjectId(playlistId) && isValidObjectId(videoId))) {throw new ApiError(400,"Error getting playlist & video ID")}

    const playlist = await Playlist.updateOne(
        {_id: new mongoose.Types.ObjectId(playlistId)},
        { $pull: {videos: new mongoose.Types.ObjectId(videoId)} }
    )

    if (!playlist) {throw new ApiError(400, "Error adding video to playlist")};
    // console.log(playlist);
    
    res.status(200)
    .json(
        new ApiResponse(
            201,
            playlist,
            "Successfully Removed Video from Playlist"
        )
    )

})

const deletePlaylist = asyncHandler(async(req,res) => {
    const {playlistId} = req.params;
    if (!(playlistId && isValidObjectId(playlistId))) {throw new ApiError(400,"Error getting Playlist ID")}

    const playlistDeleted = await Playlist.findByIdAndDelete(playlistId).select("-_id -owner");

    console.log(playlistDeleted);
    
    if (!playlistDeleted) {throw new ApiError(400,"Playlist not found")}

    res.status(200)
    .json(
        new ApiResponse(
            201,
            playlistDeleted,
            "Playlist Deleted Successfully"
        )
    )

})

const updatePlaylist = asyncHandler(async(req,res) => {
    const {playlistId} = req.params;
    if (!(playlistId && isValidObjectId(playlistId))) {throw new ApiError(400,"Error getting Playlist ID")}

    const {name,description} = req.body
    if (!(name && description)) {throw new ApiError(404, "Playlist Name and Description is Required")}

    // const updatedPlaylist = await Playlist.findByIdAndUpdate(
    //     playlistId,
    //     {
    //         $set: {
    //             name: name,
    //             description: description
    //         }
    //     }
    // )

    const playlist = await Playlist.findById(playlistId);

    playlist.name = name;
    playlist.description = description;
    await playlist.save({validateBeforeSave : false})

    console.log(playlist);
    if (!playlist) {throw new ApiError(400,"Some Error Occured Updating Playlist")}

    res.status(200)
    .json(
        new ApiResponse(
            201,
            playlist,
            "Playlist Updated Successfully"
        )
    )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}