import { Router } from "express";

import {
    getProtectedProfile,
    registerUser
} from "../controllers/auth.controller.js";

import { verifyFirebaseToken } from "../middleware/authmiddleware.js";

const router = Router();


// Protected profile
router.get(
    "/protected",
    verifyFirebaseToken,
    getProtectedProfile
);


// Register Firebase user in PostgreSQL
router.post(
    "/register",
    verifyFirebaseToken,
    registerUser
);


export default router;
