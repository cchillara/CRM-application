import { auth } from "../firebase-admin.js";
import prisma from "../db/index.js";
import { ApiError } from "../utils/apiError.js";

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Authorization token is required");
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    const user = await prisma.user.findUnique({
      where: {
        firebaseUid: decodedToken.uid
      }
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