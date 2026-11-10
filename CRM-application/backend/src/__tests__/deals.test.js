/**
 * Integration tests for Deals CRUD (clientAdmin controller).
 *
 * These tests exercise the real Express app via supertest.
 * Firebase authentication and Prisma DB calls are mocked so the
 * suite runs offline without a live database or Firebase project.
 *
 * Coverage:
 *  1.  Successful deal creation (201)
 *  2.  Successful deal listing with pagination (200)
 *  3.  Deal listing with filters (stage, assignedToId, customerId)
 *  4.  Get deal by ID (200)
 *  5.  Successful deal update (200)
 *  6.  Successful deal deletion (200)
 *  7.  Invalid / missing input (400)
 *  8.  Non-UUID param IDs (400)
 *  9.  Resource not found (404)
 * 10.  Cross-org read/update/delete attempts (404)
 * 11.  Unauthorized requests (401, 403)
 * 12.  Prisma duplicate-key error (409 via errorHandler)
 * 13.  Prisma foreign-key error (400 via errorHandler)
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
        deal: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        customer: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        company: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        contact: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        task: {
            findMany: vi.fn(),
            count: vi.fn(),
        },
        $queryRaw: vi.fn(),
    },
}));

const { default: app } = await import("../app.js");
const { auth } = await import("../firebase-admin.js");
const { default: prisma } = await import("../db/index.js");

/* -- Helpers --------------------------------------------------- */
const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG_UUID = "22222222-2222-4222-8222-222222222222";
const DEAL_UUID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CUSTOMER_UUID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const USER_UUID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const BASE = "/api/v1/client-admin";
const AUTH = "Bearer valid-token";

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

const makeDealRecord = (overrides = {}) => ({
    id: DEAL_UUID,
    title: "Big Enterprise Deal",
    description: JSON.stringify({
        company: "Acme Corp",
        contact: "John Doe",
        owner: "Ravi Kiran",
        probability: 70,
        expectedCloseDate: "2026-11-30",
    }),
    value: 50000,
    stage: "PROPOSAL",
    organizationId: VALID_UUID,
    customerId: CUSTOMER_UUID,
    assignedToId: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    customer: {
        id: CUSTOMER_UUID,
        organizationId: VALID_UUID,
        company: { id: "comp-1", name: "Acme Corp" },
    },
    assignedTo: null,
    ...overrides,
});

function mockOrgAdmin(overrides = {}) {
    auth.verifyIdToken.mockResolvedValue(makeFirebaseUser());
    prisma.user.findUnique.mockResolvedValue(makeCrmUser(overrides));
}

/* ---------------------------------------------------------------
 * Test Suite
 * ---------------------------------------------------------------*/
