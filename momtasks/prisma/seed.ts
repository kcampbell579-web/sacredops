import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  // A few demo moms. Password for all: "password123"
  const moms = [
    { email: "maria@example.com", name: "Maria", neighborhood: "Eastside", phone: "(555) 201-3344" },
    { email: "priya@example.com", name: "Priya", neighborhood: "Downtown", phone: "(555) 778-1200" },
    { email: "hana@example.com", name: "Hana", neighborhood: "Westfield", phone: "(555) 640-9911" },
  ];

  const created = [];
  for (const m of moms) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: { ...m, passwordHash: hashPassword("password123") },
    });
    created.push(user);
  }
  const [maria, priya, hana] = created;

  const day = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  const tasks = [
    {
      posterId: maria.id,
      title: "Pick up my son from soccer practice at 4:30pm",
      description: "Practice ends at 4:30 at Lincoln Park. Just need someone to drive him home (about 10 min). Booster seat provided.",
      category: "pickup",
      payCents: 2000,
      neighborhood: "Eastside",
      neededBy: day(2),
    },
    {
      posterId: priya.id,
      title: "Home-cooked dinner for a family of 4 (Friday)",
      description: "Recovering from surgery and would love a warm, kid-friendly dinner dropped off Friday evening. No nut allergies. So grateful!",
      category: "meals",
      payCents: 4500,
      neighborhood: "Downtown",
      neededBy: day(3),
    },
    {
      posterId: hana.id,
      title: "Two hours of babysitting Saturday morning",
      description: "Need a hand watching my 3-year-old from 9–11am while I take my older one to a dentist appointment. Snacks and toys ready to go.",
      category: "childcare",
      payCents: 4000,
      neighborhood: "Westfield",
      neededBy: day(4),
    },
    {
      posterId: maria.id,
      title: "Grocery run — quick list of about 15 items",
      description: "If you're already headed to the store this week, could you grab a short list for me? I'll Venmo you for the groceries plus the fee.",
      category: "errands",
      payCents: 1500,
      neighborhood: "Eastside",
      neededBy: day(5),
    },
    {
      posterId: priya.id,
      title: "Help hosting a 5-year-old's birthday party",
      description: "Extra pair of hands for 3 hours Sunday afternoon — setting up, wrangling kids for games, and cleanup. It'll be fun (and a little chaotic)!",
      category: "events",
      payCents: 6000,
      neighborhood: "Downtown",
      neededBy: day(6),
    },
  ];

  for (const t of tasks) {
    // Avoid duplicating on re-seed by checking title+poster.
    const exists = await prisma.task.findFirst({ where: { title: t.title, posterId: t.posterId } });
    if (!exists) await prisma.task.create({ data: t });
  }

  console.log("✅ Seeded demo moms and tasks. Log in with any email above / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
