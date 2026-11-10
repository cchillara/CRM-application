import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import "./config/env.js";
import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_PATH is not set. Add the path to your Firebase service account JSON in CRM-application/backend/.env."
  );
}

const backendDir = fileURLToPath(new URL("..", import.meta.url));
const resolvedServiceAccountPath = path.isAbsolute(serviceAccountPath)
  ? serviceAccountPath
  : path.resolve(backendDir, serviceAccountPath);

if (!fs.existsSync(resolvedServiceAccountPath)) {
  throw new Error(
    `Firebase service account file was not found at: ${resolvedServiceAccountPath}`
  );
}

const serviceAccount = JSON.parse(fs.readFileSync(resolvedServiceAccountPath, "utf8"));

initializeApp({
  credential: cert(serviceAccount),
});

export const auth = getAuth();
