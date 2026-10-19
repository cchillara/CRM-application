import crypto from "crypto";
import prisma from "../db/index.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getClientAdmin = async (firebaseUid) => {
    const user = await prisma.user.findUnique({
        where: {
            firebaseUid,
        },
        select: {
            id: true,
            role: true,
        },
    });

    if (!user) {
        return {
            error: "User not found",
        };
    }

    if (user.role !== "ADMIN") {
        return {
            error: "Client Admin access required",
        };
    }

    return {
        user,
    };
};

const validateUserRole = (role) => {
    return ["ADMIN", "MANAGER", "SALES"].includes(role);
};

const validateUserStatus = (status) => {
    return ["ACTIVE", "INACTIVE"].includes(status);
};

export const listUsers = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                firebaseUid: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                users,
                "Users retrieved successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to retrieve users"
            )
        );
    }
};

export const getUser = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                id: req.params.id,
            },
            select: {
                id: true,
                firebaseUid: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(404).json(
                new ApiResponse(
                    404,
                    [{ message: "User not found" }],
                    null,
                    "User not found"
                )
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                user,
                "User retrieved successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to retrieve user"
            )
        );
    }
};

export const createUser = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const {
            email,
            firstName,
            lastName,
            role = "SALES",
        } = req.body;

        if (!email || !firstName || !lastName) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    [{
                        message: "email, firstName and lastName are required",
                    }],
                    null,
                    "Required fields are missing"
                )
            );
        }

        if (!validateUserRole(role)) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    [{ message: "Invalid role" }],
                    null,
                    "Invalid role"
                )
            );
        }

        if (role === "ADMIN") {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{
                        message: "Client Admin cannot create another ADMIN",
                    }],
                    null,
                    "Creating ADMIN users is not allowed"
                )
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return res.status(409).json(
                new ApiResponse(
                    409,
                    [{ message: "User already exists" }],
                    null,
                    "User already exists"
                )
            );
        }

        const user = await prisma.user.create({
            data: {
                firebaseUid: `pending-${crypto.randomUUID()}`,
                email,
                firstName,
                lastName,
                role,
                status: "ACTIVE",
            },
            select: {
                id: true,
                firebaseUid: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                [],
                user,
                "User created successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to create user"
            )
        );
    }
};

export const updateUser = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!existingUser) {
            return res.status(404).json(
                new ApiResponse(
                    404,
                    [{ message: "User not found" }],
                    null,
                    "User not found"
                )
            );
        }

        if (existingUser.role === "ADMIN") {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: "ADMIN users cannot be modified" }],
                    null,
                    "ADMIN users cannot be modified"
                )
            );
        }

        const {
            firstName,
            lastName,
            email,
            role,
        } = req.body;

        if (role !== undefined && !validateUserRole(role)) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    [{ message: "Invalid role" }],
                    null,
                    "Invalid role"
                )
            );
        }

        if (role === "ADMIN") {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{
                        message: "Client Admin cannot assign ADMIN role",
                    }],
                    null,
                    "Assigning ADMIN role is not allowed"
                )
            );
        }

        const user = await prisma.user.update({
            where: {
                id: existingUser.id,
            },
            data: {
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
                ...(email !== undefined && { email }),
                ...(role !== undefined && { role }),
            },
            select: {
                id: true,
                firebaseUid: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                user,
                "User updated successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to update user"
            )
        );
    }
};

export const updateUserStatus = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const { status } = req.body;

        if (!validateUserStatus(status)) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    [{ message: "Invalid status" }],
                    null,
                    "Invalid status"
                )
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!existingUser) {
            return res.status(404).json(
                new ApiResponse(
                    404,
                    [{ message: "User not found" }],
                    null,
                    "User not found"
                )
            );
        }

        if (existingUser.role === "ADMIN") {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: "ADMIN users cannot be modified" }],
                    null,
                    "ADMIN users cannot be modified"
                )
            );
        }

        const user = await prisma.user.update({
            where: {
                id: existingUser.id,
            },
            data: {
                status,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                user,
                "User status updated successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to update user status"
            )
        );
    }
};

export const deleteUser = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!existingUser) {
            return res.status(404).json(
                new ApiResponse(
                    404,
                    [{ message: "User not found" }],
                    null,
                    "User not found"
                )
            );
        }

        if (existingUser.role === "ADMIN") {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: "ADMIN users cannot be deleted" }],
                    null,
                    "ADMIN users cannot be deleted"
                )
            );
        }

        await prisma.user.delete({
            where: {
                id: existingUser.id,
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                null,
                "User deleted successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to delete user"
            )
        );
    }
};

