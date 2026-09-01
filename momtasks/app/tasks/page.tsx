import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, isValidCategory } from "@/lib/categories";
import TaskCard from "@/components/TaskCard";

export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const category = sp.category && isValidCategory(sp.category) ? sp.category : undefined;
  const q = sp.q?.trim();

  const where: Record<string, unknown> = { status: "OPEN" };
  if (category) where.category = category;
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
    include: { poster: { select: { name: true } } },
    take: 100,
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-[#3f2c39]">Tasks near you</h1>
          <p className="mt-1 text-[#6b4b5f]">Find a task to help with and earn a little.</p>
        </div>
        <Link href="/tasks/new" className="btn-primary">
          Post a task
        </Link>
      </div>

      {/* Search */}
      <form method="get" className="mt-6 flex gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search tasks, e.g. pickup, dinner, babysitting…"
          className="input"
        />
        <button className="btn-outline">Search</button>
      </form>

      {/* Category filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/tasks"
          className={`chip px-3 py-1.5 ${!category ? "bg-brand-500 text-white" : "hover:bg-brand-100"}`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/tasks?category=${c.value}`}
            className={`chip px-3 py-1.5 ${category === c.value ? "bg-brand-500 text-white" : "hover:bg-brand-100"}`}
          >
            {c.emoji} {c.label}
          </Link>
        ))}
      </div>

      {/* Results */}
      {tasks.length === 0 ? (
        <div className="card mt-8 text-center text-[#6b4b5f]">
          <p className="text-4xl">🔍</p>
          <p className="mt-2 font-semibold">No open tasks here yet.</p>
          <p className="mt-1 text-sm">Be the first — post a task and get some help.</p>
          <Link href="/tasks/new" className="btn-primary mt-4">
            Post a task
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              id={t.id}
              title={t.title}
              category={t.category}
              payCents={t.payCents}
              neighborhood={t.neighborhood}
              neededBy={t.neededBy}
              posterName={t.poster.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
