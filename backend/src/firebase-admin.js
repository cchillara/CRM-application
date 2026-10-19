
import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!configuredPath) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_PATH is missing from the backend environment"
  );
}

const serviceAccountPath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.resolve(currentDirectory, configuredPath);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `Firebase service account file was not found: ${serviceAccountPath}`
  );
}

let serviceAccount;

try {
  serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );
} catch {
  throw new Error(
    "Firebase service account file is not valid JSON"
  );
}

if (
  !serviceAccount.project_id ||
  !serviceAccount.client_email ||
  !serviceAccount.private_key
) {
  throw new Error(
    "Firebase service account configuration is incomplete"
  );
}

const firebaseApp = getApps().length
  ? getApp()
  : initializeApp({
    credential: cert(serviceAccount),
  });

export const auth = getAuth(firebaseApp);
