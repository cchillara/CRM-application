ALTER TABLE "SuperAdmin"
  ADD COLUMN "name" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "designation" TEXT,
  ADD COLUMN "passwordLastChangedAt" TIMESTAMP(3);

CREATE TABLE "SubscriptionPlan" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "billing" TEXT NOT NULL,
  "userLimit" INTEGER NOT NULL,
  "features" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformSettings" (
  "id" TEXT NOT NULL DEFAULT 'global',
  "settings" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "subject" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "message" TEXT NOT NULL,
  "replies" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "SupportTicket_organizationId_idx" ON "SupportTicket"("organizationId");
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");
