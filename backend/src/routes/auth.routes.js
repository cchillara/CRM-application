import { Router } from "express";
import { getProtectedProfile } from "../controllers/auth.controller.js";
import { verifyFirebaseToken } from "../middleware/authmiddleware.js";

const router = Router();
router.get("/protected", verifyFirebaseToken, getProtectedProfile);

export default router;
