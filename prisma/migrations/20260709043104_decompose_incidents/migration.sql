/*
  Warnings:

  - You are about to drop the column `description` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `jobsiteId` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `occurredAt` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `reportedById` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Incident` table. All the data in the column will be lost.
  - Added the required column `kind` to the `Incident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project` to the `Incident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `Incident` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_jobsiteId_fkey";

-- DropForeignKey
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_reportedById_fkey";

-- DropIndex
DROP INDEX "Incident_jobsiteId_idx";

-- DropIndex
DROP INDEX "Incident_severity_idx";

-- DropIndex
DROP INDEX "Incident_status_idx";

-- AlterTable
ALTER TABLE "Incident" DROP COLUMN "description",
DROP COLUMN "jobsiteId",
DROP COLUMN "location",
DROP COLUMN "occurredAt",
DROP COLUMN "reportedById",
DROP COLUMN "severity",
DROP COLUMN "status",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
ADD COLUMN     "completedBy" TEXT,
ADD COLUMN     "dateTime" TEXT,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "kind" TEXT NOT NULL,
ADD COLUMN     "lostTime" TEXT,
ADD COLUMN     "medicalAttention" TEXT,
ADD COLUMN     "project" TEXT NOT NULL,
ADD COLUMN     "projectNumber" TEXT,
ADD COLUMN     "reportedWhen" TEXT,
ADD COLUMN     "source" TEXT NOT NULL,
ADD COLUMN     "type" TEXT;

-- DropEnum
DROP TYPE "IncidentSeverity";

-- DropEnum
DROP TYPE "IncidentStatus";

-- CreateTable
CREATE TABLE "IncidentCondition" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "IncidentCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncidentCondition_incidentId_idx" ON "IncidentCondition"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentCondition_result_idx" ON "IncidentCondition"("result");

-- CreateIndex
CREATE INDEX "Incident_project_idx" ON "Incident"("project");

-- CreateIndex
CREATE INDEX "Incident_type_idx" ON "Incident"("type");

-- CreateIndex
CREATE INDEX "Incident_source_idx" ON "Incident"("source");

-- AddForeignKey
ALTER TABLE "IncidentCondition" ADD CONSTRAINT "IncidentCondition_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
