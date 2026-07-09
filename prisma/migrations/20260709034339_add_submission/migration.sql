-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "formTitle" TEXT NOT NULL,
    "worker" TEXT,
    "date" TEXT,
    "spec" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Submission_project_idx" ON "Submission"("project");

-- CreateIndex
CREATE INDEX "Submission_formTitle_idx" ON "Submission"("formTitle");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");
