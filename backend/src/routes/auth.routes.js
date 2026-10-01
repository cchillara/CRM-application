import { Router } from "express";
import {
    getProtectedProfile,
    registerUser
} from "../controllers/auth.controller.js";
import { verifyFirebaseToken } from "../middleware/authmiddleware.js";

const router = Router();

router.get(
    "/protected",
    verifyFirebaseToken,
    getProtectedProfile
);

router.post(
    "/register",
    verifyFirebaseToken,
    registerUser
);

export default router;
