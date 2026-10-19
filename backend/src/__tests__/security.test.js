/**
 * Integration tests for SHNOOR CRM security middleware.
 *
 * These tests exercise the real Express app (app.js) via supertest.
 * Firebase authentication and Prisma DB calls are mocked so the
 * test suite runs offline without a live database or Firebase project.
 *
 * Coverage:
 *   1. Security headers (Helmet)
 *   2. X-Powered-By removal
 *   3. Request ID header round-trip
 *   4. HTTP logging (smoke - no crash)
 *   5. CORS enforcement
 *   6. Rate limiting on auth routes
 *   7. Auth middleware (missing token, invalid token)
 *   8. Input validation on POST /api/v1/auth/register
 *   9. Product RBAC (requirePermission guard)
 *  10. Super Admin route validation (UUID param, required body)
 *  11. Health endpoint
 *  12. 404 catch-all
 */

import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";

/* ---------------------------------------------------------------
 * Mock heavy external dependencies BEFORE importing app.js so
 * that module-level side effects (DB connect, Firebase init) are
 * replaced with stubs.
 * ---------------------------------------------------------------*/

// -- Firebase Admin --------------------------------------------
vi.mock("../firebase-admin.js", () => ({
    auth: {
        verifyIdToken: vi.fn(),
    },
}));

// -- Prisma client ---------------------------------------------
vi.mock("../db/index.js", () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
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
        lead: { findMany: vi.fn(), count: vi.fn() },
        deal: { findMany: vi.fn(), count: vi.fn() },
        task: { findMany: vi.fn(), count: vi.fn() },
        $queryRaw: vi.fn(),
    },
}));

// -- Import app AFTER mocks are in place -----------------------
const { default: app } = await import("../app.js");
const { auth } = await import("../firebase-admin.js");
const { default: prisma } = await import("../db/index.js");

/* -- Helper: build a decoded Firebase user stub --------------- */
const makeFirebaseUser = (overrides = {}) => ({
    uid: "firebase-uid-test",
    email: "test@example.com",
    ...overrides,
});

/* -- Helper: build a CRM user stub ---------------------------- */
const makeCrmUser = (overrides = {}) => ({
    id: "user-uuid-0001",
    firebaseUid: "firebase-uid-test",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "ORGANIZATION_ADMIN",
    status: "ACTIVE",
    organizationId: "org-uuid-0001",
    organization: { id: "org-uuid-0001", status: "ACTIVE" },
    ...overrides,
});

/* Helper: set up auth mocks for an authenticated ORGANIZATION_ADMIN */
function mockOrgAdmin(overrides = {}) {
    auth.verifyIdToken.mockResolvedValue(makeFirebaseUser());
    prisma.user.findUnique.mockResolvedValue(makeCrmUser(overrides));
}

/* Helper: set up auth mocks for an authenticated MANAGER role */
function mockManager() {
    auth.verifyIdToken.mockResolvedValue(makeFirebaseUser());
    prisma.user.findUnique.mockResolvedValue(makeCrmUser({ role: "MANAGER" }));
}

/* Helper: set up auth mocks for an authenticated SALES role */
function mockSales() {
    auth.verifyIdToken.mockResolvedValue(makeFirebaseUser());
    prisma.user.findUnique.mockResolvedValue(makeCrmUser({ role: "SALES" }));
}

/* ================================================================
 * 1. Security Headers (Helmet)
 * ================================================================*/
describe("Security headers", () => {
    it("should set X-Content-Type-Options: nosniff", async () => {
        const res = await request(app).get("/health");
        expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("should set X-Frame-Options to deny or sameorigin", async () => {
        const res = await request(app).get("/health");
        const header = res.headers["x-frame-options"];
        expect(header).toBeDefined();
        expect(["DENY", "SAMEORIGIN"]).toContain(header.toUpperCase());
    });

    it("should NOT include X-Powered-By", async () => {
        const res = await request(app).get("/health");
        expect(res.headers["x-powered-by"]).toBeUndefined();
    });
});

/* ================================================================
 * 2. Request ID
 * ================================================================*/
describe("Request ID middleware", () => {
    it("should echo X-Request-ID in response headers", async () => {
        const res = await request(app).get("/health");
        expect(res.headers["x-request-id"]).toBeDefined();
        expect(res.headers["x-request-id"]).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
    });

    it("should pass through a valid incoming X-Request-ID", async () => {
        const clientId = "12345678-1234-4abc-8abc-123456789012";
        const res = await request(app)
            .get("/health")
            .set("X-Request-ID", clientId);
        expect(res.headers["x-request-id"]).toBe(clientId);
    });

    it("should ignore a non-UUID X-Request-ID and generate a fresh one", async () => {
        const res = await request(app)
            .get("/health")
            .set("X-Request-ID", "not-a-uuid");
        expect(res.headers["x-request-id"]).not.toBe("not-a-uuid");
        expect(res.headers["x-request-id"]).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
    });

    it("should include requestId in error responses", async () => {
        const res = await request(app).get("/api/v1/auth/does-not-exist");
        expect(res.body.requestId).toBeDefined();
    });
});

/* ================================================================
 * 3. Health endpoint
 * ================================================================*/
describe("GET /health", () => {
    it("should return 200 with success:true and requestId", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.requestId).toBeDefined();
    });
});

