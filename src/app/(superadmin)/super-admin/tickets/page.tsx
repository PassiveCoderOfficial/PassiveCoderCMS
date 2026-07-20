"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TicketIcon, Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

const STATUSES = ["", "open", "in_progress", "waiting", "resolved", "closed"];

function statusVariant(s: string) {
  if (s === "open") return "destructive" as const;
  if (s === "in_progress" || s === "waiting") return "warning" as const;
  if (s === "resolved") return "success" as const;
  return "secondary" as const;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/tickets")
      .then(r => r.json())
      .then(({ tickets: t, depts: d }) => {
        setTickets(t ?? []);
        setDepts(d ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = tickets.filter(t =>
    (!statusFilter || t.status === statusFilter) &&
    (!deptFilter || t.department === deptFilter)
  );

  const deptLabel = (slug: string) => depts.find(d => d.slug === slug)?.name ?? slug;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TicketIcon className="w-6 h-6 text-amber-500" /> Support Tickets
        </h1>
        <Button asChild>
          <Link href="/super-admin/tickets/new">
            <Plus className="w-4 h-4" /> Open Ticket
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
            {s || "All Status"}
          </Button>
        ))}
        <div className="w-px bg-border mx-1" />
        <Button variant={deptFilter === "" ? "default" : "outline"} size="sm" onClick={() => setDeptFilter("")}>
          All Depts
        </Button>
        {depts.map(d => (
          <Button key={d.id} variant={deptFilter === d.slug ? "default" : "outline"} size="sm" onClick={() => setDeptFilter(d.slug)}>
            {d.name}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">#</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Subject</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">From</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Dept</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Priority</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono hidden lg:table-cell">{t.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{t.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {t.guest_name ?? "Site User"}
                      {t.guest_email && <div className="text-muted-foreground/70">{t.guest_email}</div>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="secondary">{deptLabel(t.department)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${t.priority === "urgent" ? "text-red-500" : t.priority === "high" ? "text-amber-500" : "text-muted-foreground"}`}>{t.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link href={`/super-admin/tickets/${t.id}`} className="text-xs text-primary hover:underline">View →</Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">No tickets found</td></tr>
                )}
              </tbody>
            </table></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
