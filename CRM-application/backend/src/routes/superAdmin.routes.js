import { Router } from "express";
import {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  getAllUsers,
  assignUserOrganization,
} from "../controllers/superAdmin.controller.js";
import { requireSuperAdmin } from "../middleware/authmiddleware.js";

const router = Router();

router.use(requireSuperAdmin);

router.get("/organizations", getAllOrganizations);
router.post("/organizations", createOrganization);
router.get("/organizations/:id", getOrganizationById);
router.put("/organizations/:id", updateOrganization);
router.get("/users", getAllUsers);
router.patch("/users/:id/assign", assignUserOrganization);

export default router;
