
import prisma from "../db/index.js";
import { ApiError } from "../utils/apiError.js";

import { verifyFirebaseIdToken } from "./auth/token.js";
import { loadCrmUser } from "./auth/loadCrmUser.js";

export {
  requireClientAdmin,
} from "./auth/requireClientAdmin.js";

/**
 * Firebase authentication only.
 *
 * Preserves the original behavior of setting req.user to the
 * decoded Firebase token payload.
 */
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const firebaseUser = await verifyFirebaseIdToken(req);

    req.firebaseUser = firebaseUser;
    req.user = firebaseUser;

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Loads the registered CRM user.
 *
 * Unlike requireClientAdmin, this middleware does not require
 * the user to have a particular role or an active organization.
 */
export const requireUser = async (req, res, next) => {
  try {
    const firebaseUser = await verifyFirebaseIdToken(req);

    const crmUser = await loadCrmUser(firebaseUser);

    req.firebaseUser = firebaseUser;
    req.crmUser = crmUser;

    // Preserve CRM fields while retaining Firebase UID compatibility.
    req.user = {
      ...crmUser,
      uid: firebaseUser.uid,
      email: crmUser.email,
    };

    req.organizationId = crmUser.organizationId;

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Requires an authenticated user to belong to an organization.
 */
export const requireOrganization = (req, res, next) => {
  const organizationId =
    req.crmUser?.organizationId ??
    req.user?.organizationId;

  if (!organizationId) {
    return next(
      new ApiError(
        403,
        "User is not assigned to an organization"
      )
    );
  }

  req.organizationId = organizationId;

  return next();
};

/**
 * Generic role authorization.
 *
 * Example:
 * router.get("/reports", requireUser, requireRoles("MANAGER"), handler);
 */
export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "Access denied: insufficient permissions"
        )
      );
    }

    return next();
  };
};

// Preserve the existing alias.
export const authorizeRoles = requireRoles;

/**
 * Separate Super Admin authorization.
 *
 * Does not use the Client Admin role or organization restrictions.
 */
export const requireSuperAdmin = async (req, res, next) => {
  try {
    const firebaseUser = await verifyFirebaseIdToken(req);

    const superAdmin = await prisma.superAdmin.findUnique({
      where: {
        firebaseUid: firebaseUser.uid,
      },
    });

    if (!superAdmin) {
      throw new ApiError(
        403,
        "Access denied: Super Admin privileges required"
      );
    }

    req.firebaseUser = firebaseUser;
    req.superAdmin = superAdmin;
    req.user = superAdmin;

    return next();
  } catch (error) {
    return next(error);
  }
};
