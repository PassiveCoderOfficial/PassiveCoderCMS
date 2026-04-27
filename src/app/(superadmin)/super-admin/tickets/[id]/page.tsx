"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { TicketIcon, ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

interface Ticket {
  id: string;
  subject: string;
  body: string;
  department: string;
  priority: string;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  user_id: string | null;
  tenant_id: string | null;
  attachments: string[];
  source: string | null;
  created_at: string;
  updated_at: string;
}

interface Dept { id: string; name: string; slug: string; }

const supabase = createClient();

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editDept, setEditDept] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [internalNote, setInternalNote] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: d }] = await Promise.all([
        supabase.from("support_tickets").select("*").eq("id", id).single(),
        supabase.from("support_departments").select("id,name,slug").order("sort_order"),
      ]);
      if (t) {
        setTicket(t as Ticket);
        setEditDept(t.department);
        setEditStatus(t.status);
        setEditPriority(t.priority);
      }
      setDepts(d ?? []);
      setLoading(false);
    })();
  }, [id]);

  async function save() {
    if (!ticket) return;
    setSaving(true);
    const { error } = await supabase.from("support_tickets").update({
      department: editDept,
      status: editStatus,
      priority: editPriority,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setTicket(prev => prev ? { ...prev, department: editDept, status: editStatus, priority: editPriority } : prev);
    toast.success("Ticket updated");
  }

  const deptLabel = (slug: string) => depts.find(d => d.slug === slug)?.name ?? slug;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>;
  if (!ticket) return <div className="p-6 text-gray-500">Ticket not found.</div>;

  const changed = editDept !== ticket.department || editStatus !== ticket.status || editPriority !== ticket.priority;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/super-admin/tickets" className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <TicketIcon className="w-5 h-5 text-amber-400" />
        <h1 className="text-xl font-bold text-white truncate">{ticket.subject}</h1>
      </div>

      {/* Ticket info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 font-mono">{ticket.id.slice(0, 8)}…</div>
          <div className="text-xs text-gray-600">{new Date(ticket.created_at).toLocaleString()}</div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">From</p>
          <p className="text-sm text-white">{ticket.guest_name ?? "Site User"}</p>
          {ticket.guest_email && <p className="text-xs text-gray-400">{ticket.guest_email}</p>}
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Message</p>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{ticket.body}</p>
        </div>
        {ticket.attachments?.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Attachments</p>
            <div className="flex flex-wrap gap-2">
              {ticket.attachments.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-700 hover:border-indigo-500 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Management panel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Ticket Management</h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Department</label>
            <select value={editDept} onChange={e => setEditDept(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {depts.map(d => <option key={d.id} value={d.slug}>{d.name}</option>)}
              {/* fallback if ticket has a dept not in active list */}
              {!depts.find(d => d.slug === editDept) && <option value={editDept}>{editDept}</option>}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Status</label>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {["open","in_progress","waiting","resolved","closed"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Priority</label>
            <select value={editPriority} onChange={e => setEditPriority(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {["low","normal","high","urgent"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {ticket.department !== editDept && (
          <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800 rounded-lg px-3 py-2">
            Reassigning from <strong>{deptLabel(ticket.department)}</strong> → <strong>{deptLabel(editDept)}</strong>
          </div>
        )}

        <button onClick={save} disabled={saving || !changed}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
