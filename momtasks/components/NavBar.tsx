import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function NavBar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-brand-100 bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-brand-600">
          <span className="text-2xl">🏡</span>
          <span>Village</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/tasks" className="btn-ghost hidden sm:inline-flex">
            Browse tasks
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="btn-ghost">
                My tasks
              </Link>
              <Link href="/tasks/new" className="btn-primary">
                Post a task
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Join
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
