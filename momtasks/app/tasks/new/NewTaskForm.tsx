"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

export default function NewTaskForm({ defaultNeighborhood }: { defaultNeighborhood: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "childcare",
    pay: "",
    neighborhood: defaultNeighborhood,
    neededBy: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push(`/tasks/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card mt-6 space-y-4">
      <div>
        <label className="label">What do you need? *</label>
        <input
          className="input"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Pick up my daughter from soccer at 4pm"
          maxLength={120}
          required
        />
      </div>

      <div>
        <label className="label">Details *</label>
        <textarea
          className="input min-h-28"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Any details that help — address area, ages, what's involved, timing…"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Category *</label>
          <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Pay ($) *</label>
          <input
            className="input"
            type="number"
            min="0"
            step="1"
            value={form.pay}
            onChange={(e) => set("pay", e.target.value)}
            placeholder="20"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Neighborhood / town</label>
          <input
            className="input"
            value={form.neighborhood}
            onChange={(e) => set("neighborhood", e.target.value)}
            placeholder="Eastside"
          />
        </div>
        <div>
          <label className="label">Needed by <span className="text-brand-300">(optional)</span></label>
          <input className="input" type="date" value={form.neededBy} onChange={(e) => set("neededBy", e.target.value)} />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Posting…" : "Post task"}
      </button>
    </form>
  );
}
