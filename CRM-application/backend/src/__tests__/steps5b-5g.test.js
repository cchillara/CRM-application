/**
 * Integration tests for Steps 5b – 5g.
 *
 * Coverage:
 *  5b  Tasks Controller — org isolation, CRUD, auth, cross-org, pagination
 *  5c  Teams Controller — Prisma-backed CRUD, org isolation, invalid members
 *  5d  Products Controller — CRUD, permissions, mass-assignment prevention
 *  5e  Employees Controller — org isolation, fake UID removed, invalid roles
 *  5f  Profile & Settings — phone behavior, settings mass-assignment prevention
 *  5g  SuperAdmin — invalid "ADMIN" role fix, valid enum values
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../firebase-admin.js", () => ({
    auth: { verifyIdToken: vi.fn() },
}));

vi.mock("../db/index.js", () => ({
    default: {
        user: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), update: vi.fn(), create: vi.fn(), delete: vi.fn() },
        superAdmin: { findUnique: vi.fn() },
        organization: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
        lead: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        deal: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
        task: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        team: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        teamMembership: { deleteMany: vi.fn(), create: vi.fn(), findMany: vi.fn() },
        customer: { findFirst: vi.fn() },
        $queryRaw: vi.fn(),
    },
}));

const { default: app } = await import("../app.js");
const { auth } = await import("../firebase-admin.js");
const { default: prisma } = await import("../db/index.js");

const VALID_UUID     = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG_UUID = "22222222-2222-4222-8222-222222222222";
const TASK_UUID      = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TEAM_UUID      = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER_UUID      = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const EMP_UUID       = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const SA_ORG_UUID    = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const SA_USER_UUID   = "ffffffff-ffff-4fff-8fff-ffffffffffff";

const BASE    = "/api/v1/client-admin";
const SA_BASE = "/api/v1/super-admin";
const AUTH    = "Bearer valid-token";
const SA_AUTH = "Bearer super-valid-token";

const makeCrmUser = (overrides = {}) => ({
    id: USER_UUID, firebaseUid: "firebase-uid-test", email: "admin@example.com",
    firstName: "Test", lastName: "Admin", role: "ORGANIZATION_ADMIN", status: "ACTIVE",
    organizationId: VALID_UUID, organization: { id: VALID_UUID, status: "ACTIVE" },
    ...overrides,
});

function mockOrgAdmin(overrides = {}) {
    auth.verifyIdToken.mockResolvedValue({ uid: "firebase-uid-test", email: "admin@example.com" });
    prisma.user.findUnique.mockResolvedValue(makeCrmUser(overrides));
}

function mockSuperAdmin() {
    auth.verifyIdToken.mockResolvedValue({ uid: "sa-firebase-uid", email: "sa@example.com" });
    prisma.superAdmin.findUnique.mockResolvedValue({ id: "super-admin-id", firebaseUid: "sa-firebase-uid" });
}

const makeTaskRecord = (o = {}) => ({
    id: TASK_UUID, title: "Follow up", description: JSON.stringify({ client: "Globex", assignedTo: "Test Admin", due: "Upcoming", priority: "High" }),
    status: "TODO", dueDate: null, organizationId: VALID_UUID, assignedToId: USER_UUID,
    leadId: null, customerId: null, dealId: null, createdAt: new Date(), updatedAt: new Date(),
    assignedTo: { id: USER_UUID, firstName: "Test", lastName: "Admin", email: "admin@example.com" }, lead: null, ...o,
});

const makeTeamRecord = (o = {}) => ({
    id: TEAM_UUID, name: "Alpha Squad", organizationId: VALID_UUID,
    createdAt: new Date(), updatedAt: new Date(), members: [], _count: { members: 0 }, ...o,
});

// ──────────────────────────────────────────
// 5b Tasks
// ──────────────────────────────────────────
describe("Tasks Controller — clientAdmin", () => {
    beforeEach(() => { vi.clearAllMocks(); mockOrgAdmin(); });

    it("GET /tasks — returns paginated tasks scoped to org", async () => {
        prisma.task.findMany.mockResolvedValue([makeTaskRecord()]);
        prisma.task.count.mockResolvedValue(1);
        const res = await request(app).get(`${BASE}/tasks`).set("Authorization", AUTH);
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(1);
        expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: VALID_UUID }) }));
    });

    it("GET /tasks — filters by status query param", async () => {
        prisma.task.findMany.mockResolvedValue([]);
        prisma.task.count.mockResolvedValue(0);
        await request(app).get(`${BASE}/tasks?status=TODO`).set("Authorization", AUTH);
        expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: VALID_UUID, status: "TODO" }) }));
    });

    it("GET /tasks — returns 401 with no token", async () => {
        const res = await request(app).get(`${BASE}/tasks`);
        expect(res.status).toBe(401);
    });

    it("POST /tasks — creates task with org from context (not body)", async () => {
        prisma.task.create.mockResolvedValue(makeTaskRecord());
        const res = await request(app).post(`${BASE}/tasks`).set("Authorization", AUTH).send({ title: "Follow up" });
        expect(res.status).toBe(201);
        expect(prisma.task.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId: VALID_UUID }) }));
    });

    it("POST /tasks — returns 400 when title missing", async () => {
        const res = await request(app).post(`${BASE}/tasks`).set("Authorization", AUTH).send({});
        expect(res.status).toBe(400);
    });

    it("POST /tasks — returns 400 when assignedToId cross-org", async () => {
        prisma.user.findFirst.mockResolvedValue(null);
        const res = await request(app).post(`${BASE}/tasks`).set("Authorization", AUTH).send({ title: "T", assignedToId: OTHER_ORG_UUID });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/assigned user not found in your organisation/i);
    });

    it("PATCH /tasks/:id — verifies org ownership before updating", async () => {
        prisma.task.findFirst.mockResolvedValue(makeTaskRecord());
        prisma.task.update.mockResolvedValue(makeTaskRecord({ title: "Updated" }));
        const res = await request(app).patch(`${BASE}/tasks/${TASK_UUID}`).set("Authorization", AUTH).send({ title: "Updated" });
        expect(res.status).toBe(200);
        expect(prisma.task.findFirst).toHaveBeenCalledWith({ where: { id: TASK_UUID, organizationId: VALID_UUID } });
    });

    it("PATCH /tasks/:id — returns 404 for cross-org task", async () => {
        prisma.task.findFirst.mockResolvedValue(null);
        const res = await request(app).patch(`${BASE}/tasks/${TASK_UUID}`).set("Authorization", AUTH).send({ title: "X" });
        expect(res.status).toBe(404);
        expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it("PATCH /tasks/:id — returns 400 for non-UUID id", async () => {
        const res = await request(app).patch(`${BASE}/tasks/not-a-uuid`).set("Authorization", AUTH).send({ title: "X" });
        expect(res.status).toBe(400);
    });

    it("DELETE /tasks/:id — verifies org ownership before deleting", async () => {
        prisma.task.findFirst.mockResolvedValue(makeTaskRecord());
        prisma.task.delete.mockResolvedValue(makeTaskRecord());
        const res = await request(app).delete(`${BASE}/tasks/${TASK_UUID}`).set("Authorization", AUTH);
        expect(res.status).toBe(200);
        expect(prisma.task.findFirst).toHaveBeenCalledWith({ where: { id: TASK_UUID, organizationId: VALID_UUID } });
        expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: TASK_UUID } });
    });

    it("DELETE /tasks/:id — returns 404 for cross-org task", async () => {
        prisma.task.findFirst.mockResolvedValue(null);
        const res = await request(app).delete(`${BASE}/tasks/${TASK_UUID}`).set("Authorization", AUTH);
        expect(res.status).toBe(404);
        expect(prisma.task.delete).not.toHaveBeenCalled();
    });

    it("DELETE /tasks/:id — returns 403 when no permission", async () => {
        mockOrgAdmin({ role: "UNKNOWN_ROLE" });
        const res = await request(app).delete(`${BASE}/tasks/${TASK_UUID}`).set("Authorization", AUTH);
        expect(res.status).toBe(403);
    });
});

// ──────────────────────────────────────────
// 5c Teams (Prisma-backed)
// ──────────────────────────────────────────
describe("Teams Controller — Prisma-backed", () => {
    beforeEach(() => { vi.clearAllMocks(); mockOrgAdmin(); });

    it("GET /team — returns teams scoped to org", async () => {
        prisma.team.findMany.mockResolvedValue([makeTeamRecord()]);
        prisma.team.count.mockResolvedValue(1);
        const res = await request(app).get(`${BASE}/team`).set("Authorization", AUTH);
        expect(res.status).toBe(200);
        expect(prisma.team.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: VALID_UUID } }));
    });

    it("GET /team — returns 401 with no token", async () => {
        const res = await request(app).get(`${BASE}/team`);
        expect(res.status).toBe(401);
    });

    it("POST /team — creates team scoped to org", async () => {
        prisma.team.create.mockResolvedValue(makeTeamRecord());
        const res = await request(app).post(`${BASE}/team`).set("Authorization", AUTH).send({ name: "Alpha Squad" });
        expect(res.status).toBe(201);
        expect(prisma.team.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: "Alpha Squad", organizationId: VALID_UUID }) }));
    });

    it("POST /team — returns 400 when name missing", async () => {
        const res = await request(app).post(`${BASE}/team`).set("Authorization", AUTH).send({});
        expect(res.status).toBe(400);
    });

    it("POST /team — returns 400 when memberIds contains cross-org user", async () => {
        prisma.user.findMany.mockResolvedValue([]);
        const res = await request(app).post(`${BASE}/team`).set("Authorization", AUTH).send({ name: "Rogue", memberIds: [OTHER_ORG_UUID] });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/not valid users in your organisation/i);
        expect(prisma.team.create).not.toHaveBeenCalled();
    });

    it("POST /team — returns 403 when user lacks teams:create permission", async () => {
        mockOrgAdmin({ role: "UNKNOWN_ROLE" });
        const res = await request(app).post(`${BASE}/team`).set("Authorization", AUTH).send({ name: "Test" });
        expect(res.status).toBe(403);
    });

    it("PATCH /team/:id — verifies org ownership before update", async () => {
        prisma.team.findFirst.mockResolvedValue(makeTeamRecord());
        prisma.team.update.mockResolvedValue(makeTeamRecord({ name: "Beta Squad" }));
        const res = await request(app).patch(`${BASE}/team/${TEAM_UUID}`).set("Authorization", AUTH).send({ name: "Beta Squad" });
        expect(res.status).toBe(200);
        expect(prisma.team.findFirst).toHaveBeenCalledWith({ where: { id: TEAM_UUID, organizationId: VALID_UUID } });
    });

    it("PATCH /team/:id — returns 404 for cross-org team", async () => {
        prisma.team.findFirst.mockResolvedValue(null);
        const res = await request(app).patch(`${BASE}/team/${TEAM_UUID}`).set("Authorization", AUTH).send({ name: "X" });
        expect(res.status).toBe(404);
        expect(prisma.team.update).not.toHaveBeenCalled();
    });

    it("DELETE /team/:id — verifies org ownership before delete", async () => {
        prisma.team.findFirst.mockResolvedValue(makeTeamRecord());
        prisma.team.delete.mockResolvedValue(makeTeamRecord());
        const res = await request(app).delete(`${BASE}/team/${TEAM_UUID}`).set("Authorization", AUTH);
        expect(res.status).toBe(200);
        expect(prisma.team.delete).toHaveBeenCalledWith({ where: { id: TEAM_UUID } });
    });

    it("DELETE /team/:id — returns 404 for cross-org team", async () => {
        prisma.team.findFirst.mockResolvedValue(null);
        const res = await request(app).delete(`${BASE}/team/${TEAM_UUID}`).set("Authorization", AUTH);
        expect(res.status).toBe(404);
        expect(prisma.team.delete).not.toHaveBeenCalled();
    });
});

// ──────────────────────────────────────────
// 5d Products
// ──────────────────────────────────────────
describe("Products Controller", () => {
    beforeEach(() => { vi.clearAllMocks(); mockOrgAdmin(); });

    it("GET /products — returns product list", async () => {
        const res = await request(app).get(`${BASE}/products`).set("Authorization", AUTH);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("GET /products — returns 401 with no token", async () => {
        const res = await request(app).get(`${BASE}/products`);
        expect(res.status).toBe(401);
    });

    it("POST /products — creates product with permitted fields", async () => {
        const res = await request(app).post(`${BASE}/products`).set("Authorization", AUTH)
            .send({ name: "Test Product", category: "Software", price: "100", billing: "Monthly", inventory: "10", status: "Active" });
        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe("Test Product");
    });

    it("POST /products — returns 400 when name missing", async () => {
        const res = await request(app).post(`${BASE}/products`).set("Authorization", AUTH).send({ category: "Software" });
        expect(res.status).toBe(400);
    });

    it("POST /products — returns 400 for unsupported fields (mass-assignment prevention)", async () => {
        const res = await request(app).post(`${BASE}/products`).set("Authorization", AUTH)
            .send({ name: "Test", adminOverride: true });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/unsupported fields/i);
    });

    it("POST /products — returns 403 when user lacks products:create permission", async () => {
        mockOrgAdmin({ role: "UNKNOWN_ROLE" });
        const res = await request(app).post(`${BASE}/products`).set("Authorization", AUTH).send({ name: "Bad Product" });
        expect(res.status).toBe(403);
    });
});

// ──────────────────────────────────────────
// 5e Employees
// ──────────────────────────────────────────
describe("Employees Controller — clientAdmin", () => {
    beforeEach(() => { vi.clearAllMocks(); mockOrgAdmin(); });

    it("GET /employee — returns employees scoped to org", async () => {
        prisma.user.findMany.mockResolvedValue([]);
        prisma.user.count.mockResolvedValue(0);
        const res = await request(app).get(`${BASE}/employee`).set("Authorization", AUTH);
        expect(res.status).toBe(200);
        expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: VALID_UUID } }));
    });

    it("POST /employee — stores placeholder UID with 'invite-' prefix (not 'emp-')", async () => {
        prisma.user.findUnique.mockResolvedValueOnce(makeCrmUser()).mockResolvedValueOnce(null);
        prisma.user.create.mockResolvedValue({ id: EMP_UUID, email: "new@example.com", firstName: "New", lastName: "Staff", role: "SALES", status: "INVITED", createdAt: new Date() });
        await request(app).post(`${BASE}/employee`).set("Authorization", AUTH).send({ email: "new@example.com" });
        const createCall = prisma.user.create.mock.calls[0][0];
        expect(createCall.data.firebaseUid).toMatch(/^invite-/);
        expect(createCall.data.firebaseUid).not.toMatch(/^emp-/);
    });

    it("POST /employee — uses org from req.organizationId (not body)", async () => {
        prisma.user.findUnique.mockResolvedValueOnce(makeCrmUser()).mockResolvedValueOnce(null);
        prisma.user.create.mockResolvedValue({ id: EMP_UUID, email: "emp@example.com", firstName: "E", lastName: "M", role: "SALES", status: "INVITED", createdAt: new Date() });
        await request(app).post(`${BASE}/employee`).set("Authorization", AUTH)
            .send({ email: "emp@example.com", organizationId: OTHER_ORG_UUID });
        const createCall = prisma.user.create.mock.calls[0][0];
        expect(createCall.data.organizationId).toBe(VALID_UUID);
        expect(createCall.data.organizationId).not.toBe(OTHER_ORG_UUID);
    });

    it("POST /employee — returns 400 when email is missing", async () => {
        const res = await request(app).post(`${BASE}/employee`).set("Authorization", AUTH).send({ firstName: "No Email" });
        expect(res.status).toBe(400);
    });

    it("POST /employee — returns 409 when email already exists", async () => {
        prisma.user.findUnique.mockResolvedValueOnce(makeCrmUser()).mockResolvedValueOnce({ id: "existing" });
        const res = await request(app).post(`${BASE}/employee`).set("Authorization", AUTH).send({ email: "dup@example.com" });
        expect(res.status).toBe(409);
    });

    it("PATCH /employee/:id — enforces org isolation (findFirst with organizationId)", async () => {
        prisma.user.findFirst.mockResolvedValue(null);
        const res = await request(app).patch(`${BASE}/employee/${EMP_UUID}`).set("Authorization", AUTH).send({ firstName: "Cross" });
        expect(res.status).toBe(404);
        expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { id: EMP_UUID, organizationId: VALID_UUID } });
    });

    it("DELETE /employee/:id — enforces org isolation before delete", async () => {
        prisma.user.findFirst.mockResolvedValue(null);
        const res = await request(app).delete(`${BASE}/employee/${EMP_UUID}`).set("Authorization", AUTH);
        expect(res.status).toBe(404);
        expect(prisma.user.delete).not.toHaveBeenCalled();
        expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { id: EMP_UUID, organizationId: VALID_UUID } });
    });
});

// ──────────────────────────────────────────
// 5f Profile & Settings
// ──────────────────────────────────────────
describe("Profile and Settings — clientAdmin", () => {
    beforeEach(() => { vi.clearAllMocks(); mockOrgAdmin(); });

    it("PATCH /profile — does not persist phone field to Prisma", async () => {
        prisma.user.update.mockResolvedValue({ id: USER_UUID, email: "admin@example.com", firstName: "Up", lastName: "Admin", role: "ORGANIZATION_ADMIN", organizationId: VALID_UUID });
        const res = await request(app).patch(`${BASE}/profile`).set("Authorization", AUTH)
            .send({ firstName: "Up", phone: "+91 99999 99999" });
        expect(res.status).toBe(200);
        const updateCall = prisma.user.update.mock.calls[0][0];
        expect(updateCall.data).not.toHaveProperty("phone");
    });

    it("PATCH /profile — returns 401 without auth", async () => {
        const res = await request(app).patch(`${BASE}/profile`).send({ firstName: "X" });
        expect(res.status).toBe(401);
    });

    it("PATCH /settings — updates permitted settings fields", async () => {
        prisma.organization.update.mockResolvedValue({});
        const res = await request(app).patch(`${BASE}/settings`).set("Authorization", AUTH).send({ platformName: "New CRM" });
        expect(res.status).toBe(200);
    });

    it("PATCH /settings — returns 400 when only prohibited fields are sent", async () => {
        const res = await request(app).patch(`${BASE}/settings`).set("Authorization", AUTH)
            .send({ organizationId: OTHER_ORG_UUID, role: "ORGANIZATION_ADMIN" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/no valid settings fields/i);
    });

    it("PATCH /settings — returns 401 without auth", async () => {
        const res = await request(app).patch(`${BASE}/settings`).send({ platformName: "Hacker" });
        expect(res.status).toBe(401);
    });
});

// ──────────────────────────────────────────
// 5g SuperAdmin
// ──────────────────────────────────────────
describe("SuperAdmin — assignUserOrganization", () => {
    beforeEach(() => { vi.clearAllMocks(); mockSuperAdmin(); });

    it("should accept MANAGER role (valid enum)", async () => {
        prisma.user.findUnique.mockResolvedValue({ id: SA_USER_UUID, role: "SALES", organizationId: null });
        prisma.organization.findUnique.mockResolvedValue({ id: SA_ORG_UUID });
        prisma.user.update.mockResolvedValue({ id: SA_USER_UUID, role: "MANAGER", organizationId: SA_ORG_UUID });
        const res = await request(app).patch(`${SA_BASE}/users/${SA_USER_UUID}/assign`).set("Authorization", SA_AUTH).send({ organizationId: SA_ORG_UUID, role: "MANAGER" });
        expect(res.status).toBe(200);
    });

    it("should accept ORGANIZATION_ADMIN role (valid enum, the gap in old code)", async () => {
        prisma.user.findUnique.mockResolvedValue({ id: SA_USER_UUID, role: "SALES", organizationId: null });
        prisma.organization.findUnique.mockResolvedValue({ id: SA_ORG_UUID });
        prisma.user.update.mockResolvedValue({ id: SA_USER_UUID, role: "ORGANIZATION_ADMIN", organizationId: SA_ORG_UUID });
        const res = await request(app).patch(`${SA_BASE}/users/${SA_USER_UUID}/assign`).set("Authorization", SA_AUTH).send({ organizationId: SA_ORG_UUID, role: "ORGANIZATION_ADMIN" });
        expect(res.status).toBe(200);
    });

    it("should return 400 for the invalid ADMIN role (the original bug)", async () => {
        prisma.user.findUnique.mockResolvedValue({ id: SA_USER_UUID, role: "SALES", organizationId: null });
        const res = await request(app).patch(`${SA_BASE}/users/${SA_USER_UUID}/assign`).set("Authorization", SA_AUTH).send({ role: "ADMIN" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid role/i);
    });

    it("should return 400 for SUPER_ADMIN role (not valid for this endpoint)", async () => {
        prisma.user.findUnique.mockResolvedValue({ id: SA_USER_UUID, role: "SALES", organizationId: null });
        const res = await request(app).patch(`${SA_BASE}/users/${SA_USER_UUID}/assign`).set("Authorization", SA_AUTH).send({ role: "SUPER_ADMIN" });
        expect(res.status).toBe(400);
    });

    it("should return 404 when user does not exist", async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        const res = await request(app).patch(`${SA_BASE}/users/${SA_USER_UUID}/assign`).set("Authorization", SA_AUTH).send({ role: "SALES" });
        expect(res.status).toBe(404);
    });

    it("should return 404 when organization does not exist", async () => {
        prisma.user.findUnique.mockResolvedValue({ id: SA_USER_UUID, role: "SALES", organizationId: null });
        prisma.organization.findUnique.mockResolvedValue(null);
        const res = await request(app).patch(`${SA_BASE}/users/${SA_USER_UUID}/assign`).set("Authorization", SA_AUTH).send({ organizationId: SA_ORG_UUID });
        expect(res.status).toBe(404);
    });

    it("should return 400 for non-UUID id param", async () => {
        const res = await request(app).patch(`${SA_BASE}/users/not-a-uuid/assign`).set("Authorization", SA_AUTH).send({ role: "SALES" });
        expect(res.status).toBe(400);
    });

    it("should return 400 when neither organizationId nor role supplied", async () => {
        const res = await request(app).patch(`${SA_BASE}/users/${SA_USER_UUID}/assign`).set("Authorization", SA_AUTH).send({});
        expect(res.status).toBe(400);
    });

    it("should return 403 when not authenticated as SuperAdmin", async () => {
        auth.verifyIdToken.mockResolvedValue({ uid: "firebase-uid-test" });
        prisma.superAdmin.findUnique.mockResolvedValue(null);
        const res = await request(app).patch(`${SA_BASE}/users/${SA_USER_UUID}/assign`).set("Authorization", AUTH).send({ role: "SALES" });
        expect(res.status).toBe(403);
    });
});
