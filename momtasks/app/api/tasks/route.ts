import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isValidCategory } from "@/lib/categories";

// GET /api/tasks?category=&q=  — list open tasks (newest first)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();

  const where: Record<string, unknown> = { status: "OPEN" };
  if (category && isValidCategory(category)) where.category = category;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { neighborhood: { contains: q } },
    ];
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { poster: { select: { name: true, neighborhood: true } } },
    take: 100,
  });

  return NextResponse.json({ tasks });
}

// POST /api/tasks  — create a new task (must be logged in)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const category = String(body.category ?? "other");
  const neighborhood = body.neighborhood ? String(body.neighborhood).trim() : null;
  const dollars = Number(body.pay);
  const neededByRaw = body.neededBy ? String(body.neededBy) : null;

  if (!title) return NextResponse.json({ error: "Please add a title." }, { status: 400 });
  if (!description) return NextResponse.json({ error: "Please add a description." }, { status: 400 });
  if (!isValidCategory(category)) return NextResponse.json({ error: "Please pick a category." }, { status: 400 });
  if (!Number.isFinite(dollars) || dollars < 0 || dollars > 100000) {
    return NextResponse.json({ error: "Please enter a valid pay amount." }, { status: 400 });
  }

  let neededBy: Date | null = null;
  if (neededByRaw) {
    const d = new Date(neededByRaw);
    if (!isNaN(d.getTime())) neededBy = d;
  }

  const task = await prisma.task.create({
    data: {
      posterId: user.id,
      title,
      description,
      category,
      neighborhood: neighborhood || user.neighborhood,
      payCents: Math.round(dollars * 100),
      neededBy,
    },
  });

  return NextResponse.json({ ok: true, id: task.id });
}
