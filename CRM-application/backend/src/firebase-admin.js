import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const serviceAccount = JSON.parse(
  fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

export const auth = getAuth();