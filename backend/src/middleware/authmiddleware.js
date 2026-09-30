import { auth } from "../firebase-admin.js";
import {ApiError} from "../utils/apiError.js"

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401,"Authorization token is required")
    }

    const idToken = authHeader.split("Bearer ")[1];

    const decodedToken = await auth.verifyIdToken(idToken);

    req.user = decodedToken;

    next();
}
   catch (error) {
    throw new ApiError(401,"Invalid or expired authentication token")
  }
};