describe("Deals Controller — clientAdmin", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockOrgAdmin();
    });

    /* =============================================================
     * 1. GET /deals — Listing, Pagination, and Filters
     * ============================================================= */
    describe("GET /deals", () => {
        it("should return a paginated list of deals scoped to the organisation", async () => {
            const records = [makeDealRecord()];
            prisma.deal.findMany.mockResolvedValue(records);
            prisma.deal.count.mockResolvedValue(1);

            const res = await request(app)
                .get(`${BASE}/deals?page=1&limit=10`)
                .set("Authorization", AUTH);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].title).toBe("Big Enterprise Deal");
            expect(res.body.total).toBe(1);
            expect(res.body.page).toBe(1);
            expect(res.body.limit).toBe(10);

            // Verify org scoping
            expect(prisma.deal.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ organizationId: VALID_UUID }),
                })
            );
        });

        it("should filter deals by stage, assignedToId, and customerId", async () => {
            prisma.deal.findMany.mockResolvedValue([]);
            prisma.deal.count.mockResolvedValue(0);

            const res = await request(app)
                .get(`${BASE}/deals?stage=WON&assignedToId=${USER_UUID}&customerId=${CUSTOMER_UUID}`)
                .set("Authorization", AUTH);

            expect(res.status).toBe(200);
            expect(prisma.deal.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        organizationId: VALID_UUID,
                        stage: "WON",
                        assignedToId: USER_UUID,
                        customerId: CUSTOMER_UUID,
                    }),
                })
            );
        });

        it("should handle custom sorting", async () => {
            prisma.deal.findMany.mockResolvedValue([]);
            prisma.deal.count.mockResolvedValue(0);

            const res = await request(app)
                .get(`${BASE}/deals?sortBy=value&sortOrder=asc`)
                .set("Authorization", AUTH);

            expect(res.status).toBe(200);
            expect(prisma.deal.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { value: "asc" },
                })
            );
        });
    });

    /* =============================================================
     * 2. GET /deals/:id — Single record retrieval
     * ============================================================= */
    describe("GET /deals/:id", () => {
        it("should return a single deal scoped to the organisation", async () => {
            const record = makeDealRecord();
            prisma.deal.findFirst.mockResolvedValue(record);

            const res = await request(app)
                .get(`${BASE}/deals/${DEAL_UUID}`)
                .set("Authorization", AUTH);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(DEAL_UUID);
            expect(res.body.data.title).toBe("Big Enterprise Deal");
            expect(prisma.deal.findFirst).toHaveBeenCalledWith({
                where: { id: DEAL_UUID, organizationId: VALID_UUID },
                include: expect.any(Object),
            });
        });

        it("should return 404 when deal belongs to another organisation (cross-org read)", async () => {
            prisma.deal.findFirst.mockResolvedValue(null);

            const res = await request(app)
                .get(`${BASE}/deals/${DEAL_UUID}`)
                .set("Authorization", AUTH);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not found/i);
        });

        it("should return 400 when :id is not a valid UUID", async () => {
            const res = await request(app)
                .get(`${BASE}/deals/invalid-uuid`)
                .set("Authorization", AUTH);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    /* =============================================================
     * 3. POST /deals — Creation
     * ============================================================= */
    describe("POST /deals", () => {
        it("should create a deal successfully with customerId", async () => {
            prisma.customer.findFirst.mockResolvedValue({
                id: CUSTOMER_UUID,
                organizationId: VALID_UUID,
            });
            prisma.deal.create.mockResolvedValue(makeDealRecord());

            const res = await request(app)
                .post(`${BASE}/deals`)
                .set("Authorization", AUTH)
                .send({
                    title: "Big Enterprise Deal",
                    value: 50000,
                    stage: "Proposal",
                    customerId: CUSTOMER_UUID,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe("Big Enterprise Deal");
            expect(prisma.deal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        title: "Big Enterprise Deal",
                        organizationId: VALID_UUID,
                        customerId: CUSTOMER_UUID,
                    }),
                })
            );
        });

        it("should auto-resolve customer from company name when customerId not provided", async () => {
            prisma.company.findFirst.mockResolvedValue({
                id: "comp-1",
                name: "Globex Inc",
                organizationId: VALID_UUID,
            });
            prisma.customer.findFirst.mockResolvedValue({
                id: "cust-resolved-1",
                organizationId: VALID_UUID,
                companyId: "comp-1",
            });
            prisma.deal.create.mockResolvedValue(
                makeDealRecord({ customerId: "cust-resolved-1" })
            );

            const res = await request(app)
                .post(`${BASE}/deals`)
                .set("Authorization", AUTH)
                .send({
                    title: "Globex Deal",
                    company: "Globex Inc",
                    value: 25000,
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(prisma.deal.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        title: "Globex Deal",
                        organizationId: VALID_UUID,
                        customerId: "cust-resolved-1",
                    }),
                })
            );
        });

        it("should return 400 when title is missing", async () => {
            const res = await request(app)
                .post(`${BASE}/deals`)
                .set("Authorization", AUTH)
                .send({
                    value: 1000,
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("should return 400 when customerId belongs to another organisation", async () => {
            prisma.customer.findFirst.mockResolvedValue(null);

            const res = await request(app)
                .post(`${BASE}/deals`)
                .set("Authorization", AUTH)
                .send({
                    title: "Malicious Deal",
                    customerId: OTHER_ORG_UUID,
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Customer not found in your organisation/i);
        });

        it("should return 400 when assignedToId belongs to another organisation", async () => {
            prisma.customer.findFirst.mockResolvedValue({
                id: CUSTOMER_UUID,
                organizationId: VALID_UUID,
            });
            prisma.user.findFirst.mockResolvedValue(null);

            const res = await request(app)
                .post(`${BASE}/deals`)
                .set("Authorization", AUTH)
                .send({
                    title: "Deal with invalid assignee",
                    customerId: CUSTOMER_UUID,
                    assignedToId: OTHER_ORG_UUID,
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Assigned user not found in your organisation/i);
        });
    });

    /* =============================================================
     * 4. PATCH /deals/:id — Update
     * ============================================================= */
    describe("PATCH /deals/:id", () => {
        it("should update a deal successfully after verifying org ownership", async () => {
            const existing = makeDealRecord();
            const updated = makeDealRecord({ title: "Updated Deal Title", value: 75000 });

            prisma.deal.findFirst.mockResolvedValue(existing);
            prisma.deal.update.mockResolvedValue(updated);

            const res = await request(app)
                .patch(`${BASE}/deals/${DEAL_UUID}`)
                .set("Authorization", AUTH)
                .send({
                    title: "Updated Deal Title",
                    value: 75000,
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe("Updated Deal Title");
            expect(prisma.deal.findFirst).toHaveBeenCalledWith({
                where: { id: DEAL_UUID, organizationId: VALID_UUID },
            });
            expect(prisma.deal.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: DEAL_UUID },
                    data: expect.objectContaining({
                        title: "Updated Deal Title",
                        value: 75000,
                    }),
                })
            );
        });

        it("should return 404 when updating deal belonging to another organisation", async () => {
            prisma.deal.findFirst.mockResolvedValue(null);

            const res = await request(app)
                .patch(`${BASE}/deals/${DEAL_UUID}`)
                .set("Authorization", AUTH)
                .send({ title: "Cross-org update" });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not found/i);
            expect(prisma.deal.update).not.toHaveBeenCalled();
        });

        it("should return 400 when updating with cross-org customerId", async () => {
            prisma.deal.findFirst.mockResolvedValue(makeDealRecord());
            prisma.customer.findFirst.mockResolvedValue(null);

            const res = await request(app)
                .patch(`${BASE}/deals/${DEAL_UUID}`)
                .set("Authorization", AUTH)
                .send({ customerId: OTHER_ORG_UUID });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Customer not found in your organisation/i);
            expect(prisma.deal.update).not.toHaveBeenCalled();
        });

        it("should return 400 when updating with cross-org assignedToId", async () => {
            prisma.deal.findFirst.mockResolvedValue(makeDealRecord());
            prisma.user.findFirst.mockResolvedValue(null);

            const res = await request(app)
                .patch(`${BASE}/deals/${DEAL_UUID}`)
                .set("Authorization", AUTH)
                .send({ assignedToId: OTHER_ORG_UUID });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Assigned user not found in your organisation/i);
            expect(prisma.deal.update).not.toHaveBeenCalled();
        });
    });

    /* =============================================================
     * 5. DELETE /deals/:id — Deletion
     * ============================================================= */
    describe("DELETE /deals/:id", () => {
        it("should delete a deal successfully after verifying org ownership", async () => {
            prisma.deal.findFirst.mockResolvedValue(makeDealRecord());
            prisma.deal.delete.mockResolvedValue(makeDealRecord());

            const res = await request(app)
                .delete(`${BASE}/deals/${DEAL_UUID}`)
                .set("Authorization", AUTH);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toMatch(/deleted successfully/i);
            expect(prisma.deal.findFirst).toHaveBeenCalledWith({
                where: { id: DEAL_UUID, organizationId: VALID_UUID },
            });
            expect(prisma.deal.delete).toHaveBeenCalledWith({
                where: { id: DEAL_UUID },
            });
        });

        it("should return 404 when deleting deal belonging to another organisation", async () => {
            prisma.deal.findFirst.mockResolvedValue(null);

            const res = await request(app)
                .delete(`${BASE}/deals/${DEAL_UUID}`)
                .set("Authorization", AUTH);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not found/i);
            expect(prisma.deal.delete).not.toHaveBeenCalled();
        });
    });

    /* =============================================================
     * 6. Authorization & Permissions
     * ============================================================= */
    describe("Authorization & Permissions", () => {
        it("should return 401 when no token is provided", async () => {
            const res = await request(app).get(`${BASE}/deals`);
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it("should return 403 when user lacks deals:create permission", async () => {
            mockOrgAdmin({ role: "UNKNOWN_ROLE" });

            const res = await request(app)
                .post(`${BASE}/deals`)
                .set("Authorization", AUTH)
                .send({ title: "Unauthorized Deal" });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    /* =============================================================
     * 7. Prisma Error Propagation
     * ============================================================= */
    describe("Prisma error propagation", () => {
        it("should return 409 for duplicate-key Prisma error on create", async () => {
            prisma.customer.findFirst.mockResolvedValue({
                id: CUSTOMER_UUID,
                organizationId: VALID_UUID,
            });
            const p2002Error = new Error("Unique constraint");
            p2002Error.code = "P2002";
            prisma.deal.create.mockRejectedValue(p2002Error);

            const res = await request(app)
                .post(`${BASE}/deals`)
                .set("Authorization", AUTH)
                .send({ title: "Duplicate Deal", customerId: CUSTOMER_UUID });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it("should return 400 for foreign key violation on create", async () => {
            prisma.customer.findFirst.mockResolvedValue({
                id: CUSTOMER_UUID,
                organizationId: VALID_UUID,
            });
            const p2003Error = new Error("Foreign key constraint");
            p2003Error.code = "P2003";
            prisma.deal.create.mockRejectedValue(p2003Error);

            const res = await request(app)
                .post(`${BASE}/deals`)
                .set("Authorization", AUTH)
                .send({ title: "FK Error Deal", customerId: CUSTOMER_UUID });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
});
