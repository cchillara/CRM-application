import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("GET /health Endpoint", () => {
  it("should return 200 and healthy JSON payload", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("CRM backend is running");
    expect(res.body.requestId).toBeDefined();
  });

  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/v1/non-existent-route");

    expect(res.status).toBe(404);
  });
});