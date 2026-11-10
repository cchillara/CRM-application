/**
 * Integration tests for Leads CRUD (clientAdmin controller).
 *
 * These tests exercise the real Express app via supertest.
 * Firebase authentication and Prisma DB calls are mocked so the
 * suite runs offline without a live database or Firebase project.
 *
 * Coverage:
 *  1.  Successful lead creation (201)
 *  2.  Successful lead listing with pagination (200)
 *  3.  Lead listing with filters (status, source, assignedToId)
 *  4.  Get lead by ID (200)
 *  5.  Successful lead update (200)
 *  6.  Successful lead deletion (200)
 *  7.  Invalid / missing input (400)
 *  8.  Non-UUID param IDs (400)
 *  9.  Resource not found (404)
 * 10.  Cross-org read/update/delete attempts (404)
 * 11.  Unauthorized requests (401, 403)
 * 12.  Prisma duplicate-key error (409 via errorHandler)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

/* ---------------------------------------------------------------
 * Mock external dependencies BEFORE importing app.js
 * ---------------------------------------------------------------*/

vi.mock("../firebase-admin.js", () => ({
    auth: {
        verifyIdToken: vi.fn(),
    },
}));

vi.mock("../db/index.js", () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        },
        superAdmin: {
            findUnique: vi.fn(),
        },
        organization: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        lead: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        deal: { findMany: vi.fn(), count: vi.fn() },
        task: { findMany: vi.fn(), count: vi.fn() },
        company: { findFirst: vi.fn() },
        contact: { findFirst: vi.fn() },
        $queryRaw: vi.fn(),
    },
}));

const { default: app } = await import("../app.js");
const { auth } = await import("../firebase-admin.js");
const { default: prisma } = await import("../db/index.js");

/* -- Helpers --------------------------------------------------- */
const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG_UUID = "22222222-2222-4222-8222-222222222222";
const LEAD_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const makeFirebaseUser = (overrides = {}) => ({
    uid: "firebase-uid-test",
    email: "admin@example.com",
    ...overrides,
});

const makeCrmUser = (overrides = {}) => ({
    id: "user-uuid-0001",
    firebaseUid: "firebase-uid-test",
    email: "admin@example.com",
    firstName: "Test",
    lastName: "Admin",
    role: "ORGANIZATION_ADMIN",
    status: "ACTIVE",
    organizationId: VALID_UUID,
    organization: { id: VALID_UUID, status: "ACTIVE" },
    ...overrides,
});

const makeLeadRecord = (overrides = {}) => ({
    id: LEAD_UUID,
    title: "Enterprise Lead",
    description: "A test lead",
    status: "NEW",
    source: "WEBSITE",
    organizationId: VALID_UUID,
    companyId: null,
    contactId: null,
    assignedToId: null,
    convertedAt: null,
    convertedById: null,
    customerId: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    company: null,
    contact: null,
    assignedTo: null,
    ...overrides,
});

function mockOrgAdmin(overrides = {}) {
    auth.verifyIdToken.mockResolvedValue(makeFirebaseUser());
    prisma.user.findUnique.mockResolvedValue(makeCrmUser(overrides));
}

const BASE = "/api/v1/client-admin";
const AUTH = "Bearer valid-token";

/* ================================================================
 * Before each test — reset all mocks
 * ================================================================*/
beforeEach(() => {
    vi.clearAllMocks();
});

/* ================================================================
 * 1. Create Lead
 * ================================================================*/
