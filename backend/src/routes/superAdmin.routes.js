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
import { superAdminLimiter } from "../middleware/rateLimiter.js";
import {
  validateBody,
  validateParams,
  validatePagination,
} from "../middleware/validateRequest.js";

const router = Router();

// Rate limit + auth applied to every route in this router.
router.use(superAdminLimiter);
router.use(requireSuperAdmin);

/* Organizations */
router.get(
  "/organizations",
  getAllOrganizations
);

router.post(
  "/organizations",
  validateBody({
    required: ["name"],
    allowedFields: ["name", "email", "phone", "website"],
  }),
  createOrganization
);

router.get(
  "/organizations/:id",
  validateParams({ required: ["id"], uuid: ["id"] }),
  getOrganizationById
);

router.put(
  "/organizations/:id",
  validateParams({ required: ["id"], uuid: ["id"] }),
  validateBody({
    allowedFields: ["name", "email", "phone", "website"],
  }),
  updateOrganization
);

/* Users */
router.get(
  "/users",
  validatePagination(),
  getAllUsers
);

router.patch(
  "/users/:id/assign",
  validateParams({ required: ["id"], uuid: ["id"] }),
  validateBody({
    requiredAnyOf: ["organizationId", "role"],
    allowedFields: ["organizationId", "role"],
  }),
  assignUserOrganization
);

export default router;
