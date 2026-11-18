import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import prisma from "../db/index.js";
import { findSuperAdminForFirebaseUser } from "../utils/superAdminAuth.js";
import { auth as firebaseAdminAuth } from "../firebase-admin.js";
import { SUPER_ADMIN_SESSION_COOKIE, superAdminSessionCookieOptions } from "../utils/superAdminSession.js";

const superAdminSessionExpiresIn = 7 * 24 * 60 * 60 * 1000;

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
      new ApiResponse(200, [], req.user, "Protected profile accessed successfully"),
    );
});

const getSuperAdminSession = asyncHandler(async (req, res) => {
  const firebaseUid = req.user?.uid;
  if (!firebaseUid) {
    throw new ApiError(401, "Invalid authentication token");
  }

  const superAdmin = await findSuperAdminForFirebaseUser({
    uid: firebaseUid,
    email: req.user.email,
    email_verified: req.user.email_verified,
  });

  if (!superAdmin) {
    throw new ApiError(403, "This account does not have Super Admin access");
  }

  const idToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!idToken) throw new ApiError(401, "Authorization token is required");

  const sessionCookie = await firebaseAdminAuth.createSessionCookie(idToken, {
    expiresIn: superAdminSessionExpiresIn,
  });
  res.cookie(SUPER_ADMIN_SESSION_COOKIE, sessionCookie, {
    ...superAdminSessionCookieOptions(),
    maxAge: superAdminSessionExpiresIn,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      id: superAdmin.id,
      firebaseUid: superAdmin.firebaseUid,
      email: superAdmin.email,
      name: superAdmin.name,
    }, "Super Admin session verified"),
  );
});

const logoutSuperAdmin = (req, res) => {
  res.clearCookie(SUPER_ADMIN_SESSION_COOKIE, superAdminSessionCookieOptions());
  return res.status(204).end();
};

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
    where: { firebaseUid },
  });

  if (existingUser) {
    return res.status(200).json(
      new ApiResponse(200, existingUser, "User is already registered"),
    );
  }

  // Public sign-up may claim an account that an organization admin has
  // pre-created for this email. The role and organization come only from
  // that trusted record; they are never accepted from the public request.
  const invitedUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!invitedUser || !invitedUser.firebaseUid?.startsWith("pending-")) {
    throw new ApiError(403, "No pending CRM invitation was found for this email. Ask your organization administrator to create your account first.");
  }

  const user = await prisma.user.update({
    where: { id: invitedUser.id },
    data: {
      firebaseUid,
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, user, "User registered successfully"));
});

export { getProtectedProfile, getSuperAdminSession, logoutSuperAdmin, registerUser };
