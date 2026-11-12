import "./config/env.js";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let authInstance;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (serviceAccountPath) {
  const backendDir = fileURLToPath(new URL("..", import.meta.url));
  const resolvedServiceAccountPath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.resolve(backendDir, serviceAccountPath);

  if (fs.existsSync(resolvedServiceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedServiceAccountPath, "utf8"));
      initializeApp({
        credential: cert(serviceAccount),
      });
      authInstance = getAuth();
      console.log("Firebase Admin initialized successfully");
    } catch (err) {
      console.warn("Failed to initialize Firebase Admin with service account:", err.message);
    }
  }
}

if (!authInstance) {
  console.warn(
    `[Firebase Admin] Notice: Service account file not found at "${serviceAccountPath || 'undefined'}". Dev auth fallback mode is active.`
  );
  authInstance = {
    verifyIdToken: async (token) => {
      return {
        uid: token && token !== "undefined" ? token : "dev-client-admin",
        email: "admin@client.com",
        role: "ORGANIZATION_ADMIN",
      };
    },
    createSessionCookie: async () => "dev-session-cookie",
    verifySessionCookie: async () => ({ uid: "dev-super-admin", email: "admin@superadmin.com" }),
    updateUser: async () => { },
    deleteUser: async () => { },
  };
}

export const auth = authInstance;
