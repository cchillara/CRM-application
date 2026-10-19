
import { auth } from "../../firebase-admin.js";
import { ApiError } from "../../utils/apiError.js";

const BEARER_PREFIX = "Bearer ";

/**
 * Extracts a bearer token from the Authorization header.
 */
export const extractBearerToken = (req) => {
    const authorization = req.headers.authorization;

    if (
        typeof authorization !== "string" ||
        !authorization.startsWith(BEARER_PREFIX)
    ) {
        throw new ApiError(401, "Authorization token is required");
    }

    const token = authorization.slice(BEARER_PREFIX.length).trim();

    if (!token) {
        throw new ApiError(401, "Authorization token is required");
    }

    return token;
};

/**
 * Verifies the Firebase ID token.
 *
 * This function does not check CRM roles or organization membership.
 * Those responsibilities belong to separate authorization middleware.
 */
export const verifyFirebaseIdToken = async (req) => {
    if (req.firebaseUser?.uid) {
        return req.firebaseUser;
    }

    const token = extractBearerToken(req);

    try {
        if (!auth || typeof auth.verifyIdToken !== "function") {
            // Configuration errors are server errors, not invalid credentials.
            throw new Error("Firebase Admin authentication is not configured");
        }

        const decodedToken = await auth.verifyIdToken(token);

        if (!decodedToken?.uid) {
            throw new ApiError(401, "Invalid authentication token");
        }

        req.firebaseUser = decodedToken;

        return decodedToken;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        if (error?.code === "auth/id-token-expired") {
            throw new ApiError(401, "Authentication token has expired");
        }

        if (
            error?.code === "auth/argument-error" ||
            error?.code === "auth/invalid-id-token"
        ) {
            throw new ApiError(401, "Invalid authentication token");
        }

        // An unexpected Firebase/network/configuration failure should not
        // silently become a successful authentication.
        if (
            error?.message ===
            "Firebase Admin authentication is not configured"
        ) {
            throw error;
        }

        throw new ApiError(401, "Unable to verify authentication token");
    }
};
