import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import prisma from "../db/index.js";

const getAllOrganizations = asyncHandler(async (req, res) => {
  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          users: true,
          leads: true,
          deals: true,
          customers: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, organizations, "Organizations fetched successfully"));
});

const getOrganizationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          firebaseUid: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          leads: true,
          deals: true,
          customers: true,
          tasks: true,
          activities: true,
        },
      },
    },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, organization, "Organization details fetched successfully"));
});

const createOrganization = asyncHandler(async (req, res) => {
  const { name, email, phone, website } = req.body;

  if (!name || name.trim() === "") {
    throw new ApiError(400, "Organization name is required");
  }

  const organization = await prisma.organization.create({
    data: {
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      website: website || null,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, organization, "Organization created successfully"));
});

const updateOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, website } = req.body;

  const existing = await prisma.organization.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, "Organization not found");
  }

  const updated = await prisma.organization.update({
    where: { id },
    data: {
      name: name !== undefined ? name.trim() : existing.name,
      email: email !== undefined ? email : existing.email,
      phone: phone !== undefined ? phone : existing.phone,
      website: website !== undefined ? website : existing.website,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Organization updated successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const assignUserOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { organizationId, role } = req.body;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (organizationId) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }
  }

  const validRoles = ["ADMIN", "MANAGER", "SALES"];
  if (role && !validRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      organizationId: organizationId !== undefined ? organizationId : user.organizationId,
      role: role !== undefined ? role : user.role,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User assigned successfully"));
});

export {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  getAllUsers,
  assignUserOrganization,
};
