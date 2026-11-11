import prisma from "./src/db/index.js";
try {
  const users = await prisma.user.findMany({
    include: { organization: true },
    take: 10,
  });
  console.log("USERS:", JSON.stringify(users, null, 2));
} catch (e) {
  console.error("DB QUERY FAIL:", e.message);
} finally {
  await prisma.$disconnect();
}
