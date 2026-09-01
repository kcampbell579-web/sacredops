import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/tasks/:id/complete — the poster marks the task done.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  if (task.posterId !== user.id) {
    return NextResponse.json({ error: "Only the poster can mark this done." }, { status: 403 });
  }
  if (task.status !== "CLAIMED") {
    return NextResponse.json({ error: "This task isn't ready to complete." }, { status: 409 });
  }

  await prisma.task.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
