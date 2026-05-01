"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim() || !form.password) return;
    if (form.password.length < 8) { toast.error("Password min 8 chars"); return; }
    setLoading(true);
    const res = await fetch("/api/super-admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { toast.error(data.error ?? "Failed to create user"); return; }
    toast.success("User created");
    router.push("/super-admin/users");
    router.refresh();
  }

  return (
    <div className="p-6 max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="w-6 h-6 text-purple-400" />
        <h1 className="text-2xl font-bold text-white">New User</h1>
      </div>

      <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400">Full Name <span className="text-gray-600">(optional)</span></label>
          <input
            type="text"
            placeholder="Jane Smith"
            value={form.full_name}
            onChange={e => set("full_name", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400">Email <span className="text-red-400">*</span></label>
          <input
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={e => set("email", e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400">Password <span className="text-red-400">*</span></label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Min 8 characters"
              value={form.password}
              onChange={e => set("password", e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-10 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || !form.email.trim() || !form.password}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Create User
          </button>
          <Link href="/super-admin/users"
            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
