ALTER TABLE "Organization"
ADD COLUMN "planId" TEXT,
ADD COLUMN "subscriptionStatus" TEXT,
ADD COLUMN "paymentStatus" TEXT,
ADD COLUMN "billingCycle" TEXT,
ADD COLUMN "subscriptionAmount" DOUBLE PRECISION;
