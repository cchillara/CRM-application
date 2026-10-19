
import { ApiError } from "../../utils/apiError.js";
import { verifyFirebaseIdToken } from "./token.js";
import { loadCrmUser } from "./loadCrmUser.js";

/**
 * Authorizes an active Client Admin.
 *
 * Requirements:
 * 1. Valid Firebase ID token.
 * 2. Registered CRM user.
 * 3. Active CRM user.
 * 4. Active organization.
 * 5. ORGANIZATION_ADMIN role.
 */
export const requireClientAdmin = async (req, res, next) => {
    try {
        const firebaseUser = await verifyFirebaseIdToken(req);

        const crmUser = await loadCrmUser(firebaseUser, {
            requireActive: true,
            requireOrganization: true,
        });

        if (crmUser.role !== "ORGANIZATION_ADMIN") {
            throw new ApiError(
                403,
                "Access denied: Client Admin privileges required"
            );
        }

        // Keep the full Prisma record available for new code.
        req.crmUser = crmUser;

        // Maintain compatibility with existing controllers that read
        // req.user.uid, req.user.email, or req.user.organizationId.
        req.user = {
            ...crmUser,
            uid: firebaseUser.uid,
            email: crmUser.email,
        };

        // A trusted server-side value. Never derive authorization from
        // an organization ID supplied in the request body.
        req.organizationId = crmUser.organizationId;

        return next();
    } catch (error) {
        return next(error);
    }
};
