import prisma from "../db/index.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const DEFAULT_SETTINGS = {
    platformName: "SHNOOR CRM",
    supportEmail: "support@shnoor.com",
    allowSignup: true,
    emailAlerts: true,
    maintenanceMode: false,
};

export const getSettings = asyncHandler(async (req, res) => {
    let org = null;
    if (req.organizationId) {
        org = await prisma.organization.findFirst({
            where: { id: req.organizationId },
        });
    }
    if (!org) {
        org = await prisma.organization.findFirst();
    }

    const latestSettingsLog = await prisma.auditLog.findFirst({
        where: { entityType: "Settings" },
        orderBy: { createdAt: "desc" },
    });

    const savedValues = latestSettingsLog?.newValues || {};

    const settings = {
        platformName: savedValues.platformName || org?.name || DEFAULT_SETTINGS.platformName,
        supportEmail: savedValues.supportEmail || org?.email || DEFAULT_SETTINGS.supportEmail,
        allowSignup: savedValues.allowSignup !== undefined ? Boolean(savedValues.allowSignup) : DEFAULT_SETTINGS.allowSignup,
        emailAlerts: savedValues.emailAlerts !== undefined ? Boolean(savedValues.emailAlerts) : DEFAULT_SETTINGS.emailAlerts,
        maintenanceMode: savedValues.maintenanceMode !== undefined ? Boolean(savedValues.maintenanceMode) : DEFAULT_SETTINGS.maintenanceMode,
    };

    return res.status(200).json(
        new ApiResponse(200, [], settings, "Settings retrieved successfully")
    );
});

export const updateSettings = asyncHandler(async (req, res) => {
    const { platformName, supportEmail, allowSignup, emailAlerts, maintenanceMode } = req.body || {};

    let org = null;
    if (req.organizationId) {
        org = await prisma.organization.findFirst({
            where: { id: req.organizationId },
        });
    }
    if (!org) {
        org = await prisma.organization.findFirst();
    }

    const latestSettingsLog = await prisma.auditLog.findFirst({
        where: { entityType: "Settings" },
        orderBy: { createdAt: "desc" },
    });

    const oldValues = latestSettingsLog?.newValues || DEFAULT_SETTINGS;

    const newValues = {
        platformName: platformName !== undefined ? String(platformName).trim() : oldValues.platformName || org?.name || DEFAULT_SETTINGS.platformName,
        supportEmail: supportEmail !== undefined ? String(supportEmail).trim() : oldValues.supportEmail || org?.email || DEFAULT_SETTINGS.supportEmail,
        allowSignup: allowSignup !== undefined ? Boolean(allowSignup) : oldValues.allowSignup ?? DEFAULT_SETTINGS.allowSignup,
        emailAlerts: emailAlerts !== undefined ? Boolean(emailAlerts) : oldValues.emailAlerts ?? DEFAULT_SETTINGS.emailAlerts,
        maintenanceMode: maintenanceMode !== undefined ? Boolean(maintenanceMode) : oldValues.maintenanceMode ?? DEFAULT_SETTINGS.maintenanceMode,
    };

    // Update organization name / email if organization exists
    if (org) {
        await prisma.organization.update({
            where: { id: org.id },
            data: {
                name: newValues.platformName || org.name,
                email: newValues.supportEmail || org.email,
            },
        }).catch(() => { });
    }

    // Persist settings snapshot in AuditLog
    await prisma.auditLog.create({
        data: {
            action: "UPDATE_SETTINGS",
            entityType: "Settings",
            entityId: org?.id || "global",
            organizationId: org?.id || null,
            actorId: req.user?.id || null,
            oldValues,
            newValues,
        },
    }).catch(() => { });

    return res.status(200).json(
        new ApiResponse(200, [], newValues, "Settings updated successfully")
    );
});

