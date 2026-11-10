import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import http from "http";
import request from "../../backend/node_modules/supertest/index.js";
import { createLoadBalancer } from "../src/server.js";

describe("Load Balancer End-to-End Integration Tests", () => {
  let servers = [];
  let ports = [];
  let lbApp;
  let serverHits = { s1: 0, s2: 0, s3: 0 };

  beforeAll(async () => {
    // Start 3 independent test backend HTTP servers
    const createBackend = (id, hitKey) => {
      return new Promise((resolve) => {
        const s = http.createServer((req, res) => {
          serverHits[hitKey]++;

          if (req.url.startsWith("/health")) {
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ status: "OK", instanceId: id }));
          }

          if (req.url.startsWith("/api/echo")) {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk;
            });
            req.on("end", () => {
              res.writeHead(200, {
                "Content-Type": "application/json",
                "X-Handled-By": id,
                "X-Echo-Request-Id": req.headers["x-request-id"] || "",
              });
              res.end(
                JSON.stringify({
                  instanceId: id,
                  url: req.url,
                  method: req.method,
                  headers: req.headers,
                  body: body ? JSON.parse(body) : null,
                })
              );
            });
            return;
          }

          if (req.url === "/api/stream") {
            res.writeHead(200, {
              "Content-Type": "text/plain",
              "Transfer-Encoding": "chunked",
            });
            res.write("chunk-1;");
            setTimeout(() => {
              res.write("chunk-2;");
              res.end("chunk-3");
            }, 50);
            return;
          }

          if (req.url === "/api/slow") {
            // Intentionally don't respond to test timeout
            setTimeout(() => {
              if (!res.writableEnded) {
                res.writeHead(200);
                res.end("slow");
              }
            }, 2000);
            return;
          }

          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Not found" }));
        });

        s.listen(0, "127.0.0.1", () => {
          ports.push(s.address().port);
          servers.push(s);
          resolve(s);
        });
      });
    };

    await createBackend("backend-1", "s1");
    await createBackend("backend-2", "s2");
    await createBackend("backend-3", "s3");

    lbApp = createLoadBalancer({
      port: 0,
      backends: [
        { id: "backend-1", host: "127.0.0.1", port: ports[0] },
        { id: "backend-2", host: "127.0.0.1", port: ports[1] },
        { id: "backend-3", host: "127.0.0.1", port: ports[2] },
      ],
      healthCheck: {
        intervalMs: 100000, // Manual triggers for testing
        unhealthyThreshold: 1,
        healthyThreshold: 1,
      },
      proxy: {
        timeoutMs: 500, // Short timeout for test
      },
    });
  });

  afterAll(async () => {
    lbApp.healthChecker.stop();
    for (const s of servers) {
      await new Promise((r) => s.close(r));
    }
  });

  afterEach(() => {
    // Reset all backend targets to healthy
    lbApp.selector.setTargetHealth("backend-1", true);
    lbApp.selector.setTargetHealth("backend-2", true);
    lbApp.selector.setTargetHealth("backend-3", true);
  });

  it("1. should distribute sequential requests evenly across 3 instances via Round Robin", async () => {
    serverHits = { s1: 0, s2: 0, s3: 0 };
    lbApp.selector.reset();

    const res1 = await request(lbApp.server).get("/api/echo");
    const res2 = await request(lbApp.server).get("/api/echo");
    const res3 = await request(lbApp.server).get("/api/echo");
    const res4 = await request(lbApp.server).get("/api/echo");

    expect(res1.body.instanceId).toBe("backend-1");
    expect(res2.body.instanceId).toBe("backend-2");
    expect(res3.body.instanceId).toBe("backend-3");
    expect(res4.body.instanceId).toBe("backend-1");

    expect(serverHits.s1).toBe(2);
    expect(serverHits.s2).toBe(1);
    expect(serverHits.s3).toBe(1);
  });

  it("2. should preserve query parameters and path exactly", async () => {
    const res = await request(lbApp.server).get("/api/echo?page=2&limit=50&status=ACTIVE");
    expect(res.body.url).toBe("/api/echo?page=2&limit=50&status=ACTIVE");
  });

  it("3. should forward headers safely, set X-Forwarded-* and preserve Authorization", async () => {
    const customReqId = "12345678-1234-4abc-8abc-123456789012";
    const res = await request(lbApp.server)
      .get("/api/echo")
      .set("Authorization", "Bearer token-12345")
      .set("X-Request-ID", customReqId)
      .set("X-Custom-Client", "Shnoor-CRM-Web");

    expect(res.headers["x-request-id"]).toBe(customReqId);
    expect(res.body.headers["authorization"]).toBe("Bearer token-12345");
    expect(res.body.headers["x-custom-client"]).toBe("Shnoor-CRM-Web");
    expect(res.body.headers["x-forwarded-for"]).toBeDefined();
    expect(res.body.headers["x-forwarded-proto"]).toBe("http");
  });

  it("4. should forward POST request body without corruption", async () => {
    const payload = {
      name: "Acme Corp",
      email: "contact@acme.com",
      dealValue: 50000,
      tags: ["enterprise", "q4-priority"],
    };

    const res = await request(lbApp.server)
      .post("/api/echo")
      .send(payload)
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.body).toEqual(payload);
    expect(res.body.method).toBe("POST");
  });

  it("5. should stream chunked responses back to the client", async () => {
    const res = await request(lbApp.server).get("/api/stream");
    expect(res.status).toBe(200);
    expect(res.text).toBe("chunk-1;chunk-2;chunk-3");
  });

  it("6. should skip unhealthy instances automatically", async () => {
    lbApp.selector.reset();
    // Mark backend-2 unhealthy
    lbApp.selector.setTargetHealth("backend-2", false);

    const instancesVisited = [];
    for (let i = 0; i < 4; i++) {
      const res = await request(lbApp.server).get("/api/echo");
      instancesVisited.push(res.body.instanceId);
    }

    expect(instancesVisited).not.toContain("backend-2");
    expect(instancesVisited).toEqual([
      "backend-1",
      "backend-3",
      "backend-1",
      "backend-3",
    ]);
  });

  it("7. should return HTTP 503 when all backend instances are down", async () => {
    lbApp.selector.setTargetHealth("backend-1", false);
    lbApp.selector.setTargetHealth("backend-2", false);
    lbApp.selector.setTargetHealth("backend-3", false);

    const res = await request(lbApp.server).get("/api/echo");
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("No healthy backend instances available");
    expect(res.body.requestId).toBeDefined();
  });

  it("8. should handle upstream timeout with 504 Gateway Timeout", async () => {
    const res = await request(lbApp.server).get("/api/slow");
    expect(res.status).toBe(504);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Gateway Timeout|failed to respond/i);
  });

  it("9. should report status on /lb-status and /lb-health management endpoints", async () => {
    const statusRes = await request(lbApp.server).get("/lb-status");
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.algorithm).toBe("Round Robin");
    expect(statusRes.body.health.targets.length).toBe(3);

    const healthRes = await request(lbApp.server).get("/lb-health");
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe("HEALTHY");
    expect(healthRes.body.healthyInstances).toBe(3);
  });
});
