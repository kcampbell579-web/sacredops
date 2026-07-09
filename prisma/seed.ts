import { PrismaClient, Trade, JobsiteStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SacredOps database…");

  // Clear existing data (idempotent seeding for local dev)
  // Note: Inspection/ChecklistItem are the portal's decomposed store (see
  // lib/projectors.ts), so this relational demo seed intentionally leaves them
  // alone — seeding them would inject demo inspections into the live portal.
  await prisma.incident.deleteMany();
  await prisma.permit.deleteMany();
  await prisma.document.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.trainingCourse.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.jobsite.deleteMany();
  await prisma.union.deleteMany();

  // Unions
  const local361 = await prisma.union.create({
    data: { name: "Laborers' International", local: "Local 361" },
  });
  const local580 = await prisma.union.create({
    data: { name: "Ironworkers", local: "Local 580" },
  });

  // Jobsites (mirrors the demo projects shown in the Supervisor Portal)
  const ironwood = await prisma.jobsite.create({
    data: {
      name: "Ironwood Bridge Replacement",
      code: "NYSDOT-2024-0417",
      city: "Millbrook",
      state: "NY",
      status: JobsiteStatus.ACTIVE,
      startDate: new Date("2024-04-17"),
    },
  });
  const cedar = await prisma.jobsite.create({
    data: {
      name: "Cedar Harbor Outfall Rehab",
      code: "S3C067-22G",
      city: "Bayport",
      state: "NY",
      status: JobsiteStatus.ACTIVE,
    },
  });
  const granite = await prisma.jobsite.create({
    data: {
      name: "Granite Ridge Interchange",
      code: "NYSDOT-2025-1183",
      city: "Fairview",
      state: "NY",
      status: JobsiteStatus.ACTIVE,
    },
  });

  // Workers
  const foreman = await prisma.worker.create({
    data: {
      firstName: "John",
      lastName: "Rivera",
      trade: Trade.FOREMAN,
      unionId: local361.id,
      email: "john.rivera@example.com",
    },
  });
  const ironworker = await prisma.worker.create({
    data: {
      firstName: "Marcus",
      lastName: "Bell",
      trade: Trade.IRONWORKER,
      unionId: local580.id,
    },
  });
  const laborer = await prisma.worker.create({
    data: { firstName: "Diego", lastName: "Santos", trade: Trade.LABORER },
  });

  // Assignments
  await prisma.assignment.createMany({
    data: [
      { workerId: foreman.id, jobsiteId: ironwood.id, role: "Site Foreman", startDate: new Date("2024-04-17") },
      { workerId: ironworker.id, jobsiteId: ironwood.id, role: "Ironworker", startDate: new Date("2024-05-01") },
      { workerId: laborer.id, jobsiteId: cedar.id, role: "Laborer", startDate: new Date("2024-06-15") },
    ],
  });

  // Certifications
  await prisma.certification.createMany({
    data: [
      {
        workerId: foreman.id,
        name: "OSHA 30",
        issuingBody: "OSHA",
        issuedDate: new Date("2023-01-10"),
        expiresDate: new Date("2028-01-10"),
      },
      {
        workerId: ironworker.id,
        name: "Confined Space Entry",
        issuingBody: "NCCER",
        issuedDate: new Date("2024-02-20"),
        expiresDate: new Date("2026-02-20"),
      },
    ],
  });

  // Training
  const course = await prisma.trainingCourse.create({
    data: {
      title: "Fall Protection Above 6 ft",
      provider: "SacredOps Academy",
      durationHours: 4,
    },
  });
  await prisma.enrollment.create({
    data: { workerId: ironworker.id, courseId: course.id, status: "COMPLETED", score: 96 },
  });

  // Safety
  await prisma.incident.create({
    data: {
      jobsiteId: granite.id,
      reportedById: foreman.id,
      title: "Near miss — dropped tool from scaffold",
      description: "Hand tool slipped from level 2 scaffold; no injuries. Tethering enforced.",
      severity: "NEAR_MISS",
      occurredAt: new Date("2025-06-30T14:20:00Z"),
      location: "Pier 3 scaffold",
    },
  });
  // Permits & documents
  await prisma.permit.create({
    data: {
      jobsiteId: ironwood.id,
      type: "Building",
      permitNumber: "BLD-2024-8891",
      issuingAuthority: "Millbrook DOB",
      status: "APPROVED",
      approvedAt: new Date("2024-04-01"),
      expiresAt: new Date("2026-04-01"),
    },
  });
  await prisma.document.create({
    data: {
      jobsiteId: ironwood.id,
      name: "Site Safety Plan v2",
      category: "SAFETY_PLAN",
      version: "2.0",
    },
  });

  console.log("Seed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
