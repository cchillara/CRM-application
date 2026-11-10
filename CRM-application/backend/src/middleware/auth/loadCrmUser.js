
import prisma from "../../db/index.js";
import { ApiError } from "../../utils/apiError.js";

const BLOCKED_USER_STATUSES = new Set([
    "SUSPENDED",
    "DEACTIVATED",
]);

const BLOCKED_ORGANIZATION_STATUSES = new Set([
    "SUSPENDED",
    "DEACTIVATED",
]);

/**
 * Loads the registered CRM user using the verified Firebase UID.
 */
export const loadCrmUser = async (
    firebaseUser,
    {
        requireActive = false,
        requireOrganization = false,
    } = {}
) => {
    if (!firebaseUser?.uid) {
        throw new ApiError(401, "Authenticated Firebase user is missing");
    }

    // Let unexpected database errors propagate to the central error handler.
    // A database outage must not be misreported as an invalid Firebase token.
    const user = await prisma.user.findUnique({
        where: {
            firebaseUid: firebaseUser.uid,
        },
        include: {
            organization: true,
        },
    });

    if (!user) {
        throw new ApiError(403, "CRM user is not registered");
    }

    if (BLOCKED_USER_STATUSES.has(user.status)) {
        throw new ApiError(403, "User account is not active");
    }

    if (requireActive && user.status !== "ACTIVE") {
        throw new ApiError(403, "User account must be active");
    }

    if (requireOrganization && !user.organizationId) {
        throw new ApiError(
            403,
            "User is not assigned to an organization"
        );
    }

    if (user.organizationId && !user.organization) {
        throw new ApiError(403, "User organization is invalid");
    }

    if (
        user.organization &&
        BLOCKED_ORGANIZATION_STATUSES.has(user.organization.status)
    ) {
        throw new ApiError(403, "Organization account is not active");
    }

    if (
        requireOrganization &&
        user.organization?.status !== "ACTIVE"
    ) {
        throw new ApiError(403, "Organization account must be active");
    }

    return user;
};
