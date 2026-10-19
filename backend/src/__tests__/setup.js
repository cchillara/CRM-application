/**
 * Test setup file.
 * Runs before every test file to ensure environment variables
 * from .env are available when app.js is imported.
 */
import dotenv from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from the backend root (two levels up from src/__tests__/)
dotenv.config({ path: resolve(__dirname, "../../.env") });