import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import TaskCard from "@/components/TaskCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [posted, helping] = await Promise.all([
    prisma.task.findMany({
      where: { posterId: user.id },
      orderBy: { createdAt: "desc" },
      include: { poster: { select: { name: true } } },
    }),
    prisma.task.findMany({
      where: { helperId: user.id },
      orderBy: { claimedAt: "desc" },
      include: { poster: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-[#3f2c39]">Hi, {user.name} 👋</h1>
          <p className="mt-1 text-[#6b4b5f]">Here&apos;s everything you&apos;re posting and helping with.</p>
        </div>
        <Link href="/tasks/new" className="btn-primary">
          Post a task
        </Link>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold text-[#3f2c39]">Tasks you posted</h2>
        {posted.length === 0 ? (
          <div className="card text-[#6b4b5f]">
            You haven&apos;t posted anything yet.{" "}
            <Link href="/tasks/new" className="font-semibold text-brand-600 hover:underline">
              Post your first task
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posted.map((t) => (
              <TaskCard
                key={t.id}
                id={t.id}
                title={t.title}
                category={t.category}
                payCents={t.payCents}
                neighborhood={t.neighborhood}
                neededBy={t.neededBy}
                status={t.status}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-[#3f2c39]">Tasks you&apos;re helping with</h2>
        {helping.length === 0 ? (
          <div className="card text-[#6b4b5f]">
            You haven&apos;t claimed any tasks yet.{" "}
            <Link href="/tasks" className="font-semibold text-brand-600 hover:underline">
              Browse tasks to help
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {helping.map((t) => (
              <TaskCard
                key={t.id}
                id={t.id}
                title={t.title}
                category={t.category}
                payCents={t.payCents}
                neighborhood={t.neighborhood}
                neededBy={t.neededBy}
                status={t.status}
                posterName={t.poster.name}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
