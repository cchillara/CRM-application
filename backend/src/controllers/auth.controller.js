import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getProtectedProfile = asyncHandler((req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"Protected route accessed successfully"))
})


export { getProtectedProfile };