/* ================================================================
 * 4. 404 catch-all
 * ================================================================*/
describe("404 catch-all", () => {
    it("should return 404 for unknown routes", async () => {
        const res = await request(app).get("/api/v1/unknown");
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});

/* ================================================================
 * 5. CORS enforcement
 * ================================================================*/
describe("CORS enforcement", () => {
    it("should allow an allowed origin and return Access-Control-Allow-Origin", async () => {
        const res = await request(app)
            .get("/health")
            .set("Origin", "http://localhost:3000");
        expect(res.headers["access-control-allow-origin"]).toBe(
            "http://localhost:3000"
        );
    });

    it("should reject a disallowed origin with 403", async () => {
        const res = await request(app)
            .get("/health")
            .set("Origin", "http://evil.example.com");
        expect(res.status).toBe(403);
    });

    it("should allow requests with no Origin header (server-to-server)", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
    });

    it("should respond to OPTIONS preflight correctly", async () => {
        const res = await request(app)
            .options("/api/v1/auth/register")
            .set("Origin", "http://localhost:3000")
            .set("Access-Control-Request-Method", "POST");
        // CORS preflight returns 204 or 200
        expect([200, 204]).toContain(res.status);
        expect(res.headers["access-control-allow-origin"]).toBe(
            "http://localhost:3000"
        );
    });
});

/* ================================================================
 * 6. Authentication middleware
 * ================================================================*/
describe("Authentication middleware", () => {
    it("should return 401 when no Authorization header is sent", async () => {
        const res = await request(app).post("/api/v1/auth/register").send({
            firstName: "Test",
        });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it("should return 401 with a malformed Authorization header", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .set("Authorization", "InvalidScheme token123")
            .send({ firstName: "Test" });
        expect(res.status).toBe(401);
    });

    it("should return 401 when Firebase rejects the token", async () => {
        auth.verifyIdToken.mockRejectedValue({ code: "auth/invalid-id-token" });
        const res = await request(app)
            .post("/api/v1/auth/register")
            .set("Authorization", "Bearer bad-token")
            .send({ firstName: "Test" });
        expect(res.status).toBe(401);
    });

    it("should return 401 when Firebase token is expired", async () => {
        auth.verifyIdToken.mockRejectedValue({ code: "auth/id-token-expired" });
        const res = await request(app)
            .post("/api/v1/auth/register")
            .set("Authorization", "Bearer expired-token")
            .send({ firstName: "Test" });
        expect(res.status).toBe(401);
    });
});

/* ================================================================
 * 7. Auth route input validation � POST /api/v1/auth/register
 * ================================================================*/
describe("Auth route input validation (POST /register)", () => {
    it("should return 400 when firstName is missing from body", async () => {
        auth.verifyIdToken.mockResolvedValue(makeFirebaseUser());
        const res = await request(app)
            .post("/api/v1/auth/register")
            .set("Authorization", "Bearer valid-token")
            .send({ lastName: "Smith" }); // no firstName
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("should return 400 when an unsupported field is sent", async () => {
        auth.verifyIdToken.mockResolvedValue(makeFirebaseUser());
        const res = await request(app)
            .post("/api/v1/auth/register")
            .set("Authorization", "Bearer valid-token")
            .send({ firstName: "Test", role: "SUPER_ADMIN" }); // role not allowed
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("should pass validation with firstName only", async () => {
        auth.verifyIdToken.mockResolvedValue(makeFirebaseUser());
        // Simulate user not existing yet so create path runs
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue(
            makeCrmUser({ organizationId: null, organization: null })
        );
        const res = await request(app)
            .post("/api/v1/auth/register")
            .set("Authorization", "Bearer valid-token")
            .send({ firstName: "Alice" });
        // Controller may succeed or fail for other reasons (email missing etc.)
        // What matters here is that validation did NOT reject the request.
        expect(res.status).not.toBe(400);
    });
});

/* ================================================================
 * 8. Rate limiting � auth routes
 * ================================================================*/
describe("Rate limiting on auth routes", () => {
    it("should include RateLimit headers on auth endpoints", async () => {
        const res = await request(app)
            .post("/api/v1/auth/register")
            .set("Authorization", "Bearer x")
            .send({ firstName: "T" });
        // The RateLimit-Policy header (or RateLimit-Limit) should be present
        const hasRateLimitHeader =
            res.headers["ratelimit-limit"] !== undefined ||
            res.headers["ratelimit-policy"] !== undefined;
        expect(hasRateLimitHeader).toBe(true);
    });
});

/* ================================================================
 * 9. Product RBAC
 * ================================================================*/
describe("Product RBAC (requirePermission)", () => {
    it("ORGANIZATION_ADMIN should access GET /products (200)", async () => {
        mockOrgAdmin();
        const res = await request(app)
            .get("/api/v1/client-admin/products")
            .set("Authorization", "Bearer valid-token");
        expect(res.status).toBe(200);
    });

    it("MANAGER cannot access Client Admin router (403 - requireClientAdmin blocks non-ORGANIZATION_ADMIN)", async () => {
        mockManager();
        const res = await request(app)
            .get("/api/v1/client-admin/products")
            .set("Authorization", "Bearer valid-token");
        expect(res.status).toBe(403);
    });

    it("SALES cannot access Client Admin router (403 - requireClientAdmin blocks non-ORGANIZATION_ADMIN)", async () => {
        mockSales();
        const res = await request(app)
            .get("/api/v1/client-admin/products")
            .set("Authorization", "Bearer valid-token");
        expect(res.status).toBe(403);
    });

    it("MANAGER should NOT create a product (403)", async () => {
        mockManager();
        const res = await request(app)
            .post("/api/v1/client-admin/products")
            .set("Authorization", "Bearer valid-token")
            .send({ name: "Unauthorized Product" });
        expect(res.status).toBe(403);
    });

    it("SALES should NOT create a product (403)", async () => {
        mockSales();
        const res = await request(app)
            .post("/api/v1/client-admin/products")
            .set("Authorization", "Bearer valid-token")
            .send({ name: "Unauthorized Product" });
        expect(res.status).toBe(403);
    });

    it("ORGANIZATION_ADMIN should create a product with valid body (201)", async () => {
        mockOrgAdmin();
        const res = await request(app)
            .post("/api/v1/client-admin/products")
            .set("Authorization", "Bearer valid-token")
            .send({ name: "New Product", category: "SaaS" });
        expect(res.status).toBe(201);
    });

    it("should return 400 when name is missing from POST /products", async () => {
        mockOrgAdmin();
        const res = await request(app)
            .post("/api/v1/client-admin/products")
            .set("Authorization", "Bearer valid-token")
            .send({ category: "SaaS" }); // no name
        expect(res.status).toBe(400);
    });
});

/* ================================================================
 * 10. Super Admin route validation
 * ================================================================*/
describe("Super Admin input validation", () => {
    beforeAll(() => {
        // Mock a Super Admin user in the superAdmin table.
        auth.verifyIdToken.mockResolvedValue(makeFirebaseUser());
        prisma.superAdmin.findUnique.mockResolvedValue({
            id: "sa-001",
            firebaseUid: "firebase-uid-test",
            email: "superadmin@shnoor.com",
        });
        prisma.organization.findMany.mockResolvedValue([]);
        prisma.user.findMany.mockResolvedValue([]);
    });

    it("should return 400 when name is missing from POST /organizations", async () => {
        const res = await request(app)
            .post("/api/v1/super-admin/organizations")
            .set("Authorization", "Bearer valid-token")
            .send({ email: "org@example.com" }); // missing name
        expect(res.status).toBe(400);
    });

    it("should return 400 when an unsupported field is sent to POST /organizations", async () => {
        const res = await request(app)
            .post("/api/v1/super-admin/organizations")
            .set("Authorization", "Bearer valid-token")
            .send({ name: "Org", hacky: "field" });
        expect(res.status).toBe(400);
    });

    it("should return 400 for non-UUID :id on GET /organizations/:id", async () => {
        const res = await request(app)
            .get("/api/v1/super-admin/organizations/not-a-uuid")
            .set("Authorization", "Bearer valid-token");
        expect(res.status).toBe(400);
    });

    it("should return 400 when neither organizationId nor role supplied to PATCH /users/:id/assign", async () => {
        const validId = "12345678-1234-4abc-8abc-123456789abc";
        const res = await request(app)
            .patch(`/api/v1/super-admin/users/${validId}/assign`)
            .set("Authorization", "Bearer valid-token")
            .send({}); // empty body
        expect(res.status).toBe(400);
    });

    it("should return 400 for non-UUID :id on PATCH /users/:id/assign", async () => {
        const res = await request(app)
            .patch("/api/v1/super-admin/users/bad-id/assign")
            .set("Authorization", "Bearer valid-token")
            .send({ role: "MANAGER" });
        expect(res.status).toBe(400);
    });
});
