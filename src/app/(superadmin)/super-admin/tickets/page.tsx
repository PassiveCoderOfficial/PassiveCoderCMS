import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TicketIcon } from "lucide-react";

export const metadata = { title: "Support Tickets — Super Admin" };

const DEPT_COLORS: Record<string, string> = {
  sales: "bg-blue-900/50 text-blue-400",
  support: "bg-purple-900/50 text-purple-400",
  billing: "bg-green-900/50 text-green-400",
  general: "bg-gray-800 text-gray-400",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-900/50 text-red-400",
  in_progress: "bg-amber-900/50 text-amber-400",
  waiting: "bg-yellow-900/50 text-yellow-400",
  resolved: "bg-green-900/50 text-green-400",
  closed: "bg-gray-800 text-gray-500",
};

export default async function TicketsPage({ searchParams }: { searchParams: Promise<{ status?: string; dept?: string }> }) {
  const { status, dept } = await searchParams;
  const supabase = await createAdminClient();

  let query = supabase
    .from("support_tickets")
    .select("id,subject,department,priority,status,source,guest_name,guest_email,created_at,tenant_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);
  if (dept) query = query.eq("department", dept);

  const { data: tickets } = await query;

  const STATUSES = ["", "open", "in_progress", "waiting", "resolved", "closed"];
  const DEPTS = ["", "sales", "support", "billing", "general"];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <TicketIcon className="w-6 h-6 text-amber-400" /> Support Tickets
      </h1>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <Link key={s} href={s ? `/super-admin/tickets?status=${s}${dept ? `&dept=${dept}` : ""}` : `/super-admin/tickets${dept ? `?dept=${dept}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${(status ?? "") === s ? "bg-indigo-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-600"}`}>
            {s || "All Status"}
          </Link>
        ))}
        <div className="w-px bg-gray-700 mx-1" />
        {DEPTS.map(d => (
          <Link key={d} href={d ? `/super-admin/tickets?dept=${d}${status ? `&status=${status}` : ""}` : `/super-admin/tickets${status ? `?status=${status}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${(dept ?? "") === d ? "bg-indigo-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-600"}`}>
            {d || "All Depts"}
          </Link>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {["#", "Subject", "From", "Dept", "Priority", "Status", "Date", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(tickets ?? []).map(t => (
              <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-600 text-xs font-mono">{t.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-white font-medium max-w-xs truncate">{t.subject}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {t.guest_name ?? "Site User"}
                  {t.guest_email && <div className="text-gray-600">{t.guest_email}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DEPT_COLORS[t.department] ?? DEPT_COLORS.general}`}>{t.department}</span>
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
            {!tickets?.length && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-600">No tickets found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
