CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "Customer"
ADD COLUMN "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "assignedToId" TEXT;

CREATE INDEX "Customer_assignedToId_idx" ON "Customer"("assignedToId");

ALTER TABLE "Customer"
ADD CONSTRAINT "Customer_assignedToId_fkey"
FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