export const listRoles = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const roles = await prisma.role.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                roles,
                "Roles retrieved successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to retrieve roles"
            )
        );
    }
};

export const getRole = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const role = await prisma.role.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!role) {
            return res.status(404).json(
                new ApiResponse(
                    404,
                    [{ message: "Role not found" }],
                    null,
                    "Role not found"
                )
            );
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                role,
                "Role retrieved successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to retrieve role"
            )
        );
    }
};

export const createRole = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const {
            name,
            description,
            permissions,
        } = req.body;

        if (!name) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    [{ message: "Role name is required" }],
                    null,
                    "Role name is required"
                )
            );
        }

        const existingRole = await prisma.role.findUnique({
            where: {
                name,
            },
        });

        if (existingRole) {
            return res.status(409).json(
                new ApiResponse(
                    409,
                    [{ message: "Role already exists" }],
                    null,
                    "Role already exists"
                )
            );
        }

        const role = await prisma.role.create({
            data: {
                name,
                description,
                permissions: permissions ?? {},
            },
        });

        return res.status(201).json(
            new ApiResponse(
                201,
                [],
                role,
                "Role created successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to create role"
            )
        );
    }
};

export const updateRole = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const existingRole = await prisma.role.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!existingRole) {
            return res.status(404).json(
                new ApiResponse(
                    404,
                    [{ message: "Role not found" }],
                    null,
                    "Role not found"
                )
            );
        }

        const {
            name,
            description,
            permissions,
        } = req.body;

        const role = await prisma.role.update({
            where: {
                id: existingRole.id,
            },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(permissions !== undefined && { permissions }),
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                role,
                "Role updated successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to update role"
            )
        );
    }
};

export const deleteRole = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const role = await prisma.role.findUnique({
            where: {
                id: req.params.id,
            },
        });

        if (!role) {
            return res.status(404).json(
                new ApiResponse(
                    404,
                    [{ message: "Role not found" }],
                    null,
                    "Role not found"
                )
            );
        }

        await prisma.role.delete({
            where: {
                id: role.id,
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                null,
                "Role deleted successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to delete role"
            )
        );
    }
};

export const listLeads = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const leads = await prisma.lead.findMany({
            include: {
                company: true,
                contact: true,
                assignedTo: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                leads,
                "Leads retrieved successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to retrieve leads"
            )
        );
    }
};

export const listCustomers = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const customers = await prisma.customer.findMany({
            include: {
                company: true,
                tasks: true,
                activities: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                customers,
                "Customers retrieved successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to retrieve customers"
            )
        );
    }
};

export const listCompanies = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const companies = await prisma.company.findMany({
            include: {
                contacts: true,
                customers: true,
                leads: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                companies,
                "Companies retrieved successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to retrieve companies"
            )
        );
    }
};

export const listDeals = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const deals = await prisma.deal.findMany({
            include: {
                customer: true,
                assignedTo: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                deals,
                "Deals retrieved successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to retrieve deals"
            )
        );
    }
};

export const getReports = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid);

        if (result.error) {
            return res.status(403).json(
                new ApiResponse(
                    403,
                    [{ message: result.error }],
                    null,
                    result.error
                )
            );
        }

        const [
            totalUsers,
            activeUsers,
            inactiveUsers,
            totalLeads,
            totalCustomers,
            totalCompanies,
            totalDeals,
            wonDeals,
            lostDeals,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({
                where: {
                    status: "ACTIVE",
                },
            }),
            prisma.user.count({
                where: {
                    status: "INACTIVE",
                },
            }),
            prisma.lead.count(),
            prisma.customer.count(),
            prisma.company.count(),
            prisma.deal.count(),
            prisma.deal.count({
                where: {
                    stage: "WON",
                },
            }),
            prisma.deal.count({
                where: {
                    stage: "LOST",
                },
            }),
        ]);

        const reports = {
            users: {
                total: totalUsers,
                active: activeUsers,
                inactive: inactiveUsers,
            },
            crm: {
                leads: totalLeads,
                customers: totalCustomers,
                companies: totalCompanies,
                deals: totalDeals,
                wonDeals,
                lostDeals,
            },
        };

        return res.status(200).json(
            new ApiResponse(
                200,
                [],
                reports,
                "Reports retrieved successfully"
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                [{ message: error.message }],
                null,
                "Failed to retrieve reports"
            )
        );
    }
};
