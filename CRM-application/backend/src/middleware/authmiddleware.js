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
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authorization token is required");
  }

  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) {
    throw new ApiError(401, "Invalid token format");
  }

  return auth.verifyIdToken(token);
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
  if (!req.organizationId) {
    throw new ApiError(400, "Organization context is required");
  }
  next();
};

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, "You do not have permission to access this resource");
  }
  next();
};

export const authorizeRoles = requireRoles;

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

/**
 * requireClientAdmin
 *
 * Single middleware for ALL /api/v1/client-admin routes.
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

    // Step 3 — auto-provision on first login
    if (!user) {
      let org = await prisma.organization.findFirst({ select: { id: true } });
      if (!org) {
        org = await prisma.organization.create({
          data: {
            name: "Default Organization",
            status: "ACTIVE",
          },
          select: { id: true },
        });
      }

      user = await prisma.user.create({
        data: {
          firebaseUid: uid,
          email: email || `${uid}@crm.local`,
          firstName: decodedToken.name?.split(" ")[0] || "Client",
          lastName: decodedToken.name?.split(" ").slice(1).join(" ") || "Admin",
          role: "ORGANIZATION_ADMIN",
          status: "ACTIVE",
          organizationId: org.id,
        },
        select: userSelect,
      });
    }

    // Step 4 — recovery: ensure user has an organization
    if (!user.organizationId) {
      let org = await prisma.organization.findFirst({ select: { id: true } });
      if (!org) {
        org = await prisma.organization.create({
          data: { name: "Default Organization", status: "ACTIVE" },
          select: { id: true },
        });
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: org.id },
        select: userSelect,
      });
    }

    // Step 5 — check account status
    if (user.status === "SUSPENDED") {
      throw new ApiError(403, "User account is suspended");
    }
    if (user.status === "DEACTIVATED") {
      throw new ApiError(403, "User account is deactivated");
    }

    // Attach to request
    req.user = { ...user, uid };
    req.organizationId = user.organizationId;

    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, error.message || "Invalid or expired authentication token"));
  }
};
