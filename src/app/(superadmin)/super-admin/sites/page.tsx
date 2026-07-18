"use client";

import { useEffect, useState } from "react";
import { Globe, ExternalLink, Search, Trash2, Loader2, AlertTriangle, X, Mail, Phone, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SiteDeleteModal } from "@/components/admin/site-delete-modal";

interface Site {
  id: string;
  name: string;
  slug: string;
  status: string;
  custom_domain: string | null;
  domain_status: string | null;
  created_at: string;
  onboarding_completed: boolean;
  deletion_requested_at: string | null;
  owner_id: string | null;
}

interface ContactInfo {
  owner_name: string | null;
  owner_email: string | null;
  site_phone: string | null;
  site_whatsapp: string | null;
  site_email: string | null;
}

function ContactModal({ site, onClose }: { site: Site; onClose: () => void }) {
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/super-admin/sites/${site.id}/contact`)
      .then(r => r.json())
      .then(d => { setContact(d); setLoading(false); });
  }, [site.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <span className="font-semibold text-white">{site.name}</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-600" /></div>
          ) : (
            <>
              {contact?.owner_name && (
                <p className="text-sm text-gray-300">{contact.owner_name}</p>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                {contact?.owner_email
                  ? <a href={`mailto:${contact.owner_email}`} className="text-indigo-400 hover:underline">{contact.owner_email}</a>
                  : <span className="text-gray-600">No owner email on file</span>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                {contact?.site_phone
                  ? <a href={`tel:${contact.site_phone}`} className="text-indigo-400 hover:underline">{contact.site_phone}</a>
                  : <span className="text-gray-600">No phone on file</span>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                {contact?.site_whatsapp
                  ? <a href={`https://wa.me/${contact.site_whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{contact.site_whatsapp}</a>
                  : <span className="text-gray-600">No WhatsApp on file</span>}
              </div>
              {site.deletion_requested_at && (
                <div className="mt-2 bg-amber-950/40 border border-amber-800 rounded-lg p-3 text-xs text-amber-300">
                  <p className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Deletion requested
                  </p>
                  <p>Requested {new Date(site.deletion_requested_at).toLocaleString()}. Contact the owner above before proceeding.</p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="px-5 pb-5">
          <Link href={`/super-admin/sites/${site.id}`}
            className="block text-center bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg py-2 transition-colors">
            Manage Site
          </Link>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-900/50 text-green-400",
  onboarded: "bg-blue-900/50 text-blue-400",
  suspended: "bg-red-900/50 text-red-400",
  cancelled: "bg-gray-800 text-gray-500",
  enm_pending: "bg-orange-900/50 text-orange-400",
};

const STATUSES = ["", "onboarded", "active", "suspended", "cancelled", "enm_pending"];

export default function AllSitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);
  const [contactSite, setContactSite] = useState<Site | null>(null);

  useEffect(() => {
    fetch("/api/super-admin/sites")
      .then(r => r.json())
      .then(({ sites }) => { setSites((sites as Site[]) ?? []); setLoading(false); });
  }, []);

  const filtered = sites.filter(s => {
    const matchQ = !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.slug.toLowerCase().includes(q.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchQ && matchStatus;
  });

  return (
    <>
      {deletingSite && (
        <SiteDeleteModal
          site={deletingSite}
          onClose={() => setDeletingSite(null)}
          onDeleted={id => setSites(prev => prev.filter(s => s.id !== id))}
        />
      )}
      {contactSite && <ContactModal site={contactSite} onClose={() => setContactSite(null)} />}

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
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
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
                <tr key={site.id} className={cn(
                  "border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors group",
                  site.deletion_requested_at && "bg-amber-950/20 hover:bg-amber-950/30",
                )}>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setContactSite(site)}
                      className="text-white font-medium hover:text-indigo-400 hover:underline text-left flex items-center gap-1.5"
                      title="View contact info"
                    >
                      {site.deletion_requested_at && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {site.name}
                    </button>
                    {site.deletion_requested_at && (
                      <p className="text-[10px] text-amber-400 mt-0.5">Deletion requested</p>
                    )}
                  </td>
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
      </div>
    </>
  );
}
