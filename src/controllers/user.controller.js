import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const compareTwoObjects = (obj1,obj2) => {
    let keys = Object.keys(obj1);
    for (let key of keys){
        if (obj1[key] !== obj2[key]){
            return false;
        }
    }
    return true;
}

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false})

        return {accessToken,refreshToken};        
    } catch (error) {
        throw new ApiError(500,"Some Error Occured while generating Access / Refresh Tokens")
    }
}

const userRegister = asyncHandler(async(req,res) => {
    const {fullName, username, email, password} = req.body    //Get values from frontend
    
    if (            //Check if any field is empty
        [fullName,username,,email,password].some((field) => field?.trim() === "")
    ) throw new ApiError(400,"All Fields are Required");

    const existingUser = await User.findOne({         //Check if user already exists
        $or: [{email},{username}]
    })

    if (existingUser) {throw new ApiError(409,"User with Email or Username already Exists")};
    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
        
    const avatarLocalPath = req.files?.avatar[0].path
    // const coverImageLocalPath = req.files?.coverImage[0].path

    if (!avatarLocalPath) {throw new ApiError(404,"Avatar file is required")}
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    let coverImage;
    if (coverImageLocalPath) {coverImage = await uploadOnCloudinary(coverImageLocalPath)}

    if (!avatar) {throw new ApiError(400,"Avatar file is required")};

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {throw new ApiError(500,"Something went wrong while registering user")};

    return res.status(200).json(
        new ApiResponse(201,createdUser,"Successfully Registered")
    )
})

const userLogin = asyncHandler(async(req,res) => {
    //Get email, usename and pass from user (frontend)
    //Validate no fields are left empty
    //Search for email or username in user database
    //If user not found then throw err no user
    //If user found compare the input password and password stored in database using bcrypt compare
    //If password does not match throw err
    //If pass is correct Fetch the user data from database
    //Generate Access Token and Refresh Token for user
    //Save the genrated refresh token in db
    //get info of loggedinUser with removeal of unnecessary keys
    //Send tokens in form of cookie
    //return reponse(ApiResponse) i.e. user data
    
    const {email, username, password} = req.body

    // if (
    //     [email, username, password].some((field) => {
    //         field === ""
    //     })
    // )   throw new ApiError(404, "All Fields are Required");

    if (!(username || email)){              //Alternative is if (!username && !email)
        throw new ApiError(404,"Username or Email is required")
    }

    if (!password){
        throw new ApiError(404,"Password is required")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    });

    if (!user) {throw new ApiError(400, "User with Username or Email Not Found")};

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {throw new ApiError(404,"Incorrect Password, Try Again !!")}

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedinUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true 
    }

    res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedinUser, accessToken, refreshToken     
            },
            "Logged In Successfully"
        )
    )
})

const userLogout = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            // $set: {
            //     refreshToken : undefined
            // }
            $unset: {           //Alternate method if above doesnt work
                refreshToken: 1        //the values you wanted to delete -> unset the values to 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            201,
            {},
            "Logged Out Successfully"
        )
    )

})

const refreshAccessToken = asyncHandler( async(req,res) => {
    const currentToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!currentToken) {throw new ApiError(404,"Unauthorized Request")}
    
    try {
        const decodedToken = jwt.verify(currentToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id);
        const decodedUserToken = jwt.verify(user.refreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        if (!user){
            throw new ApiError(404, "Invalid refresh Token");
        }
        // console.log(decodedUserToken,decodedToken)

        // if (decodedToken !== decodedUserToken){
        //     throw new ApiError(404, "Refresh Token is expired or used");
        // }

        if (!compareTwoObjects(decodedToken,decodedUserToken)){
            throw new ApiError(404, "Refresh Token is expired or used");
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                201,
                {accessToken,refreshToken},
                "Successfully Refreshed Access Token"
            )
        )
    } catch (error) {
        console.log(error);
        throw new ApiError(400, "Error in Refreshing Access Token")
    }

})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body

    if (!(oldPassword && newPassword)) {throw new ApiError(404, "All Fields are Required")}

    const user = await User.findById(req.user._id);
    const isPasswordValid = user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {throw new ApiError(400,"Invalid Password")};

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200)
    .json(
        new ApiResponse(201,{},"Password Updated Successfully")
    )

})

const getCurrentUserDetails = asyncHandler(async(req,res) => {
    const user = req.user;
    return res.status(200)
    .json(
        new ApiResponse(201, {user}, "User Fetched Successfully")
    )
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email, username} = req.body

    if (! (fullName && email && username) ) {throw new ApiError(404, "All Fields are Required")};

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName : fullName,
                email : email,
                username: username
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    return res.status(200)
    .json(
        new ApiResponse(
            201,
            {user},
            "Account Details Updated Successfully"
        )
    )
})

const updateAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {throw new ApiError(400, "Avatar File is Required")}

    const newAvatar = await uploadOnCloudinary(avatarLocalPath);

    if (!newAvatar) {throw new ApiError(400,"Error occured while uploading on cloudinary")}

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                avatar: newAvatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    res.status(200)
    .json(
        new ApiResponse(
            201,
            {user},
            "Avatar Updated Successfully"
        )
    )
})

const updateCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {throw new ApiError(400, "Cover File is Required")}

    const newCoverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!newCoverImage) {throw new ApiError(400,"Error occured while uploading on cloudinary")}

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                coverImage: newCoverImage.url
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    res.status(200)
    .json(
        new ApiResponse(
            201,
            {user},
            "Cover Image Updated Successfully"
        )
    )
})

const getChannelDetails = asyncHandler(async(req,res) => {
    const {username} = req.params

    if(!username.trim()) {throw new ApiError(400, "Username not Found")};

    const channel = await User.aggregate([
        {
            $match: {
                username : username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "channelSubscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "channelSubscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount : {
                    $size: `$channelSubscribers`
                },
                subscribedToCount: {
                    $size: `$channelSubscribedTo`
                },
                isSubscribed: {                 //to check if current logged in user is subscribed to the channel and behaviour of subscribe button
                    $cond: {
                        if: {$in: [req.user._id,"$channelSubscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{                         //Fields to show in channel homepage
                fullName:1,
                email:1,
                username:1,
                avatar:1,
                coverImage:1,
                subscribedToCount:1,
                subscribersCount:1,
                isSubscribed:1
            }
        }
    ]);
    console.log(channel?.length)
    if (!channel?.length) {throw new ApiError(404, "Channel Does Not Exists")};

    return res.status(200)
    .json(
        new ApiResponse(
            201,
            channel[0],
            "Fetched Channel Details"
        )
    )

})

const getWatchHistory = asyncHandler(async(req,res) => {    
    const userId = req.user._id;
    const user = await User.aggregate([
        {
            $match: {               //To get watch history for user logged in
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [                    //Currently we are in video schema here, thats why subpipline is inserted here for owner for each video
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "videoOwner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$videoOwner"
                            }
                        }
                    } 
                ]
            }
        },
    ])

    res.status(200)
    .json(
        new ApiResponse(
            201,
            user[0].watchHistory,
            "Watch History Fetched Successfully"
        )
    )

})

export {
    userRegister,
    userLogin,
    userLogout,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUserDetails,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getChannelDetails,
    getWatchHistory
};