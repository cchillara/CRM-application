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
  const { firstName, lastName, organizationId, role } = req.body;

  const firebaseUid = req.user?.uid;
  const email = req.user?.email;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (!firstName) {
    throw new ApiError(400, "First name is required");
  }

  if (!organizationId) {
    throw new ApiError(400, "Organization ID is required for registration");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  if (organization.status !== "ACTIVE") {
    throw new ApiError(403, "Cannot register under a non-active organization");
  }

  const existingUser = await prisma.user.findUnique({
    where: { firebaseUid },
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
