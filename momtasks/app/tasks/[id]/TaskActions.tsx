"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Contact = { name: string; phone: string | null; email: string };

export default function TaskActions({
  taskId,
  status,
  loggedIn,
  isPoster,
  isHelper,
  poster,
  helper,
}: {
  taskId: string;
  status: string;
  loggedIn: boolean;
  isPoster: boolean;
  isHelper: boolean;
  poster: Contact;
  helper: Contact | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function act(action: "claim" | "complete" | "cancel") {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/tasks/${taskId}/${action}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.refresh();
  }

  // --- Contact card, shown to the two people involved once claimed ---------
  function ContactCard({ label, c }: { label: string; c: Contact }) {
    return (
      <div className="rounded-xl border border-brand-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">{label}</p>
        <p className="mt-1 font-bold text-[#3f2c39]">{c.name}</p>
        <div className="mt-1 space-y-0.5 text-sm text-[#6b4b5f]">
          {c.phone && (
            <p>
              📞 <a className="text-brand-600 hover:underline" href={`tel:${c.phone}`}>{c.phone}</a>
            </p>
          )}
          <p>
            ✉️ <a className="text-brand-600 hover:underline" href={`mailto:${c.email}`}>{c.email}</a>
          </p>
        </div>
      </div>
    );
  }

  const errorBox = error && (
    <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
  );

  // --- Not logged in -------------------------------------------------------
  if (!loggedIn) {
    if (status === "OPEN") {
      return (
        <div className="mt-6">
          <Link href="/login" className="btn-primary w-full">
            Log in to help with this task
          </Link>
        </div>
      );
    }
    return null;
  }

  // --- Poster's view -------------------------------------------------------
  if (isPoster) {
    return (
      <div className="mt-6 space-y-4">
        {status === "OPEN" && (
          <>
            <p className="text-sm text-[#6b4b5f]">
              We&apos;ll let you know when a mom claims this. You can cancel anytime.
            </p>
            <button onClick={() => act("cancel")} disabled={busy} className="btn-outline w-full">
              Cancel task
            </button>
          </>
        )}
        {status === "CLAIMED" && helper && (
          <>
            <p className="text-sm font-semibold text-[#3f2c39]">
              🙌 {helper.name} is helping with this! Reach out to sort out the details.
            </p>
            <ContactCard label="Your helper" c={helper} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={() => act("complete")} disabled={busy} className="btn-primary flex-1">
                Mark as complete
              </button>
              <button onClick={() => act("cancel")} disabled={busy} className="btn-outline flex-1">
                Cancel
              </button>
            </div>
          </>
        )}
        {status === "COMPLETED" && (
          <p className="text-sm text-[#6b4b5f]">This task is complete. Thanks for using Village! 💛</p>
        )}
        {status === "CANCELLED" && <p className="text-sm text-[#6b4b5f]">This task was cancelled.</p>}
        {errorBox}
      </div>
    );
  }

  // --- Helper's view (already claimed by me) -------------------------------
  if (isHelper) {
    return (
      <div className="mt-6 space-y-4">
        {status === "CLAIMED" && (
          <>
            <p className="text-sm font-semibold text-[#3f2c39]">
              💛 You&apos;re helping with this! Reach out to {poster.name} to arrange the details.
            </p>
            <ContactCard label="Task poster" c={poster} />
          </>
        )}
        {status === "COMPLETED" && (
          <p className="text-sm text-[#6b4b5f]">All done — thanks for lending a hand! 💛</p>
        )}
        {errorBox}
      </div>
    );
  }

  // --- Another mom, task is open -------------------------------------------
  if (status === "OPEN") {
    return (
      <div className="mt-6">
        <button onClick={() => act("claim")} disabled={busy} className="btn-primary w-full">
          {busy ? "Claiming…" : "I'll help with this 🙋‍♀️"}
        </button>
        <p className="mt-2 text-center text-xs text-[#6b4b5f]">
          You&apos;ll get the poster&apos;s contact info once you claim it.
        </p>
        {errorBox}
      </div>
    );
  }

  // Claimed by someone else / closed
  return (
    <div className="mt-6">
      <p className="text-sm text-[#6b4b5f]">This task has already been picked up.</p>
    </div>
  );
}
