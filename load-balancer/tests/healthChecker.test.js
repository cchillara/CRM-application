import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { RoundRobinSelector } from "../src/algorithms/roundRobin.js";
import { HealthChecker } from "../src/health/healthChecker.js";

describe("HealthChecker", () => {
  let mockServer;
  let mockPort;
  let shouldFail = false;

  beforeAll(async () => {
    mockServer = http.createServer((req, res) => {
      if (req.url === "/health") {
        if (shouldFail) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ERROR" }));
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "OK", instanceId: "mock-backend" }));
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise((resolve) => {
      mockServer.listen(0, "127.0.0.1", () => {
        mockPort = mockServer.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => mockServer.close(resolve));
  });

  it("should mark target healthy when endpoint returns 200", async () => {
    shouldFail = false;
    const selector = new RoundRobinSelector([
      { id: "mock-1", port: mockPort, healthy: false },
    ]);

    const checker = new HealthChecker(selector, {
      path: "/health",
      unhealthyThreshold: 2,
      healthyThreshold: 1,
      timeoutMs: 1000,
    });

    await checker.checkTarget("mock-1");
    const target = selector.getTargetById("mock-1");
    expect(target.healthy).toBe(true);
    expect(target.lastStatus).toBe(200);
    expect(target.consecutiveSuccesses).toBe(1);
    expect(target.consecutiveFailures).toBe(0);
  });

  it("should mark target down after consecutive failures reach threshold", async () => {
    shouldFail = true;
    const selector = new RoundRobinSelector([
      { id: "mock-1", port: mockPort, healthy: true },
    ]);

    const checker = new HealthChecker(selector, {
      path: "/health",
      unhealthyThreshold: 2,
      healthyThreshold: 1,
      timeoutMs: 1000,
    });

    let downEmitted = false;
    checker.on("targetDown", (t) => {
      if (t.id === "mock-1") downEmitted = true;
    });

    // 1st failure - below threshold (2)
    await checker.checkTarget("mock-1");
    expect(selector.getTargetById("mock-1").healthy).toBe(true);

    // 2nd failure - reaches threshold (2)
    await checker.checkTarget("mock-1");
    expect(selector.getTargetById("mock-1").healthy).toBe(false);
    expect(downEmitted).toBe(true);
  });

  it("should restore target when recovery threshold is reached", async () => {
    shouldFail = false;
    const selector = new RoundRobinSelector([
      { id: "mock-1", port: mockPort, healthy: false },
    ]);

    const checker = new HealthChecker(selector, {
      path: "/health",
      unhealthyThreshold: 2,
      healthyThreshold: 1,
      timeoutMs: 1000,
    });

    let upEmitted = false;
    checker.on("targetUp", (t) => {
      if (t.id === "mock-1") upEmitted = true;
    });

    await checker.checkTarget("mock-1");
    expect(selector.getTargetById("mock-1").healthy).toBe(true);
    expect(upEmitted).toBe(true);
  });
});

