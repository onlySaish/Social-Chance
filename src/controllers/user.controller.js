import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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

export {userRegister};