import prisma from "./src/db/index.js";
try {
  const result = await prisma.$queryRaw`SELECT 1 as res`;
  console.log("DB SUCCESS:", result);
} catch (e) {
  console.error("DB FAIL FULL ERROR:", e);
} finally {
  await prisma.$disconnect();
}
