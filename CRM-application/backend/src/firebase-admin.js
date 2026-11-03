import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import "./config/env.js";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

export const auth = getAuth();
