"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { TicketIcon, Plus, Loader2 } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  department: string;
  priority: string;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  created_at: string;
  tenant_id: string;
}

interface Dept { id: string; name: string; slug: string; }

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-900/50 text-red-400",
  in_progress: "bg-amber-900/50 text-amber-400",
  waiting: "bg-yellow-900/50 text-yellow-400",
  resolved: "bg-green-900/50 text-green-400",
  closed: "bg-gray-800 text-gray-500",
};

const supabase = createClient();
const STATUSES = ["", "open", "in_progress", "waiting", "resolved", "closed"];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: d }] = await Promise.all([
        supabase.from("support_tickets")
          .select("id,subject,department,priority,status,guest_name,guest_email,created_at,tenant_id")
          .order("created_at", { ascending: false }).limit(200),
        supabase.from("support_departments").select("id,name,slug").order("sort_order"),
      ]);
      setTickets(t ?? []);
      setDepts(d ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = tickets.filter(t =>
    (!statusFilter || t.status === statusFilter) &&
    (!deptFilter || t.department === deptFilter)
  );

  const deptLabel = (slug: string) => depts.find(d => d.slug === slug)?.name ?? slug;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TicketIcon className="w-6 h-6 text-amber-400" /> Support Tickets
        </h1>
        <Link href="/super-admin/tickets/new"
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Open Ticket
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-600"}`}>
            {s || "All Status"}
          </button>
        ))}
        <div className="w-px bg-gray-700 mx-1" />
        <button onClick={() => setDeptFilter("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${deptFilter === "" ? "bg-indigo-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-600"}`}>
          All Depts
        </button>
        {depts.map(d => (
          <button key={d.id} onClick={() => setDeptFilter(d.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${deptFilter === d.slug ? "bg-indigo-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-600"}`}>
            {d.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[580px]">
            <thead>
              <tr className="border-b border-gray-800">
                {["#", "Subject", "From", "Dept", "Priority", "Status", "Date", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-600 text-xs font-mono">{t.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-white font-medium max-w-xs truncate">{t.subject}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {t.guest_name ?? "Site User"}
                    {t.guest_email && <div className="text-gray-600">{t.guest_email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{deptLabel(t.department)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${t.priority === "urgent" ? "text-red-400" : t.priority === "high" ? "text-amber-400" : "text-gray-500"}`}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] ?? STATUS_COLORS.open}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/super-admin/tickets/${t.id}`} className="text-xs text-indigo-400 hover:text-indigo-300">View →</Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-600">No tickets found</td></tr>
              )}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}
