"use client";
import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";

export default function ContactForm() {
  const params = useSearchParams();
  const defaultDept = params.get("dept") === "sales" ? "sales" : "general";

  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "", department: defaultDept });
  const [website, setWebsite] = useState(""); // honeypot — must stay empty
  const loadedAt = useRef<number>(Date.now());
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website, elapsedMs: Date.now() - loadedAt.current }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Message sent!</h2>
        <p className="text-gray-600 mt-2">We'll get back to you within 1 business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Honeypot — hidden from humans, bots tend to fill it */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={e => setWebsite(e.target.value)}
        className="hidden"
        aria-hidden="true"
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
          <input required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input required type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
        <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))}>
          <option value="general">General Inquiry</option>
          <option value="sales">Sales</option>
          <option value="support">Technical Support</option>
          <option value="billing">Billing</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea required rows={5} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" value={form.body} onChange={e => setForm(f => ({...f, body: e.target.value}))} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : "Send Message"}
      </button>
    </form>
  );
}
