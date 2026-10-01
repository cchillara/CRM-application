import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import prisma from "../db/index.js";

const getProtectedProfile = asyncHandler((req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Protected route accessed successfully"
            )
        );
});


const registerUser = asyncHandler(async (req, res) => {
    const {
        firstName,
        lastName,
        role,
        organizationId
    } = req.body;

    // Firebase user information comes from verifyFirebaseToken
    const firebaseUid = req.user.uid;
    const email = req.user.email;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    if (!firstName) {
        throw new ApiError(400, "First name is required");
    }

    if (!organizationId) {
        throw new ApiError(400, "Organization ID is required");
    }

    // Check whether this Firebase user already exists
    const existingUser = await prisma.user.findUnique({
        where: {
            firebaseUid
        }
    });

    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }

    // Check whether organization exists
    const organization = await prisma.organization.findUnique({
        where: {
            id: organizationId
        }
    });

    if (!organization) {
        throw new ApiError(404, "Organization not found");
    }

    // Create CRM user
    const user = await prisma.user.create({
        data: {
            firebaseUid,
            email,
            firstName,
            lastName,
            role: role || "SALES",
            organizationId
        }
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                user,
                "User registered successfully"
            )
        );
});


export {
    getProtectedProfile,
    registerUser
};
