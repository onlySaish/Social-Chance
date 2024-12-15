import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        
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

    if (
        [email, username, password].some((field) => {
            field === ""
        })
    )   throw new ApiError(404, "All Fields are Required");

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
            $set: {
                refreshToken : undefined
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

export {
    userRegister,
    userLogin,
    userLogout
};