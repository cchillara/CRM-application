import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const backendEnvPath = fileURLToPath(new URL("../../.env", import.meta.url));
dotenv.config({ path: backendEnvPath });
