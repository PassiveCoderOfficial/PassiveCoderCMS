"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Archive,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  FileJson,
  FileSpreadsheet,
  Globe,
  Image,
  Clock,
} from "lucide-react";
import type { BackupRun } from "./page";

interface Props {
  runs: BackupRun[];
  tenantId: string;
}

const BACKUP_FILES = [
  { file: "data.json", label: "Full JSON Export", icon: FileJson, desc: "All site data as JSON" },
  { file: "summary.pdf", label: "PDF Summary", icon: FileText, desc: "Human-readable summary report" },
  { file: "wordpress-export.xml", label: "WordPress WXR", icon: Globe, desc: "Import into any WordPress site" },
  { file: "csv/posts.csv", label: "Posts CSV", icon: FileSpreadsheet, desc: "Posts data as spreadsheet" },
  { file: "csv/pages.csv", label: "Pages CSV", icon: FileSpreadsheet, desc: "Pages data as spreadsheet" },
  { file: "csv/products.csv", label: "Products CSV", icon: FileSpreadsheet, desc: "Product catalog as spreadsheet" },
  { file: "images/manifest.tsv", label: "Image Manifest", icon: Image, desc: "All image URLs organized by section" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: BackupRun["status"] }) {
  if (status === "complete") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
  if (status === "failed") return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
  return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
}

export default function BackupsClient({ runs: initialRuns, tenantId }: Props) {
  const [runs, setRuns] = useState<BackupRun[]>(initialRuns);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(initialRuns[0]?.id ?? null);
  const [error, setError] = useState("");

  async function triggerBackup() {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/backup/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Backup failed");

      // Refresh list
      const listRes = await fetch(`/api/backup/list?tenantId=${tenantId}`);
      const listData = await listRes.json();
      setRuns(listData.runs ?? []);
      setExpanded(listData.runs?.[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  }

  function downloadUrl(storagePath: string, file: string) {
    return `/api/backup/download?path=${encodeURIComponent(`${storagePath}/${file}`)}`;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Archive className="w-6 h-6" /> Backups
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            7 daily backups kept automatically. Each set includes JSON, CSV, PDF, WordPress export, and image manifest.
          </p>
        </div>
        <Button onClick={triggerBackup} disabled={running}>
          {running ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running…</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" />Run Now</>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold">{runs.filter(r => r.status === "complete").length}</div>
            <div className="text-sm text-muted-foreground">Successful backups</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold">7</div>
            <div className="text-sm text-muted-foreground">Days retained</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold flex items-center gap-1">
              <Clock className="w-5 h-5 text-muted-foreground" /> 2:00 AM
            </div>
            <div className="text-sm text-muted-foreground">Daily at UTC</div>
          </CardContent>
        </Card>
      </div>

      {/* Backup list */}
      {runs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Archive className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">No backups yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Run Now" to create your first backup, or wait for the daily automated backup.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <Card key={run.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer py-4 hover:bg-muted/40 transition-colors"
                onClick={() => setExpanded(expanded === run.id ? null : run.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={run.status} />
                    <span className="font-medium">{formatDate(run.created_at)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {expanded === run.id ? "▲ Hide files" : "▼ Show files"}
                  </span>
                </div>
                {run.error && (
                  <p className="text-xs text-destructive mt-1">{run.error}</p>
                )}
              </CardHeader>

              {expanded === run.id && run.status === "complete" && (
                <CardContent className="pt-0 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BACKUP_FILES.map(({ file, label, icon: Icon, desc }) => (
                      <a
                        key={file}
                        href={downloadUrl(run.storage_path, file)}
                        className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
                      >
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{label}</div>
                          <div className="text-xs text-muted-foreground truncate">{desc}</div>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Schedule info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Backup Schedule</CardTitle>
          <CardDescription>
            Backups run automatically every day at 2:00 AM UTC via a Supabase Edge Function cron job.
            Only the 7 most recent successful backups are kept — older ones are deleted automatically.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
