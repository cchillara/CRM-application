import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Status from "./Status";

describe("Status Badge Component", () => {
    it("renders active badge correctly", () => {
        render(<Status value="Active" />);
        const badge = screen.getByText("Active");
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass("badge-active");
    });

    it("renders pending badge correctly", () => {
        render(<Status value="Pending" />);
        const badge = screen.getByText("Pending");
        expect(badge).toBeInTheDocument();
    });
});