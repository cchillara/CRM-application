import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

const instances = [
  { id: "backend-1", port: 5001 },
  { id: "backend-2", port: 5002 },
  { id: "backend-3", port: 5003 },
];

const children = [];

console.log("==================================================");
console.log("  Starting 3 CRM Backend Instances (5001, 5002, 5003)");
console.log("==================================================");

for (const inst of instances) {
  const child = spawn(
    process.execPath,
    [path.join(backendRoot, "src", "index.js")],
    {
      cwd: backendRoot,
      env: {
        ...process.env,
        PORT: String(inst.port),
        INSTANCE_ID: inst.id,
      },
      stdio: ["inherit", "pipe", "pipe"],
    }
  );

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${inst.id}:${inst.port}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${inst.id}:${inst.port}] ERR: ${data}`);
  });

  child.on("exit", (code, signal) => {
    console.log(`[${inst.id}:${inst.port}] Exited with code=${code} signal=${signal}`);
  });

  children.push(child);
}

const shutdown = (signal) => {
  console.log(`\nCluster manager received ${signal}. Stopping all backend instances...`);
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

