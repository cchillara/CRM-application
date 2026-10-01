import { auth } from "../firebase-admin.js";
import { ApiError } from "../utils/apiError.js";
import prisma from "../db/index.js";

const extractAndVerifyToken = async (req) => {
  if (req.user?.uid) {
    return req.user;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Authorization token is required");
  }

  const idToken = authHeader.split("Bearer ")[1];
  return await auth.verifyIdToken(idToken);
};

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const decodedToken = await extractAndVerifyToken(req);
    req.user = decodedToken;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid or expired authentication token");
  }
};

export const requireUser = async (req, res, next) => {
  try {
    const decodedToken = await extractAndVerifyToken(req);
    const user = await prisma.user.findUnique({
      where: {
        firebaseUid: decodedToken.uid,
      },
    });

    if (!user) {
      throw new ApiError(403, "CRM user is not registered");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid or expired authentication token");
  }
};

export const requireOrganization = (req, res, next) => {
  if (!req.user || !req.user.organizationId) {
    throw new ApiError(403, "User is not assigned to an organization");
  }
  req.organizationId = req.user.organizationId;
  next();
};

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "Access denied: insufficient permissions");
    }
    next();
  };
};

export const authorizeRoles = requireRoles;

export const requireSuperAdmin = async (req, res, next) => {
  try {
    const decodedToken = await extractAndVerifyToken(req);
    const superAdmin = await prisma.superAdmin.findUnique({
      where: {
        firebaseUid: decodedToken.uid,
      },
    });

    if (!superAdmin) {
      throw new ApiError(403, "Access denied: Super Admin privileges required");
    }

    req.superAdmin = superAdmin;
    req.user = superAdmin;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid or expired authentication token");
  }
};