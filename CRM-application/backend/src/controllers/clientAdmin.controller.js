import crypto from "crypto";
import prisma from "../db/index.js";
import { ApiResponse } from "../utils/apiResponse.js";

// organizationId is attached by requireClientAdmin middleware (req.organizationId)

const validateUserRole = (role) => {
    return ["ORGANIZATION_ADMIN", "MANAGER", "SALES"].includes(role);
};

const validateUserStatus = (status) => {
    return ["INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"].includes(status);
};

const getClientAdmin = async (uid) => {
    const user = await prisma.user.findFirst({
        where: {
            OR: [{ firebaseUid: uid }, { id: uid }]
        }
    });
    if (!user) return { error: "User not found" };
    return { user };
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
        const orgId = req.organizationId;

        // Safe raw query to skip Prisma enum validation for legacy PENDING rows
        const leads = await prisma.$queryRawUnsafe(`
            SELECT
                l.id, l.title, l.description, l.status, l.source,
                l."organizationId", l."companyId", l."contactId",
                l."assignedToId", l."convertedAt", l."convertedById",
                l."customerId", l."createdAt", l."updatedAt",
                co.name AS "companyName",
                co.email AS "companyEmail",
                co.phone AS "companyPhone",
                ct."firstName" AS "contactFirstName",
                ct."lastName" AS "contactLastName",
                ct.email AS "contactEmail",
                ct.phone AS "contactPhone",
                ct."jobTitle" AS "contactJobTitle",
                u."firstName" AS "assignedFirstName",
                u."lastName" AS "assignedLastName"
            FROM "Lead" l
            LEFT JOIN "Company" co ON l."companyId" = co.id
            LEFT JOIN "Contact" ct ON l."contactId" = ct.id
            LEFT JOIN "User" u ON l."assignedToId" = u.id
            ORDER BY l."createdAt" DESC
        `);

        // Normalise & parse stringified JSON descriptions
        const formatted = leads.map((l) => {
            let meta = {};
            if (l.description) {
                try { if (l.description.startsWith("{")) meta = JSON.parse(l.description); } catch (_) {}
            }
            const contactName = l.contactFirstName
                ? `${l.contactFirstName || ""} ${l.contactLastName || ""}`.trim()
                : (meta.contact || meta.contactPerson || null);
            const assignedTo = l.assignedFirstName
                ? `${l.assignedFirstName || ""} ${l.assignedLastName || ""}`.trim()
                : (meta.assignedTo || "Unassigned");

            return {
                id: l.id,
                title: l.title,
                status: l.status,
                source: l.source,
                organizationId: l.organizationId,
                createdAt: l.createdAt,
                updatedAt: l.updatedAt,
                // flattened relations for easy frontend use
                contact: contactName ? {
                    firstName: l.contactFirstName,
                    lastName: l.contactLastName,
                    email: l.contactEmail || meta.email,
                    phone: l.contactPhone || meta.phone,
                    jobTitle: l.contactJobTitle,
                } : null,
                company: l.companyName ? {
                    id: l.companyId,
                    name: l.companyName,
                    email: l.companyEmail,
                    phone: l.companyPhone,
                } : null,
                assignedTo: assignedTo,
                // legacy extra fields from description JSON
                tier: meta.tier || null,
                value: meta.value || null,
                phone: l.contactPhone || meta.phone || null,
                email: l.contactEmail || meta.email || null,
                contactName: contactName,
            };
        });

        return res.status(200).json(new ApiResponse(200, [], formatted, "Leads retrieved successfully"));
    } catch (error) {
        console.error("[listLeads]", error);
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve leads"));
    }
};

