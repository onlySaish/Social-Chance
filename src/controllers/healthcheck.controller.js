import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const healthcheck = asyncHandler(async(req,res) => {
    res.status(200)
    .json(
        new ApiResponse(
            201,
            "Server is Running Successfully"
        )
    )
})

export {
    healthcheck
}