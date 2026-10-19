import { Router } from "express";
import {
    getProtectedProfile,
    registerUser
} from "../controllers/auth.controller.js";
import { verifyFirebaseToken, requireUser } from "../middleware/authmiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validateBody } from "../middleware/validateRequest.js";

const router = Router();

// Apply tight rate limiting to every auth endpoint.
router.use(authLimiter);

router.get(
    "/protected",
    requireUser,
    getProtectedProfile
);

router.post(
    "/register",
    verifyFirebaseToken,
    validateBody({
        required: ["firstName"],
        allowedFields: ["firstName", "lastName"],
    }),
    registerUser
);

export default router;
