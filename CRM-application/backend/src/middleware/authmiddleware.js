import { auth } from "../firebase-admin.js";
import { ApiError } from "../utils/apiError.js";
import prisma from "../db/index.js";
import { findSuperAdminForFirebaseUser } from "../utils/superAdminAuth.js";
import { SUPER_ADMIN_SESSION_COOKIE } from "../utils/superAdminSession.js";

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
  let decodedToken;
  try {
    decodedToken = await extractAndVerifyToken(req);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid or expired authentication token");
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: {
        firebaseUid: decodedToken.uid,
      },
      include: {
        organization: true,
      },
    });
  } catch (error) {
    console.error("Authenticated user lookup failed:", error);
    throw new ApiError(500, "Unable to load authenticated user");
  }

  if (!user) {
    throw new ApiError(403, "CRM user is not registered");
  }

  if (user.status === "SUSPENDED") {
    throw new ApiError(403, "User account is suspended");
  }
  if (user.status === "DEACTIVATED") {
    throw new ApiError(403, "User account is deactivated");
  }

  if (user.organization) {
    if (user.organization.status === "SUSPENDED") {
      throw new ApiError(403, "Organization account is suspended");
    }
    if (user.organization.status === "DEACTIVATED") {
      throw new ApiError(403, "Organization account is deactivated");
    }
  }

  req.user = user;
  req.organizationId = user.organizationId;
  next();
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

/**
 * requireClientAdmin — middleware for /api/v1/client-admin routes.
 * Verifies Firebase token, resolves the CRM User + Organization,
 * and attaches req.user + req.organizationId.
 * Accepts ORGANIZATION_ADMIN and MANAGER roles.
 */
export const requireClientAdmin = async (req, res, next) => {
  try {
    const decodedToken = await extractAndVerifyToken(req);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    const userSelect = {
      id: true,
      firebaseUid: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      organizationId: true,
    };

    // Step 1 — look up by Firebase UID
    let user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
      select: userSelect,
    });

    // Step 2 — fall back to email lookup and sync firebaseUid
    if (!user && email) {
      user = await prisma.user.findUnique({
        where: { email },
        select: userSelect,
      });
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { firebaseUid: uid } });
      }
    }

    // Step 3 — create user record if still not found
    if (!user) {
      let org = await prisma.organization.findFirst();
      if (!org) {
        org = await prisma.organization.create({
          data: { name: "SHNOOR CRM Organization", email: email || "admin@crmclient.com", status: "ACTIVE" },
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

    // Step 4 — assign org if missing
    if (!user.organizationId) {
      let org = await prisma.organization.findFirst();
      if (!org) {
        org = await prisma.organization.create({
          data: { name: "SHNOOR CRM Organization", email: email || "admin@crmclient.com", status: "ACTIVE" },
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

export const requireSuperAdmin = async (req, res, next) => {
  try {
    const sessionCookie = req.cookies?.[SUPER_ADMIN_SESSION_COOKIE];
    const decodedToken = sessionCookie
      ? await auth.verifySessionCookie(sessionCookie, true)
      : await extractAndVerifyToken(req);
    const superAdmin = await findSuperAdminForFirebaseUser(decodedToken);

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
