import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Provide alias so prisma.profile and prisma.clientAdmin can be used interchangeably
if (!prisma.profile && prisma.clientAdmin) {
  prisma.profile = prisma.clientAdmin;
} else if (!prisma.clientAdmin && prisma.profile) {
  prisma.clientAdmin = prisma.profile;
}

export default prisma;
