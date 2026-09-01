import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { categoryEmoji, categoryLabel, formatPay } from "@/lib/categories";
import TaskActions from "./TaskActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open — waiting for a helper",
  CLAIMED: "Claimed",
  COMPLETED: "Completed 💛",
  CANCELLED: "Cancelled",
};

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, task] = await Promise.all([
    getCurrentUser(),
    prisma.task.findUnique({
      where: { id },
      include: {
        poster: { select: { id: true, name: true, neighborhood: true, phone: true, email: true } },
        helper: { select: { id: true, name: true, phone: true, email: true } },
      },
    }),
  ]);

  if (!task) notFound();

  const isPoster = user?.id === task.posterId;
  const isHelper = user?.id === task.helperId;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/tasks" className="text-sm text-brand-600 hover:underline">
        ← Back to tasks
      </Link>

      <div className="card mt-4">
        <div className="flex items-start justify-between gap-4">
          <span className="chip">
            {categoryEmoji(task.category)} {categoryLabel(task.category)}
          </span>
          <span className="text-2xl font-extrabold text-brand-600">{formatPay(task.payCents)}</span>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold text-[#3f2c39]">{task.title}</h1>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6b4b5f]">
          {task.neighborhood && <span>📍 {task.neighborhood}</span>}
          {task.neededBy && (
            <span>
              🗓 Needed by{" "}
              {new Date(task.neededBy).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          )}
          <span>· Posted by {isPoster ? "you" : task.poster.name}</span>
        </div>

        <p className="mt-5 whitespace-pre-wrap text-[#3f2c39]">{task.description}</p>

        <div className="mt-6 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700">
          {STATUS_LABEL[task.status] ?? task.status}
        </div>

        <TaskActions
          taskId={task.id}
          status={task.status}
          loggedIn={!!user}
          isPoster={isPoster}
          isHelper={isHelper}
          poster={{ name: task.poster.name, phone: task.poster.phone, email: task.poster.email }}
          helper={task.helper ? { name: task.helper.name, phone: task.helper.phone, email: task.helper.email } : null}
        />
      </div>

      <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-center text-xs text-amber-700">
        💡 Stay safe: meet in a public place when you can, trust your gut, and agree on details up front.
      </p>
    </div>
  );
}