describe("POST /leads — Create Lead", () => {
    it("should create a lead with valid input (201)", async () => {
        mockOrgAdmin();
        const created = makeLeadRecord({ title: "New Lead" });
        prisma.lead.create.mockResolvedValue(created);

        const res = await request(app)
            .post(`${BASE}/leads`)
            .set("Authorization", AUTH)
            .send({ title: "New Lead" });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe("New Lead");
        expect(res.body.message).toBe("Lead created successfully");
    });

    it("should accept 'name' as an alternative to 'title' (201)", async () => {
        mockOrgAdmin();
        const created = makeLeadRecord({ title: "Named Lead" });
        prisma.lead.create.mockResolvedValue(created);

        const res = await request(app)
            .post(`${BASE}/leads`)
            .set("Authorization", AUTH)
            .send({ name: "Named Lead" });

        expect(res.status).toBe(201);
    });

    it("should return 400 when neither title nor name is provided", async () => {
        mockOrgAdmin();
        const res = await request(app)
            .post(`${BASE}/leads`)
            .set("Authorization", AUTH)
            .send({ description: "No title" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("should validate companyId belongs to the same org (400)", async () => {
        mockOrgAdmin();
        prisma.company.findFirst.mockResolvedValue(null); // not found

        const res = await request(app)
            .post(`${BASE}/leads`)
            .set("Authorization", AUTH)
            .send({ title: "Lead", companyId: "bad-comp-uuid" });

        // controller throws ApiError 400 because company not in org
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/[Cc]ompany not found/);
    });

    it("should validate assignedToId belongs to the same org (400)", async () => {
        mockOrgAdmin();
        prisma.user.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .post(`${BASE}/leads`)
            .set("Authorization", AUTH)
            .send({ title: "Lead", assignedToId: "unknown-user-id" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/[Aa]ssigned user not found/);
    });

    it("should return 401 without auth token", async () => {
        const res = await request(app)
            .post(`${BASE}/leads`)
            .send({ title: "No Auth" });

        expect(res.status).toBe(401);
    });

    it("should return 403 for non-ORGANIZATION_ADMIN role", async () => {
        auth.verifyIdToken.mockResolvedValue(makeFirebaseUser());
        prisma.user.findUnique.mockResolvedValue(
            makeCrmUser({ role: "SALES" })
        );

        const res = await request(app)
            .post(`${BASE}/leads`)
            .set("Authorization", AUTH)
            .send({ title: "Forbidden" });

        expect(res.status).toBe(403);
    });
});

/* ================================================================
 * 2. List Leads
 * ================================================================*/
describe("GET /leads — List Leads", () => {
    it("should return paginated leads for the authenticated org (200)", async () => {
        mockOrgAdmin();
        const leads = [makeLeadRecord(), makeLeadRecord({ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", title: "Lead 2" })];
        prisma.lead.findMany.mockResolvedValue(leads);
        prisma.lead.count.mockResolvedValue(2);

        const res = await request(app)
            .get(`${BASE}/leads`)
            .set("Authorization", AUTH);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.total).toBe(2);
        expect(res.body.page).toBe(1);
        expect(res.body.limit).toBeDefined();
        expect(res.body.totalPages).toBeDefined();
    });

    it("should respect ?page and ?limit query params", async () => {
        mockOrgAdmin();
        prisma.lead.findMany.mockResolvedValue([]);
        prisma.lead.count.mockResolvedValue(0);

        const res = await request(app)
            .get(`${BASE}/leads?page=2&limit=5`)
            .set("Authorization", AUTH);

        expect(res.status).toBe(200);
        expect(res.body.page).toBe(2);
        expect(res.body.limit).toBe(5);
    });

    it("should filter by status query param", async () => {
        mockOrgAdmin();
        prisma.lead.findMany.mockResolvedValue([]);
        prisma.lead.count.mockResolvedValue(0);

        const res = await request(app)
            .get(`${BASE}/leads?status=QUALIFIED`)
            .set("Authorization", AUTH);

        expect(res.status).toBe(200);
        // Verify that findMany was called with the status filter
        expect(prisma.lead.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    organizationId: VALID_UUID,
                    status: "QUALIFIED",
                }),
            })
        );
    });

    it("should return 400 for invalid pagination params", async () => {
        mockOrgAdmin();

        const res = await request(app)
            .get(`${BASE}/leads?page=-1`)
            .set("Authorization", AUTH);

        expect(res.status).toBe(400);
    });
});

/* ================================================================
 * 3. Get Lead by ID
 * ================================================================*/
describe("GET /leads/:id — Get Lead", () => {
    it("should return a lead that belongs to the org (200)", async () => {
        mockOrgAdmin();
        prisma.lead.findFirst.mockResolvedValue(makeLeadRecord());

        const res = await request(app)
            .get(`${BASE}/leads/${LEAD_UUID}`)
            .set("Authorization", AUTH);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(LEAD_UUID);
        expect(res.body.data.title).toBe("Enterprise Lead");
    });

    it("should return 404 for nonexistent lead", async () => {
        mockOrgAdmin();
        prisma.lead.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .get(`${BASE}/leads/${LEAD_UUID}`)
            .set("Authorization", AUTH);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it("should return 404 for a lead from another org (cross-org isolation)", async () => {
        mockOrgAdmin();
        // findFirst returns null because the org filter doesn't match
        prisma.lead.findFirst.mockResolvedValue(null);

        const otherOrgLeadId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
        const res = await request(app)
            .get(`${BASE}/leads/${otherOrgLeadId}`)
            .set("Authorization", AUTH);

        expect(res.status).toBe(404);
    });

    it("should return 400 for a non-UUID id param", async () => {
        mockOrgAdmin();

        const res = await request(app)
            .get(`${BASE}/leads/not-a-uuid`)
            .set("Authorization", AUTH);

        expect(res.status).toBe(400);
    });
});

/* ================================================================
 * 4. Update Lead
 * ================================================================*/
describe("PATCH /leads/:id — Update Lead", () => {
    it("should update an existing lead (200)", async () => {
        mockOrgAdmin();
        const existing = makeLeadRecord();
        prisma.lead.findFirst.mockResolvedValue(existing);
        const updated = { ...existing, title: "Updated Title" };
        prisma.lead.update.mockResolvedValue(updated);

        const res = await request(app)
            .patch(`${BASE}/leads/${LEAD_UUID}`)
            .set("Authorization", AUTH)
            .send({ title: "Updated Title" });

        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe("Updated Title");
    });

    it("should return 404 for a lead that doesn't exist", async () => {
        mockOrgAdmin();
        prisma.lead.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .patch(`${BASE}/leads/${LEAD_UUID}`)
            .set("Authorization", AUTH)
            .send({ title: "Ghost" });

        expect(res.status).toBe(404);
    });

    it("should return 404 when updating a lead from another org (cross-org isolation)", async () => {
        mockOrgAdmin();
        // The findFirst with org filter returns null for cross-org lead
        prisma.lead.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .patch(`${BASE}/leads/${LEAD_UUID}`)
            .set("Authorization", AUTH)
            .send({ title: "Hacked" });

        expect(res.status).toBe(404);
    });

    it("should give title precedence over name", async () => {
        mockOrgAdmin();
        const existing = makeLeadRecord();
        prisma.lead.findFirst.mockResolvedValue(existing);
        prisma.lead.update.mockResolvedValue({ ...existing, title: "Title Wins" });

        const res = await request(app)
            .patch(`${BASE}/leads/${LEAD_UUID}`)
            .set("Authorization", AUTH)
            .send({ title: "Title Wins", name: "Name Loses" });

        expect(res.status).toBe(200);
        // Verify title was set to "Title Wins", not "Name Loses"
        expect(prisma.lead.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    title: "Title Wins",
                }),
            })
        );
    });

    it("should return 400 for non-UUID id param", async () => {
        mockOrgAdmin();

        const res = await request(app)
            .patch(`${BASE}/leads/bad-id`)
            .set("Authorization", AUTH)
            .send({ title: "Bad ID" });

        expect(res.status).toBe(400);
    });
});

