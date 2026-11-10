
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["./src/__tests__/setup.js"],
        include: ["src/**/__tests__/**/*.test.js", "src/**/*.test.js"],
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            include: ["src/middleware/**/*.js"],
        },
        // Run each test file in isolation so module mocks don't bleed.
        isolate: true,
        // Longer timeout for async middleware tests.
        testTimeout: 10000,
    },
});
