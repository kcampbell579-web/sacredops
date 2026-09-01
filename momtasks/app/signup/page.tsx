"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", neighborhood: "", phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, pay: undefined }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/tasks");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-extrabold text-[#3f2c39]">Join the village 🏡</h1>
      <p className="mt-2 text-[#6b4b5f]">Free account. Post tasks or help other moms nearby.</p>

      <form onSubmit={submit} className="card mt-6 space-y-4">
        <div>
          <label className="label">Your name</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jamie" required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 8 characters" required />
        </div>
        <div>
          <label className="label">Neighborhood / town <span className="text-brand-300">(optional)</span></label>
          <input className="input" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Eastside" />
        </div>
        <div>
          <label className="label">Phone <span className="text-brand-300">(optional — shared only after a task is claimed)</span></label>
          <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 123-4567" />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Creating…" : "Create my account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[#6b4b5f]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
