import { describe, it, expect } from "vitest";
import { ApiResponse } from "../src/utils/apiResponse.js";

describe("ApiResponse Class", () => {
  it("should create a successful response with status < 400", () => {
    const res = new ApiResponse(200, { user: "Admin" }, "Success");

    expect(res.statusCode).toBe(200);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ user: "Admin" });
    expect(res.message).toBe("Success");
  });

  it("should mark success as false for 4xx/5xx errors", () => {
    const res = new ApiResponse(404, null, "Not Found");

    expect(res.statusCode).toBe(404);
    expect(res.success).toBe(false);
    expect(res.message).toBe("Not Found");
  });

  it("should support legacy 4-argument format (status, errors, data, message)", () => {
    const res = new ApiResponse(400, [{ message: "Invalid email" }], null, "Validation error");

    expect(res.statusCode).toBe(400);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toBe("Invalid email");
    expect(res.data).toBeNull();
  });
});