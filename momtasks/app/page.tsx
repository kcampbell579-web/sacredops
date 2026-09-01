import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-brand-50 to-white p-8 sm:p-14 text-center">
        <span className="chip mb-4">🏡 A little help goes a long way</span>
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight text-[#3f2c39] sm:text-5xl">
          Moms helping moms,
          <span className="text-brand-600"> one small task at a time.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[#6b4b5f]">
          Need a hand with a school pickup, a home-cooked meal, or an afternoon of childcare?
          Post it. Another mom nearby can pick it up and earn a little money.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <>
              <Link href="/tasks/new" className="btn-primary">
                Post a task
              </Link>
              <Link href="/tasks" className="btn-outline">
                Browse tasks
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup" className="btn-primary">
                Join the village — it&apos;s free
              </Link>
              <Link href="/tasks" className="btn-outline">
                Browse tasks
              </Link>
            </>
          )}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-center text-2xl font-bold text-[#3f2c39]">How it works</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            { emoji: "📝", title: "Post a task", body: "Describe what you need, when, and what you'll pay. Takes a minute." },
            { emoji: "🙋‍♀️", title: "A mom claims it", body: "A trusted mom nearby offers to help. You two connect to sort out the details." },
            { emoji: "💛", title: "Help & pay", body: "She helps out, you settle up. Everyone's day just got a little easier." },
          ].map((s) => (
            <div key={s.title} className="card text-center">
              <div className="text-4xl">{s.emoji}</div>
              <h3 className="mt-3 font-bold text-[#3f2c39]">{s.title}</h3>
              <p className="mt-1.5 text-sm text-[#6b4b5f]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-center text-2xl font-bold text-[#3f2c39]">What kind of help?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/tasks?category=${c.value}`}
              className="chip px-4 py-2 text-sm hover:bg-brand-100"
            >
              <span>{c.emoji}</span> {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="rounded-3xl bg-brand-500 p-8 text-center text-white sm:p-12">
          <h2 className="text-2xl font-bold">Ready to lend or get a hand?</h2>
          <p className="mx-auto mt-2 max-w-md text-brand-50">
            Join free and start posting or picking up tasks in your neighborhood today.
          </p>
          <Link href="/signup" className="btn mt-6 bg-white text-brand-600 hover:bg-brand-50">
            Create your free account
          </Link>
        </section>
      )}
    </div>
  );
}
