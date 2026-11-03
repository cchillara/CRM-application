import { Router } from "express";
import {
    getProtectedProfile,
    getSuperAdminSession,
    registerUser
} from "../controllers/auth.controller.js";
import { verifyFirebaseToken, requireUser } from "../middleware/authmiddleware.js";

const router = Router();

router.get(
    "/protected",
    requireUser,
    getProtectedProfile
);

router.get(
    "/super-admin/session",
    verifyFirebaseToken,
    getSuperAdminSession
);

router.post(
    "/register",
    verifyFirebaseToken,
    registerUser
);

export default router;
