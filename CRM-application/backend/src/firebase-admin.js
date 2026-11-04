import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

let authInstance;

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    initializeApp({
      credential: cert(serviceAccount),
    });
    authInstance = getAuth();
    console.log("Firebase Admin initialized successfully");
  } catch (err) {
    console.warn("Failed to initialize Firebase Admin with service account:", err.message);
  }
} else {
  console.warn(
    `[Firebase Admin] Notice: Service account file not found at "${serviceAccountPath}". Dev auth fallback mode is active.`
  );
  authInstance = {
    verifyIdToken: async (token) => {
      // In dev mode, return dummy token payload or allow passing uid directly
      return {
        uid: token && token !== "undefined" ? token : "dev-client-admin",
        email: "admin@client.com",
        role: "ORGANIZATION_ADMIN",
      };
    },
  };
}

export const auth = authInstance;