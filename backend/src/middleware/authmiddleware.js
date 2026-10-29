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
      where: { firebaseUid: decodedToken.uid },
      include: { organization: true },
    });

    if (!user) throw new ApiError(403, "CRM user is not registered");
    if (user.status === "SUSPENDED") throw new ApiError(403, "User account is suspended");
    if (user.status === "DEACTIVATED") throw new ApiError(403, "User account is deactivated");

    if (user.organization) {
      if (user.organization.status === "SUSPENDED") throw new ApiError(403, "Organization account is suspended");
      if (user.organization.status === "DEACTIVATED") throw new ApiError(403, "Organization account is deactivated");
    }

    req.user = user;
    req.organizationId = user.organizationId;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
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
      where: { firebaseUid: decodedToken.uid },
    });

    if (!superAdmin) throw new ApiError(403, "Access denied: Super Admin privileges required");

    req.superAdmin = superAdmin;
    req.user = superAdmin;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Invalid or expired authentication token");
  }
};

/**
 * requireClientAdmin
 *
 * Single middleware for ALL /api/v1/client-admin routes.
 *
 * What it does:
 *  1. Verifies the Firebase ID token from the Authorization header.
 *  2. Looks up the CRM User in the DB by firebaseUid.
 *  3. Fallback: looks up by email and links the uid (handles users invited by email).
 *  4. First-login: if no user found at all, auto-provisions a User + Organization.
 *  5. Recovery: if user has no organizationId, assigns the first available org.
 *  6. Blocks SUSPENDED / DEACTIVATED accounts with 403.
 *  7. Sets req.user  (DB row: id, role, organizationId, firstName, lastName, email, uid)
 *     Sets req.organizationId (convenience shortcut used by all controllers).
 *
 * This replaces the getClientAdmin() helper that was called at the top of every
 * controller function — keeping that logic in one place.
 */
export const requireClientAdmin = async (req, res, next) => {
  try {
    const decodedToken = await extractAndVerifyToken(req);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    const userSelect = {
      id: true,
      role: true,
      organizationId: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
    };

    // Step 1 — find by firebaseUid
    let user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
      select: userSelect,
    });

    // Step 2 — fallback by email, then link uid
    if (!user && email) {
      user = await prisma.user.findUnique({
        where: { email },
        select: userSelect,
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid: uid },
        });
      }
    }

    // Step 3 — first-login auto-provisioning
    if (!user) {
      let org = await prisma.organization.findFirst();
      if (!org) {
        org = await prisma.organization.create({
          data: {
            name: "SHNOOR CRM Organization",
            email: email || "admin@crmclient.com",
            status: "ACTIVE",
          },
        });
      }
      user = await prisma.user.create({
        data: {
          firebaseUid: uid,
          email: email || `user_${uid.slice(0, 8)}@crmclient.com`,
          firstName: "Client",
          lastName: "Admin",
          role: "ORGANIZATION_ADMIN",
          status: "ACTIVE",
          organizationId: org.id,
        },
        select: userSelect,
      });
    }

    // Step 4 — recovery: user has no org
    if (!user.organizationId) {
      let org = await prisma.organization.findFirst();
      if (!org) {
        org = await prisma.organization.create({
          data: {
            name: "SHNOOR CRM Organization",
            email: email || "admin@crmclient.com",
            status: "ACTIVE",
          },
        });
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: org.id },
        select: userSelect,
      });
    }

    // Step 5 — block suspended / deactivated
    if (user.status === "SUSPENDED") {
      return res.status(403).json({ message: "User account is suspended" });
    }
    if (user.status === "DEACTIVATED") {
      return res.status(403).json({ message: "User account is deactivated" });
    }

    // Attach — merge DB fields with uid from Firebase token
    req.user = { ...user, uid };
    req.organizationId = user.organizationId;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(401).json({ message: "Invalid or expired authentication token" });
  }
};
