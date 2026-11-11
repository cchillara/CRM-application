import { Router } from "express";
import {
    getProtectedProfile,
    getSuperAdminSession,
    logoutSuperAdmin,
    registerUser
} from "../controllers/auth.controller.js";
import { verifyFirebaseToken, requireUser } from "../middleware/authmiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validateBody } from "../middleware/validateRequest.js";

const router = Router();

router.get(
    "/protected",
    requireUser,
    getProtectedProfile
);

router.post(
    "/super-admin/session",
    verifyFirebaseToken,
    getSuperAdminSession
);

router.post("/super-admin/logout", logoutSuperAdmin);

router.post(
    "/register",
    authLimiter,
    verifyFirebaseToken,
    validateBody({
        required: ["firstName"],
        allowedFields: ["firstName", "lastName"],
    }),
    registerUser
);

export default router;