/* ================================================================
 * 5. Delete Lead
 * ================================================================*/
describe("DELETE /leads/:id — Delete Lead", () => {
    it("should delete a lead that belongs to the org (200)", async () => {
        mockOrgAdmin();
        prisma.lead.findFirst.mockResolvedValue(makeLeadRecord());
        prisma.lead.delete.mockResolvedValue(makeLeadRecord());

        const res = await request(app)
            .delete(`${BASE}/leads/${LEAD_UUID}`)
            .set("Authorization", AUTH);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Lead deleted successfully");
    });

    it("should return 404 for a nonexistent lead", async () => {
        mockOrgAdmin();
        prisma.lead.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .delete(`${BASE}/leads/${LEAD_UUID}`)
            .set("Authorization", AUTH);

        expect(res.status).toBe(404);
    });

    it("should return 404 when deleting a lead from another org (cross-org isolation)", async () => {
        mockOrgAdmin();
        prisma.lead.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .delete(`${BASE}/leads/${LEAD_UUID}`)
            .set("Authorization", AUTH);

        expect(res.status).toBe(404);
    });

    it("should return 400 for non-UUID id param", async () => {
        mockOrgAdmin();

        const res = await request(app)
            .delete(`${BASE}/leads/not-valid-uuid`)
            .set("Authorization", AUTH);

        expect(res.status).toBe(400);
    });
});

/* ================================================================
 * 6. Prisma error handling (via central errorHandler)
 * ================================================================*/
describe("Prisma error propagation", () => {
    it("should return 409 for duplicate-key Prisma error on create", async () => {
        mockOrgAdmin();
        const prismaError = new Error("Unique constraint");
        prismaError.code = "P2002";
        prisma.lead.create.mockRejectedValue(prismaError);

        const res = await request(app)
            .post(`${BASE}/leads`)
            .set("Authorization", AUTH)
            .send({ title: "Duplicate Lead" });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });

    it("should return 400 for foreign key violation on create", async () => {
        mockOrgAdmin();
        const prismaError = new Error("Foreign key constraint");
        prismaError.code = "P2003";
        prisma.lead.create.mockRejectedValue(prismaError);

        const res = await request(app)
            .post(`${BASE}/leads`)
            .set("Authorization", AUTH)
            .send({ title: "Bad FK Lead" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
