import prisma from "../db/index.js";

export async function findSuperAdminForFirebaseUser(firebaseUser) {
  if (!firebaseUser?.uid) return null;

  const byUid = await prisma.superAdmin.findUnique({
    where: { firebaseUid: firebaseUser.uid },
  });
  if (byUid) return byUid;

  if (firebaseUser.email_verified !== true || !firebaseUser.email) return null;

  const byVerifiedEmail = await prisma.superAdmin.findFirst({
    where: { email: { equals: firebaseUser.email, mode: "insensitive" } },
  });
  if (!byVerifiedEmail) return null;

  try {
    return await prisma.superAdmin.update({
      where: { id: byVerifiedEmail.id },
      data: { firebaseUid: firebaseUser.uid },
    });
  } catch (error) {
    if (error?.code === "P2002") return null;
    throw error;
  }
}
