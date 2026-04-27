"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Globe, ExternalLink, Search, Trash2, Loader2, AlertTriangle, X, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Site {
  id: string;
  name: string;
  slug: string;
  status: string;
  custom_domain: string | null;
  domain_status: string | null;
  created_at: string;
  onboarding_completed: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-900/50 text-green-400",
  trial: "bg-amber-900/50 text-amber-400",
  suspended: "bg-red-900/50 text-red-400",
};

const STATUSES = ["", "trial", "active", "suspended"];

function DeleteModal({ site, onClose, onDeleted }: {
  site: Site;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [withBackup, setWithBackup] = useState(true);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (confirm !== site.name) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/super-admin/sites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: site.id, backup: withBackup }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Delete failed"); setDeleting(false); return; }
      toast.success(`"${site.name}" deleted${withBackup && data.backupPath ? " — backup saved" : ""}`);
      onDeleted(site.id);
      onClose();
    } catch {
      toast.error("Network error");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold text-white">Delete Site</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Warning */}
          <div className="bg-red-950/40 border border-red-800 rounded-lg p-3 text-xs text-red-300 space-y-1">
            <p className="font-semibold text-red-400">This action is permanent and cannot be undone.</p>
            <p>All site data — pages, content, media, orders, members, subscriptions — will be deleted.</p>
          </div>

          {/* Backup option */}
          <button
            onClick={() => setWithBackup(v => !v)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
              withBackup
                ? "border-indigo-500 bg-indigo-950/40"
                : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
              withBackup ? "border-indigo-500 bg-indigo-600" : "border-gray-600"
            )}>
              {withBackup && <ShieldCheck className="w-3 h-3 text-white" />}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Create backup before deleting</p>
              <p className="text-xs text-gray-400 mt-0.5">Saves a full JSON/CSV export to storage — can be restored later</p>
            </div>
          </button>

          {/* Confirm name */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">
              Type <span className="font-mono text-gray-200">{site.name}</span> to confirm
            </label>
            <input
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={site.name}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting || confirm !== site.name}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {deleting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
              : <><Trash2 className="w-4 h-4" /> Delete Site</>
            }
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AllSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("tenants")
      .select("id,name,slug,status,custom_domain,domain_status,created_at,onboarding_completed")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => { setSites((data as Site[]) ?? []); setLoading(false); });
  }, []);

  const filtered = sites.filter(s => {
    const matchQ = !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.slug.toLowerCase().includes(q.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchQ && matchStatus;
  });

  return (
    <>
      {deletingSite && (
        <DeleteModal
          site={deletingSite}
          onClose={() => setDeletingSite(null)}
          onDeleted={id => setSites(prev => prev.filter(s => s.id !== id))}
        />
      )}

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-400" /> All Sites
          </h1>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by name or slug…"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                statusFilter === s ? "bg-indigo-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-600")}>
              {s || "All"}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["Site Name", "Domain", "Status", "Onboarded", "Created", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-gray-600 mx-auto" /></td></tr>
              ) : filtered.map(site => (
                <tr key={site.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors group">
                  <td className="px-5 py-3 text-white font-medium">{site.name}</td>
                  <td className="px-5 py-3">
                    {site.custom_domain ? (
                      <a href={`https://${site.custom_domain}`} target="_blank" rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 hover:underline text-sm flex items-center gap-1">
                        {site.custom_domain} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <a href={`https://${site.slug}.passivecoder.com`} target="_blank" rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 hover:underline text-sm flex items-center gap-1">
                        {site.slug}.passivecoder.com <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_COLOR[site.status] ?? "bg-gray-800 text-gray-400")}>
                      {site.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs", site.onboarding_completed ? "text-green-400" : "text-gray-500")}>
                      {site.onboarding_completed ? "Yes" : "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(site.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      <Link href={`/super-admin/sites/${site.id}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        Manage <ExternalLink className="w-3 h-3" />
                      </Link>
                      <button onClick={() => setDeletingSite(site)}
                        className="text-gray-600 hover:text-red-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-600">No sites found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
