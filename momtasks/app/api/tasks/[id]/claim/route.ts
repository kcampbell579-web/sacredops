import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/tasks/:id/claim — the logged-in mom offers to help.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  if (task.posterId === user.id) {
    return NextResponse.json({ error: "You can't claim your own task." }, { status: 400 });
  }
  if (task.status !== "OPEN") {
    return NextResponse.json({ error: "This task is no longer open." }, { status: 409 });
  }

  // Guard against a race: only claim if it's still OPEN.
  const result = await prisma.task.updateMany({
    where: { id, status: "OPEN" },
    data: { status: "CLAIMED", helperId: user.id, claimedAt: new Date() },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Someone just claimed this task." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
