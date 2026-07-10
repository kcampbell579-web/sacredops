/*
  Warnings:

  - The primary key for the `Incident` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Inspection` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Project` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Submission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `companyId` to the `ChecklistItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `IncidentCondition` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChecklistItem" DROP CONSTRAINT "ChecklistItem_inspectionId_fkey";

-- DropForeignKey
ALTER TABLE "IncidentCondition" DROP CONSTRAINT "IncidentCondition_incidentId_fkey";

-- DropIndex
DROP INDEX "ChecklistItem_inspectionId_idx";

-- DropIndex
DROP INDEX "Incident_companyId_idx";

-- DropIndex
DROP INDEX "IncidentCondition_incidentId_idx";

-- DropIndex
DROP INDEX "Inspection_companyId_idx";

-- DropIndex
DROP INDEX "Project_companyId_idx";

-- DropIndex
DROP INDEX "Submission_companyId_idx";

-- AlterTable
ALTER TABLE "ChecklistItem" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_pkey",
ADD CONSTRAINT "Incident_pkey" PRIMARY KEY ("companyId", "id");

-- AlterTable
ALTER TABLE "IncidentCondition" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Inspection" DROP CONSTRAINT "Inspection_pkey",
ADD CONSTRAINT "Inspection_pkey" PRIMARY KEY ("companyId", "id");

-- AlterTable
ALTER TABLE "Project" DROP CONSTRAINT "Project_pkey",
ADD CONSTRAINT "Project_pkey" PRIMARY KEY ("companyId", "id");

-- AlterTable
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_pkey",
ADD CONSTRAINT "Submission_pkey" PRIMARY KEY ("companyId", "id");

-- CreateIndex
CREATE INDEX "ChecklistItem_companyId_inspectionId_idx" ON "ChecklistItem"("companyId", "inspectionId");

-- CreateIndex
CREATE INDEX "IncidentCondition_companyId_incidentId_idx" ON "IncidentCondition"("companyId", "incidentId");

-- AddForeignKey
ALTER TABLE "IncidentCondition" ADD CONSTRAINT "IncidentCondition_companyId_incidentId_fkey" FOREIGN KEY ("companyId", "incidentId") REFERENCES "Incident"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_companyId_inspectionId_fkey" FOREIGN KEY ("companyId", "inspectionId") REFERENCES "Inspection"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
