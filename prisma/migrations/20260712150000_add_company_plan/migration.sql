-- AlterTable
ALTER TABLE "Company" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'starter';
ALTER TABLE "Company" ADD COLUMN "features" JSONB;
