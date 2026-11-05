const mapLeadSource = (src) => {
    const s = String(src || '').toUpperCase().trim();
    if (s.includes('WEB')) return 'WEBSITE';
    if (s.includes('REF')) return 'REFERRAL';
    if (s.includes('LINKEDIN') || s.includes('SOCIAL')) return 'SOCIAL_MEDIA';
    if (s.includes('EMAIL')) return 'EMAIL';
    if (s.includes('PHONE') || s.includes('CALL')) return 'PHONE';
    if (s.includes('AD')) return 'ADVERTISEMENT';
    return 'OTHER';
};

const validateUserRole = (r) => ['ORGANIZATION_ADMIN', 'MANAGER', 'SALES'].includes(r);
const validateUserStatus = (s) => ['INVITED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(s);

const mapLeadStatus = (st) => {
    const s = String(st || '').toUpperCase().trim();
    if (['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'PENDING', 'CONVERTED'].includes(s)) return s;
    if (s === 'ACTIVE') return 'NEW';
    return 'NEW';
};

const getClientAdmin = async (firebaseUid, email) => {
    let user = await prisma.user.findUnique({
        where: {
            firebaseUid,
        },
        select: {
            id: true,
            role: true,
            organizationId: true,
        },
    });

    if (!user && email) {
        user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, role: true, organizationId: true },
        });
        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: { firebaseUid },
            });
        }
    }

    if (!user) {
        let org = await prisma.organization.findFirst();
        if (!org) {
            org = await prisma.organization.create({
                data: {
                    name: "SHNOOR CRM Organization",
                    email: email || "admin@crmclient.com",
                    status: "ACTIVE",
                },
            });
        }

        user = await prisma.user.create({
            data: {
                firebaseUid,
                email: email || `user_${firebaseUid.slice(0, 8)}@crmclient.com`,
                firstName: "Client",
                lastName: "Admin",
                role: "ORGANIZATION_ADMIN",
                status: "ACTIVE",
                organizationId: org.id,
            },
            select: {
                id: true,
                role: true,
                organizationId: true,
            },
        });
    }

    if (!user.organizationId) {
        let org = await prisma.organization.findFirst();
        if (!org) {
            org = await prisma.organization.create({
                data: {
                    name: "SHNOOR CRM Organization",
                    email: "admin@crmclient.com",
                    status: "ACTIVE",
                },
            });
        }
        user = await prisma.user.update({
            where: { id: user.id },
            data: { organizationId: org.id },
            select: {
                id: true,
                role: true,
                organizationId: true,
            },
        });
    }

    return {
        user,
    };
};
const formatLead = (l) => {
    let extraMeta = {};
    if (l.description) {
        try {
            if (l.description.startsWith('{')) {
                extraMeta = JSON.parse(l.description);
            }
        } catch (e) { }
    }

    const contactName = l.contact?.name || extraMeta.contact || extraMeta.contactPerson || 'Direct Contact';
    const email = l.contact?.email || extraMeta.email || 'contact@lead.com';
    const phone = l.contact?.phone || extraMeta.phone || '-';
    const tier = extraMeta.tier || 'Growth';
    const numVal = Number(extraMeta.value ?? extraMeta.numericValue) || 0;
    const assignedName = l.assignedTo
        ? `${l.assignedTo.firstName || ''} ${l.assignedTo.lastName || ''}`.trim()
        : (extraMeta.assignedTo || 'Unassigned');

    const formattedStatus = l.status === 'NEW'
        ? 'Active'
        : (l.status === 'PENDING'
            ? 'Pending'
            : (l.status === 'CONTACTED'
                ? 'Contacted'
                : (l.status === 'QUALIFIED'
                    ? 'Qualified'
                    : (l.status === 'UNQUALIFIED'
                        ? 'Unqualified'
                        : (l.status === 'CONVERTED'
                            ? 'Converted'
                            : 'Active')))));
    const formattedSource = l.source ? (l.source.charAt(0) + l.source.slice(1).toLowerCase().replace('_', ' ')) : 'Website';

    const nameStr = l.title || 'Untitled Lead';
    const initials = nameStr.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'LE';
    const stLower = formattedStatus.toLowerCase();
    const stType = ['active', 'qualified', 'contacted', 'pending', 'unqualified', 'converted'].includes(stLower) ? stLower : 'pending';

    return {
        id: l.id,
        name: l.title,
        title: l.title,
        contact: contactName,
        email,
        phone,
        tier,
        avatarInitials: initials,
        value: numVal ? `$${numVal.toLocaleString()}` : '$0',
        numericValue: numVal,
        status: formattedStatus,
        statusType: stType,
        source: formattedSource,
        assignedTo: assignedName,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt
    };
};

