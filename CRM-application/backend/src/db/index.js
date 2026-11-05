import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

if (!prisma.profile && prisma.clientAdmin) {
  prisma.profile = prisma.clientAdmin;
} else if (!prisma.clientAdmin && prisma.profile) {
  prisma.clientAdmin = prisma.profile;
}

export default prisma;
