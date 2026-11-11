import "./config/env.js";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";

let authInstance;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    initializeApp({
      credential: cert(serviceAccount),
    });
    authInstance = getAuth();
  } catch (err) {
    console.warn("Failed to initialize Firebase Admin with service account:", err.message);
  }
}

if (!authInstance) {
  console.warn(
    `[Firebase Admin] Notice: Service account file not found at "${serviceAccountPath}". Dev auth fallback mode is active.`
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
    updateUser: async () => {},
    deleteUser: async () => {},
  };
}

export const auth = authInstance;
