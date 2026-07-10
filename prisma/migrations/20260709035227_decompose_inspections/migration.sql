/*
  Warnings:

  - You are about to drop the column `comment` on the `ChecklistItem` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Inspection` table. All the data in the column will be lost.
  - You are about to drop the column `inspector` on the `Inspection` table. All the data in the column will be lost.
  - You are about to drop the column `jobsiteId` on the `Inspection` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Inspection` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledAt` on the `Inspection` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Inspection` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Inspection` table. All the data in the column will be lost.
  - Added the required column `position` to the `ChecklistItem` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `result` on the `ChecklistItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `project` to the `Inspection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Inspection` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `Inspection` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Inspection" DROP CONSTRAINT "Inspection_jobsiteId_fkey";

-- DropIndex
DROP INDEX "Inspection_jobsiteId_idx";

-- AlterTable
ALTER TABLE "ChecklistItem" DROP COLUMN "comment",
ADD COLUMN     "position" INTEGER NOT NULL,
DROP COLUMN "result",
ADD COLUMN     "result" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Inspection" DROP COLUMN "completedAt",
DROP COLUMN "inspector",
DROP COLUMN "jobsiteId",
DROP COLUMN "notes",
DROP COLUMN "scheduledAt",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
ADD COLUMN     "by" TEXT,
ADD COLUMN     "date" TEXT,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "project" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ChecklistResult";

-- DropEnum
DROP TYPE "InspectionStatus";

-- CreateIndex
CREATE INDEX "ChecklistItem_result_idx" ON "ChecklistItem"("result");

-- CreateIndex
CREATE INDEX "Inspection_project_idx" ON "Inspection"("project");

-- CreateIndex
CREATE INDEX "Inspection_status_idx" ON "Inspection"("status");

-- CreateIndex
CREATE INDEX "Inspection_type_idx" ON "Inspection"("type");
