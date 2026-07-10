-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "loc" TEXT,
    "div" TEXT,
    "contract" TEXT,
    "owner" TEXT,
    "role" TEXT,
    "crew" INTEGER NOT NULL DEFAULT 0,
    "pct" INTEGER NOT NULL DEFAULT 0,
    "openInsp" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_role_idx" ON "Project"("role");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");
