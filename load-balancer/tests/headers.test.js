import { describe, it, expect } from "vitest";
import {
  buildUpstreamHeaders,
  filterDownstreamHeaders,
  isValidUuid,
} from "../src/proxy/headers.js";

describe("Proxy Headers Handling", () => {
  it("should validate standard UUIDs correctly", () => {
    expect(isValidUuid("12345678-1234-4abc-8abc-123456789012")).toBe(true);
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid(null)).toBe(false);
  });

  it("should strip hop-by-hop headers from upstream request", () => {
    const mockReq = {
      headers: {
        host: "localhost:5000",
        connection: "keep-alive",
        "keep-alive": "timeout=5",
        "transfer-encoding": "chunked",
        authorization: "Bearer firebase-token-xyz",
        "content-type": "application/json",
      },
      socket: { remoteAddress: "192.168.1.100" },
    };

    const target = { id: "backend-1", host: "127.0.0.1", port: 5001 };
    const { headers } = buildUpstreamHeaders(mockReq, target, 5000);

    expect(headers["connection"]).toBeUndefined();
    expect(headers["keep-alive"]).toBeUndefined();
    expect(headers["transfer-encoding"]).toBeUndefined();
    expect(headers["authorization"]).toBe("Bearer firebase-token-xyz");
    expect(headers["content-type"]).toBe("application/json");
    expect(headers["host"]).toBe("127.0.0.1:5001");
  });

  it("should append client IP to X-Forwarded-For", () => {
    const mockReq = {
      headers: {
        "x-forwarded-for": "203.0.113.195",
      },
      socket: { remoteAddress: "192.168.1.50" },
    };

    const target = { id: "backend-1", host: "127.0.0.1", port: 5001 };
    const { headers } = buildUpstreamHeaders(mockReq, target, 5000);

    expect(headers["x-forwarded-for"]).toBe("203.0.113.195, 192.168.1.50");
    expect(headers["x-forwarded-port"]).toBe("5000");
  });

  it("should preserve valid incoming X-Request-ID and generate one if missing", () => {
    const target = { id: "backend-1", host: "127.0.0.1", port: 5001 };

    // With incoming valid UUID
    const validUuid = "11111111-2222-4333-8444-555555555555";
    const reqWithId = {
      headers: { "x-request-id": validUuid },
      socket: { remoteAddress: "127.0.0.1" },
    };
    const res1 = buildUpstreamHeaders(reqWithId, target, 5000);
    expect(res1.requestId).toBe(validUuid);
    expect(res1.headers["x-request-id"]).toBe(validUuid);

    // Without incoming ID
    const reqWithoutId = {
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    };
    const res2 = buildUpstreamHeaders(reqWithoutId, target, 5000);
    expect(isValidUuid(res2.requestId)).toBe(true);
    expect(res2.headers["x-request-id"]).toBe(res2.requestId);
  });

  it("should filter hop-by-hop headers from downstream response", () => {
    const upstreamHeaders = {
      "content-type": "application/json",
      connection: "close",
      "transfer-encoding": "chunked",
      "x-custom-header": "test-val",
    };

    const filtered = filterDownstreamHeaders(upstreamHeaders);
    expect(filtered["content-type"]).toBe("application/json");
    expect(filtered["x-custom-header"]).toBe("test-val");
    expect(filtered["connection"]).toBeUndefined();
    expect(filtered["transfer-encoding"]).toBeUndefined();
  });
});

