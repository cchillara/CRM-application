import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import prisma from "../db/index.js";

const getProtectedProfile = asyncHandler((req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "Protected route accessed successfully"),
    );
});

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;

  const firebaseUid = req.user?.uid;
  const email = req.user?.email;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (!firstName) {
    throw new ApiError(400, "First name is required");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      firebaseUid,
    },
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await prisma.user.create({
    data: {
      firebaseUid,
      email,
      firstName,
      lastName: lastName || null,
      organizationId: null,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User registered successfully"));
});

export { getProtectedProfile, registerUser };
