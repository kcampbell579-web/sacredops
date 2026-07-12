-- AlterTable
ALTER TABLE "Company" ADD COLUMN "subdomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Company_subdomain_key" ON "Company"("subdomain");
