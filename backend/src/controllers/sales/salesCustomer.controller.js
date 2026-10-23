import { CustomerStatus } from "../../generated/prisma/client.ts";
import prisma from "../../db/index.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const customerRelations = (organizationId) => ({
    company: {
        select: {
            name: true,
            email: true,
            phone: true,
            contacts: {
                where: { company: { is: { organizationId } } },
                select: { firstName: true, lastName: true, email: true, phone: true },
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
    },
    activities: {
        where: { organizationId },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
    },
    assignedTo: {
        select: { firstName: true, lastName: true },
    },
});

const formatCustomer = (customer) => {
    const contact = customer.company.contacts[0];
    return {
        id: customer.id,
        name: contact
            ? [contact.firstName, contact.lastName].filter(Boolean).join(" ")
            : customer.company.name,
        company: customer.company.name,
        email: contact?.email || customer.company.email || "",
        phone: contact?.phone || customer.company.phone || "",
        status: customer.status,
        lastContact: customer.activities[0]?.createdAt || null,
        assignedTo: customer.assignedTo
            ? [customer.assignedTo.firstName, customer.assignedTo.lastName].filter(Boolean).join(" ")
            : "",
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
    };
};

export const getSalesCustomers = asyncHandler(async (req, res) => {
    const customers = await prisma.customer.findMany({
        where: {
            organizationId: req.organizationId,
            company: { is: { organizationId: req.organizationId } },
        },
        include: customerRelations(req.organizationId),
        orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(
        new ApiResponse(200, [], customers.map(formatCustomer), "Customers retrieved successfully")
    );
});

export const getSalesCustomerById = asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findFirst({
        where: {
            id: req.params.customerId,
            organizationId: req.organizationId,
            company: { is: { organizationId: req.organizationId } },
        },
        include: customerRelations(req.organizationId),
    });
    if (!customer) throw new ApiError(404, "Customer not found");

    return res.status(200).json(
        new ApiResponse(200, [], formatCustomer(customer), "Customer retrieved successfully")
    );
});

export const createSalesCustomer = asyncHandler(async (req, res) => {
    const { name, company: companyName, email, phone, status = CustomerStatus.ACTIVE } = req.body || {};

    if (!name?.trim() || !companyName?.trim()) {
        throw new ApiError(400, "Customer name and company are required");
    }
    if (!Object.values(CustomerStatus).includes(status)) {
        throw new ApiError(400, "Invalid customer status");
    }

    try {
        const customer = await prisma.$transaction(async (tx) => {
            let company = await tx.company.findFirst({
                where: { name: companyName.trim(), organizationId: req.organizationId },
                select: { id: true },
            });

            if (!company) {
                company = await tx.company.create({
                    data: { name: companyName.trim(), organizationId: req.organizationId },
                    select: { id: true },
                });
            }

            const existingCustomer = await tx.customer.findFirst({
                where: { organizationId: req.organizationId, companyId: company.id },
                select: { id: true },
            });
            if (existingCustomer) throw new ApiError(409, "This company is already a customer");

            const [firstName, ...lastName] = name.trim().split(/\s+/);
            await tx.contact.create({
                data: {
                    firstName,
                    lastName: lastName.join(" ") || null,
                    email: email?.trim() || null,
                    phone: phone?.trim() || null,
                    companyId: company.id,
                },
            });

            return tx.customer.create({
                data: {
                    organizationId: req.organizationId,
                    companyId: company.id,
                    assignedToId: req.user.id,
                    status,
                },
                include: customerRelations(req.organizationId),
            });
        });

        return res.status(201).json(
            new ApiResponse(201, [], formatCustomer(customer), "Customer created successfully")
        );
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error?.code === "P2002") throw new ApiError(409, "This company is already a customer");
        throw error;
    }
});

export const updateSalesCustomer = asyncHandler(async (req, res) => {
    const { name, company: companyName, email, phone, status } = req.body || {};

    if (name !== undefined && !name.trim()) throw new ApiError(400, "Customer name cannot be empty");
    if (companyName !== undefined && !companyName.trim()) throw new ApiError(400, "Company cannot be empty");
    if (status !== undefined && !Object.values(CustomerStatus).includes(status)) {
        throw new ApiError(400, "Invalid customer status");
    }

    try {
        const customer = await prisma.$transaction(async (tx) => {
            const existingCustomer = await tx.customer.findFirst({
                where: {
                    id: req.params.customerId,
                    organizationId: req.organizationId,
                    company: { is: { organizationId: req.organizationId } },
                },
                select: { id: true, companyId: true },
            });
            if (!existingCustomer) throw new ApiError(404, "Customer not found");

            const company = await tx.company.findFirst({
                where: { id: existingCustomer.companyId, organizationId: req.organizationId },
                select: {
                    id: true,
                    name: true,
                    contacts: {
                        where: { company: { is: { organizationId: req.organizationId } } },
                        select: { id: true },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                },
            });
            if (!company) throw new ApiError(404, "Company not found");

            if (companyName !== undefined) {
                await tx.company.update({
                    where: { id: company.id },
                    data: { name: companyName.trim() },
                });
            }

            if (name !== undefined || email !== undefined || phone !== undefined) {
                const contactData = {};
                if (name !== undefined) {
                    const [firstName, ...lastName] = name.trim().split(/\s+/);
                    contactData.firstName = firstName;
                    contactData.lastName = lastName.join(" ") || null;
                }
                if (email !== undefined) contactData.email = email?.trim() || null;
                if (phone !== undefined) contactData.phone = phone?.trim() || null;

                if (company.contacts[0]) {
                    const contact = await tx.contact.findFirst({
                        where: {
                            id: company.contacts[0].id,
                            company: { is: { organizationId: req.organizationId } },
                        },
                        select: { id: true },
                    });
                    if (!contact) throw new ApiError(404, "Contact not found");
                    await tx.contact.update({ where: { id: contact.id }, data: contactData });
                } else {
                    const contactName = name?.trim() || companyName?.trim() || company.name;
                    const [firstName, ...lastName] = contactName.split(/\s+/);
                    await tx.contact.create({
                        data: {
                            ...contactData,
                            firstName,
                            lastName: lastName.join(" ") || null,
                            companyId: company.id,
                        },
                    });
                }
            }

            if (status !== undefined) {
                await tx.customer.update({ where: { id: existingCustomer.id }, data: { status } });
            }

            return tx.customer.findFirst({
                where: {
                    id: existingCustomer.id,
                    organizationId: req.organizationId,
                    company: { is: { organizationId: req.organizationId } },
                },
                include: customerRelations(req.organizationId),
            });
        });

        return res.status(200).json(
            new ApiResponse(200, [], formatCustomer(customer), "Customer updated successfully")
        );
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error?.code === "P2002") throw new ApiError(409, "A company with this name already exists");
        throw error;
    }
});
