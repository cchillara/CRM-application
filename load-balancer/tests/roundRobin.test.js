import { describe, it, expect, beforeEach } from "vitest";
import { RoundRobinSelector } from "../src/algorithms/roundRobin.js";

describe("Round Robin Selector", () => {
  let targets;
  let selector;

  beforeEach(() => {
    targets = [
      { id: "backend-1", port: 5001 },
      { id: "backend-2", port: 5002 },
      { id: "backend-3", port: 5003 },
    ];
    selector = new RoundRobinSelector(targets);
  });

  it("should sequentially distribute requests in round-robin order", () => {
    expect(selector.getNextTarget().id).toBe("backend-1");
    expect(selector.getNextTarget().id).toBe("backend-2");
    expect(selector.getNextTarget().id).toBe("backend-3");
    // Cycles back to first instance
    expect(selector.getNextTarget().id).toBe("backend-1");
    expect(selector.getNextTarget().id).toBe("backend-2");
    expect(selector.getNextTarget().id).toBe("backend-3");
  });

  it("should accurately track total requests per instance", () => {
    for (let i = 0; i < 9; i++) {
      selector.getNextTarget();
    }
    const all = selector.getAllTargets();
    expect(all[0].totalRequests).toBe(3);
    expect(all[1].totalRequests).toBe(3);
    expect(all[2].totalRequests).toBe(3);
  });

  it("should skip unhealthy instances automatically", () => {
    // Mark backend-2 unhealthy
    selector.setTargetHealth("backend-2", false);

    expect(selector.getNextTarget().id).toBe("backend-1");
    expect(selector.getNextTarget().id).toBe("backend-3");
    expect(selector.getNextTarget().id).toBe("backend-1");
    expect(selector.getNextTarget().id).toBe("backend-3");
  });

  it("should restore an instance when marked healthy again", () => {
    selector.setTargetHealth("backend-2", false);
    expect(selector.getNextTarget().id).toBe("backend-1");
    expect(selector.getNextTarget().id).toBe("backend-3");

    // Recover backend-2
    selector.setTargetHealth("backend-2", true);
    const selected = [
      selector.getNextTarget().id,
      selector.getNextTarget().id,
      selector.getNextTarget().id,
    ];
    expect(selected).toContain("backend-2");
  });

  it("should return null when all instances are unhealthy", () => {
    selector.setTargetHealth("backend-1", false);
    selector.setTargetHealth("backend-2", false);
    selector.setTargetHealth("backend-3", false);

    expect(selector.getNextTarget()).toBeNull();
  });

  it("should reset selection counters cleanly", () => {
    selector.getNextTarget();
    selector.getNextTarget();
    selector.reset();

    expect(selector.getNextTarget().id).toBe("backend-1");
  });
});

