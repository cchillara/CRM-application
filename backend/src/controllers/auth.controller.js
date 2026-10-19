import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import prisma from "../db/index.js";

const getProtectedProfile = asyncHandler(async (req, res) => {
  if (req.user && req.user.id) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { lastLoginAt: new Date() },
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "Protected profile accessed successfully"),
    );
});

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;

  const firebaseUid = req.user?.uid;
  const email = req.user?.email;

  if (!firebaseUid) {
    throw new ApiError(401, "Firebase authentication is required");
  }

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (!firstName || !firstName.trim()) {
    throw new ApiError(400, "First name is required");
  }

  // Check whether this Firebase user already exists.
  const existingUser = await prisma.user.findUnique({
    where: { firebaseUid },
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  // Organization is optional.
  const user = await prisma.user.create({
    data: {
      firebaseUid,
      email,
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      organizationId: null,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, user, "User registered successfully"),
    );
});

export { getProtectedProfile, registerUser };
