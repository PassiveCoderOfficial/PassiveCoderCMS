"use client";

import { useEffect, useState } from "react";
import { Globe, ExternalLink, Search, Trash2, Loader2, AlertTriangle, X, Mail, Phone, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SiteDeleteModal } from "@/components/admin/site-delete-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
      <Card className="w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <span className="font-semibold">{site.name}</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <CardContent className="p-5 space-y-3">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {contact?.owner_name && (
                <p className="text-sm">{contact.owner_name}</p>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {contact?.owner_email
                  ? <a href={`mailto:${contact.owner_email}`} className="text-primary hover:underline">{contact.owner_email}</a>
                  : <span className="text-muted-foreground">No owner email on file</span>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {contact?.site_phone
                  ? <a href={`tel:${contact.site_phone}`} className="text-primary hover:underline">{contact.site_phone}</a>
                  : <span className="text-muted-foreground">No phone on file</span>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {contact?.site_whatsapp
                  ? <a href={`https://wa.me/${contact.site_whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{contact.site_whatsapp}</a>
                  : <span className="text-muted-foreground">No WhatsApp on file</span>}
              </div>
              {site.deletion_requested_at && (
                <div className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Deletion requested
                  </p>
                  <p>Requested {new Date(site.deletion_requested_at).toLocaleString()}. Contact the owner above before proceeding.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
        <div className="px-5 pb-5">
          <Button variant="secondary" className="w-full" asChild>
            <Link href={`/super-admin/sites/${site.id}`}>Manage Site</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

const STATUSES = ["", "onboarded", "active", "suspended", "cancelled", "enm_pending"];

function statusVariant(status: string) {
  if (status === "active") return "success" as const;
  if (status === "onboarded") return "info" as const;
  if (status === "suspended" || status === "cancelled") return "destructive" as const;
  if (status === "enm_pending") return "warning" as const;
  return "secondary" as const;
}

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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-500" /> All Sites
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by name or slug…"
              className="pl-9"
            />
          </div>
          {STATUSES.map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
              {s || "All"}
            </Button>
          ))}
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Site Name</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell">Domain</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Onboarded</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Created</th>
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" /></td></tr>
              ) : filtered.map(site => (
                <tr key={site.id} className={cn(
                  "border-b last:border-0 hover:bg-accent/50 transition-colors group",
                  site.deletion_requested_at && "bg-amber-500/10 hover:bg-amber-500/15",
                )}>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setContactSite(site)}
                      className="font-medium hover:text-primary hover:underline text-left flex items-center gap-1.5"
                      title="View contact info"
                    >
                      {site.deletion_requested_at && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      {site.name}
                    </button>
                    {site.deletion_requested_at && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Deletion requested</p>
                    )}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {site.custom_domain ? (
                      <a href={`https://${site.custom_domain}`} target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-1">
                        {site.custom_domain} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <a href={`https://${site.slug}.passivecoder.com`} target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-1">
                        {site.slug}.passivecoder.com <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant(site.status)}>{site.status}</Badge>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className={cn("text-xs", site.onboarding_completed ? "text-green-500" : "text-muted-foreground")}>
                      {site.onboarding_completed ? "Yes" : "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs hidden lg:table-cell">{new Date(site.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      <Link href={`/super-admin/sites/${site.id}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1">
                        Manage <ExternalLink className="w-3 h-3" />
                      </Link>
                      <button onClick={() => setDeletingSite(site)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No sites found</td></tr>
              )}
            </tbody>
          </table>
          </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