export const listCustomers = async (req, res) => {
    try {
        const orgId = req.organizationId;
        const customers = await prisma.customer.findMany({
            include: { company: true, tasks: true, activities: true },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json(new ApiResponse(200, [], customers, "Customers retrieved successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve customers"));
    }
};

export const listCompanies = async (req, res) => {
    try {
        const orgId = req.organizationId;
        const companies = await prisma.company.findMany({
            include: { contacts: true, customers: true, leads: true },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json(new ApiResponse(200, [], companies, "Companies retrieved successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve companies"));
    }
};

export const listDeals = async (req, res) => {
    try {
        const orgId = req.organizationId;
        const deals = await prisma.deal.findMany({
            include: { customer: true, assignedTo: true },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json(new ApiResponse(200, [], deals, "Deals retrieved successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve deals"));
    }
};

// ── Tasks (shared with Sales) ─────────────────────────────────────────────────

export const listTasks = async (req, res) => {
    try {
        const orgId = req.organizationId;
        const tasks = await prisma.task.findMany({
            include: {
                assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
                lead: { select: { id: true, title: true } },
                customer: { select: { id: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json(new ApiResponse(200, [], tasks, "Tasks retrieved successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve tasks"));
    }
};

export const createTask = async (req, res) => {
    try {
        const orgId = req.organizationId;
        const { title, description, status, dueDate, endDate, eventType, assignedToId, leadId, customerId, dealId } = req.body;

        if (!title) return res.status(400).json(new ApiResponse(400, [{ message: "title is required" }], null, "Validation error"));

        // Resolve assignedToId — fall back to caller
        let resolvedAssignedTo = assignedToId || req.user.id;

        const task = await prisma.task.create({
            data: {
                title,
                description: description || null,
                status: status || "TODO",
                dueDate: dueDate ? new Date(dueDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                eventType: eventType || "TASK",
                organizationId: orgId,
                assignedToId: resolvedAssignedTo,
                leadId: leadId || null,
                customerId: customerId || null,
                dealId: dealId || null,
            },
            include: {
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
                lead: { select: { id: true, title: true } },
            },
        });

        return res.status(201).json(new ApiResponse(201, [], task, "Task created successfully"));
    } catch (error) {
        console.error("[createTask]", error);
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to create task"));
    }
};

export const updateTask = async (req, res) => {
    try {
        const orgId = req.organizationId;
        const { taskId } = req.params;
        const { title, description, status, dueDate, endDate, eventType, assignedToId } = req.body;

        const existing = await prisma.task.findFirst({ where: { id: taskId } });
        if (!existing) return res.status(404).json(new ApiResponse(404, [], null, "Task not found"));

        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(status !== undefined && { status }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(eventType !== undefined && { eventType }),
                ...(assignedToId !== undefined && { assignedToId }),
            },
            include: {
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        return res.status(200).json(new ApiResponse(200, [], task, "Task updated successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to update task"));
    }
};

export const deleteTask = async (req, res) => {
    try {
        const orgId = req.organizationId;
        const { taskId } = req.params;

        const existing = await prisma.task.findFirst({ where: { id: taskId } });
        if (!existing) return res.status(404).json(new ApiResponse(404, [], null, "Task not found"));

        await prisma.task.delete({ where: { id: taskId } });
        return res.status(200).json(new ApiResponse(200, [], null, "Task deleted successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to delete task"));
    }
};

export const getReports = async (req, res) => {
    try {
        const orgId = req.organizationId;
        const [
            totalUsers,
            activeUsers,
            totalLeads,
            totalCustomers,
            totalCompanies,
            totalDeals,
            wonDeals,
            lostDeals,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: "ACTIVE" } }),
            prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "Lead" WHERE "organizationId" = $1`, orgId).then((r) => Number(r[0].count)),
            prisma.customer.count(),
            prisma.company.count(),
            prisma.deal.count(),
            prisma.deal.count({ where: { stage: "WON" } }),
            prisma.deal.count({ where: { stage: "LOST" } }),
        ]);

        const reports = {
            users: { total: totalUsers, active: activeUsers },
            crm: { leads: totalLeads, customers: totalCustomers, companies: totalCompanies, deals: totalDeals, wonDeals, lostDeals },
        };

        return res.status(200).json(new ApiResponse(200, [], reports, "Reports retrieved successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve reports"));
    }
};

export const createLead = async (req, res) => {
    try {
        const { title, name, contact, email, phone, tier, numericValue, value, status, source } = req.body;
        const leadTitle = title || name;
        if (!leadTitle) return res.status(400).json(new ApiResponse(400, [{ message: "title or name is required" }], null, "Validation error"));

        const org = await prisma.organization.findFirst();
        const orgId = req.organizationId || org?.id || "101";

        let companyId = null;
        if (name) {
            const co = await prisma.company.create({
                data: { name, email: email || null, phone: phone || null, organizationId: orgId }
            });
            companyId = co.id;
        }

        let contactId = null;
        if (contact) {
            const [firstName, ...rest] = String(contact).split(/\s+/);
            const ct = await prisma.contact.create({
                data: {
                    firstName,
                    lastName: rest.join(" ") || null,
                    email: email || null,
                    phone: phone || null,
                    companyId: companyId,
                }
            });
            contactId = ct.id;
        }

        const meta = {
            name: leadTitle,
            contact: contact || null,
            email: email || null,
            phone: phone || null,
            tier: tier || "Growth",
            numericValue: Number(numericValue) || 0,
            value: value || "",
            status: status || "NEW",
            source: source || "Website",
        };

        const lead = await prisma.lead.create({
            data: {
                title: leadTitle,
                description: JSON.stringify(meta),
                status: (status && status.toUpperCase() === "ACTIVE") ? "NEW" : (status || "NEW"),
                source: source || "Website",
                organizationId: orgId,
                companyId,
                contactId,
                assignedToId: req.user.id,
            }
        });

        return res.status(201).json(new ApiResponse(201, [], lead, "Lead created successfully"));
    } catch (error) {
        console.error("[createLead]", error);
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to create lead"));
    }
};

export const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, name, contact, email, phone, tier, numericValue, value, status, source } = req.body;

        const existing = await prisma.lead.findUnique({
            where: { id },
            include: { company: true, contact: true }
        });
        if (!existing) return res.status(404).json(new ApiResponse(404, [], null, "Lead not found"));

        let meta = {};
        if (existing.description && existing.description.startsWith("{")) {
            try { meta = JSON.parse(existing.description); } catch (_) {}
        }
        if (name) meta.name = name;
        if (contact) meta.contact = contact;
        if (email) meta.email = email;
        if (phone) meta.phone = phone;
        if (tier) meta.tier = tier;
        if (numericValue !== undefined) meta.numericValue = Number(numericValue);
        if (value !== undefined) meta.value = value;
        if (status) meta.status = status;
        if (source) meta.source = source;

        const newStatus = status ? (status.toUpperCase() === "ACTIVE" ? "NEW" : status.toUpperCase()) : existing.status;

        if (existing.companyId && (name || email || phone)) {
            await prisma.company.update({
                where: { id: existing.companyId },
                data: {
                    ...(name && { name }),
                    ...(email && { email }),
                    ...(phone && { phone }),
                }
            }).catch(() => {});
        }

        if (existing.contactId && (contact || email || phone)) {
            const [firstName, ...rest] = String(contact || "").split(/\s+/);
            await prisma.contact.update({
                where: { id: existing.contactId },
                data: {
                    ...(firstName && { firstName }),
                    ...(rest.length > 0 && { lastName: rest.join(" ") }),
                    ...(email && { email }),
                    ...(phone && { phone }),
                }
            }).catch(() => {});
        }

        const updated = await prisma.lead.update({
            where: { id },
            data: {
                ...(title || name ? { title: title || name } : {}),
                description: JSON.stringify(meta),
                ...(newStatus ? { status: newStatus } : {}),
                ...(source ? { source } : {}),
            }
        });

        return res.status(200).json(new ApiResponse(200, [], updated, "Lead updated successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to update lead"));
    }
};

export const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.lead.findUnique({ where: { id } });
        if (!existing) return res.status(404).json(new ApiResponse(404, [], null, "Lead not found"));

        await prisma.lead.delete({ where: { id } });
        return res.status(200).json(new ApiResponse(200, [], null, "Lead deleted successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to delete lead"));
    }
};

export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing) return res.status(404).json(new ApiResponse(404, [], null, "Customer not found"));

        const updated = await prisma.customer.update({
            where: { id },
            data: { ...(status && { status }) }
        });
        return res.status(200).json(new ApiResponse(200, [], updated, "Customer updated successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to update customer"));
    }
};

export const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing) return res.status(404).json(new ApiResponse(404, [], null, "Customer not found"));

        await prisma.customer.delete({ where: { id } });
        return res.status(200).json(new ApiResponse(200, [], null, "Customer deleted successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to delete customer"));
    }
};