const mapDealStage = (st) => {
    const s = String(st || '').toUpperCase().trim();
    if (['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].includes(s)) return s;
    if (s === 'QUALIFIED') return 'QUALIFICATION';
    return 'PROPOSAL';
};

const formatDeal = (d) => {
    let extraMeta = {};
    if (d.description) {
        try {
            if (d.description.startsWith('{')) extraMeta = JSON.parse(d.description);
        } catch (e) { }
    }

    const companyName = d.customer?.company?.name || extraMeta.company || 'Enterprise Client';
    const contactName = extraMeta.contact || 'Primary Contact';
    const ownerName = d.assignedTo ? `${d.assignedTo.firstName || ''} ${d.assignedTo.lastName || ''}`.trim() : (extraMeta.owner || 'Ravi Kiran');
    const stageName = d.stage === 'QUALIFICATION' ? 'Qualified' : (d.stage ? (d.stage.charAt(0) + d.stage.slice(1).toLowerCase()) : 'Proposal');

    return {
        id: d.id,
        title: d.title,
        company: companyName,
        contact: contactName,
        value: Number(d.value) || 0,
        stage: stageName,
        probability: extraMeta.probability ?? (d.stage === 'WON' ? 100 : d.stage === 'LOST' ? 0 : 60),
        owner: ownerName,
        expectedCloseDate: extraMeta.expectedCloseDate || (d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '2026-10-30'),
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
    };
};

export const getDashboard = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);
        if (result.error) {
            return res.status(403).json(new ApiResponse(403, [{ message: result.error }], null, result.error));
        }

        const [
            allLeads,
            allDeals
        ] = await Promise.all([
            prisma.lead.findMany({
                include: { company: true, contact: true, assignedTo: true },
                orderBy: { createdAt: "desc" }
            }),
            prisma.deal.findMany({
                include: { customer: { include: { company: true } }, assignedTo: true },
                orderBy: { createdAt: "desc" }
            })
        ]);

        const totalLeads = allLeads.length;
        const newLeadsCount = allLeads.filter(l => l.status === "NEW").length;
        const contactedLeadsCount = allLeads.filter(l => l.status === "CONTACTED").length;
        const qualifiedLeadsCount = allLeads.filter(l => l.status === "QUALIFIED").length;
        const unqualifiedLeadsCount = allLeads.filter(l => l.status === "UNQUALIFIED").length;
        const pendingLeadsCount = allLeads.filter(l => l.status === "PENDING").length;

        const totalDeals = allDeals.length;
        const openDealsCount = allDeals.filter(d => !["WON", "LOST"].includes(d.stage)).length;
        const wonDeals = allDeals.filter(d => d.stage === "WON");
        const wonDealsCount = wonDeals.length;
        const totalRevenue = wonDeals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
        const pipelineValue = allDeals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
        const conversionRate = totalDeals > 0 ? ((wonDealsCount / totalDeals) * 100).toFixed(1) : 0;

        const recentLeadsFormatted = allLeads.slice(0, 6).map(formatLead);

        // All 5 LeadStatus enum values from schema.prisma
        const leadsByStatus = [
            { label: "New", count: newLeadsCount, percentage: totalLeads > 0 ? Math.round((newLeadsCount / totalLeads) * 100) : 0, color: "#2563eb" },
            { label: "Contacted", count: contactedLeadsCount, percentage: totalLeads > 0 ? Math.round((contactedLeadsCount / totalLeads) * 100) : 0, color: "#f59e0b" },
            { label: "Qualified", count: qualifiedLeadsCount, percentage: totalLeads > 0 ? Math.round((qualifiedLeadsCount / totalLeads) * 100) : 0, color: "#10b981" },
            { label: "Unqualified", count: unqualifiedLeadsCount, percentage: totalLeads > 0 ? Math.round((unqualifiedLeadsCount / totalLeads) * 100) : 0, color: "#ef4444" },
            { label: "Pending", count: pendingLeadsCount, percentage: totalLeads > 0 ? Math.round((pendingLeadsCount / totalLeads) * 100) : 0, color: "#8b5cf6" }
        ];

        return res.status(200).json(
            new ApiResponse(200, [], {
                totalLeads,
                qualifiedLeads: qualifiedLeadsCount,
                activeLeads: newLeadsCount,
                openDeals: openDealsCount,
                totalDeals,
                wonDeals: wonDealsCount,
                totalRevenue,
                pipelineValue,
                conversionRate: `${conversionRate}%`,
                recentLeads: recentLeadsFormatted,
                leadsByStatus,
                deals: allDeals.map(formatDeal)
            }, "Dashboard metrics retrieved successfully")
        );
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, [{ message: error.message }], null, "Failed to retrieve dashboard metrics"));
    }
};

export const listLeads = async (req, res) => {
    try {
        const result = await getClientAdmin(req.user.uid, req.user.email);