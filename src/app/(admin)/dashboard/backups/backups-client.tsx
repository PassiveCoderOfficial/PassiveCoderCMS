"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Archive, Download, RefreshCw, CheckCircle, XCircle, Loader2,
  Database, FolderArchive, PackageCheck, Settings2,
} from "lucide-react";
import type { BackupRun, BackupSettings } from "./page";

interface Props {
  runs: BackupRun[];
  tenantId: string;
  initialSettings: BackupSettings | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function formatSize(bytes?: number | null) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${mb.toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: BackupRun["status"] }) {
  if (status === "complete") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
  if (status === "failed") return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
  return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
}

function TypeBadge({ type }: { type: BackupRun["backup_type"] }) {
  if (type === "db") return <Badge variant="outline" className="gap-1"><Database className="w-3 h-3" />Database</Badge>;
  if (type === "files") return <Badge variant="outline" className="gap-1"><FolderArchive className="w-3 h-3" />Files</Badge>;
  return <Badge variant="outline" className="gap-1"><PackageCheck className="w-3 h-3" />Full</Badge>;
}

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly (Sundays)" },
  { value: "monthly", label: "Monthly (1st)" },
];

function BackupTypeConfigCard({
  title, icon: Icon, enabled, frequency, retention, retentionMax, onSave,
}: {
  title: string;
  icon: React.ElementType;
  enabled: boolean;
  frequency: string;
  retention: number;
  retentionMax: number;
  onSave: (v: { enabled: boolean; frequency: string; retention: number }) => Promise<void>;
}) {
  const [localEnabled, setLocalEnabled] = useState(enabled);
  const [localFreq, setLocalFreq] = useState(frequency);
  const [localRetention, setLocalRetention] = useState(retention);
  const [saving, setSaving] = useState(false);

  const dirty = localEnabled !== enabled || localFreq !== frequency || localRetention !== retention;

  async function save() {
    setSaving(true);
    try {
      await onSave({ enabled: localEnabled, frequency: localFreq, retention: localRetention });
      toast.success(`${title} backup settings saved`);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2"><Icon className="w-4 h-4" /> {title} Backups</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Auto backup enabled</span>
          <Switch checked={localEnabled} onCheckedChange={setLocalEnabled} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Frequency</label>
          <Select value={localFreq} onValueChange={setLocalFreq} disabled={!localEnabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Keep last N backups</label>
          <Select value={String(localRetention)} onValueChange={(v) => setLocalRetention(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: retentionMax }, (_, i) => i + 1).map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {dirty && (
          <Button size="sm" onClick={save} disabled={saving} className="w-full">
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Save
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function BackupsClient({ runs: initialRuns, tenantId, initialSettings }: Props) {
  const [runs, setRuns] = useState<BackupRun[]>(initialRuns);
  const [settings, setSettings] = useState<BackupSettings>(initialSettings ?? {
    db_enabled: true, db_frequency: "daily", db_retention_count: 7,
    files_enabled: true, files_frequency: "weekly", files_retention_count: 2,
  });
  const [running, setRunning] = useState<"db" | "files" | "full" | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState("");

  async function refreshRuns() {
    const listRes = await fetch(`/api/backup/list?tenantId=${tenantId}`);
    const listData = await listRes.json();
    setRuns(listData.runs ?? []);
  }

  async function triggerBackup(type: "db" | "files" | "full") {
    setRunning(type);
    setError("");
    try {
      const res = await fetch("/api/backup/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Backup failed");
      await refreshRuns();
      toast.success(`${type === "db" ? "Database" : type === "files" ? "Files" : "Full"} backup complete`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toast.error(msg);
    } finally {
      setRunning(null);
    }
  }

  async function saveTypeSettings(prefix: "db" | "files", v: { enabled: boolean; frequency: string; retention: number }) {
    const payload = {
      [`${prefix}_enabled`]: v.enabled,
      [`${prefix}_frequency`]: v.frequency,
      [`${prefix}_retention_count`]: v.retention,
    };
    const res = await fetch("/api/backup/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed");
    setSettings(s => ({ ...s, ...payload } as BackupSettings));
  }

  function downloadUrl(storagePath: string, file: string) {
    return `/api/backup/download?path=${encodeURIComponent(`${storagePath}/${file}`)}`;
  }

  const dbRuns = runs.filter(r => r.status === "complete" && (r.backup_type === "db" || r.backup_type === "full"));
  const filesRuns = runs.filter(r => r.status === "complete" && (r.backup_type === "files" || r.backup_type === "full"));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Archive className="w-6 h-6" /> Backups
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Database and media files are backed up separately, each on their own schedule.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(v => !v)}>
            <Settings2 className="w-4 h-4 mr-1.5" /> Configure
          </Button>
          <Button size="sm" onClick={() => triggerBackup("db")} disabled={running !== null}>
            {running === "db" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Database className="w-4 h-4 mr-1.5" />}
            Backup DB Now
          </Button>
          <Button size="sm" onClick={() => triggerBackup("files")} disabled={running !== null}>
            {running === "files" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FolderArchive className="w-4 h-4 mr-1.5" />}
            Backup Files Now
          </Button>
          <Button size="sm" variant="secondary" onClick={() => triggerBackup("full")} disabled={running !== null}>
            {running === "full" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            Full Backup Now
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Config cards */}
      {showSettings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BackupTypeConfigCard
            title="Database" icon={Database}
            enabled={settings.db_enabled} frequency={settings.db_frequency} retention={settings.db_retention_count}
            retentionMax={30}
            onSave={(v) => saveTypeSettings("db", v)}
          />
          <BackupTypeConfigCard
            title="Files" icon={FolderArchive}
            enabled={settings.files_enabled} frequency={settings.files_frequency} retention={settings.files_retention_count}
            retentionMax={10}
            onSave={(v) => saveTypeSettings("files", v)}
          />
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold">{dbRuns.length}</div>
            <div className="text-sm text-muted-foreground">
              DB backups kept ({settings.db_enabled ? settings.db_frequency : "auto off"})
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold">{filesRuns.length}</div>
            <div className="text-sm text-muted-foreground">
              Files backups kept ({settings.files_enabled ? settings.files_frequency : "auto off"})
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup list */}
      {runs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Archive className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">No backups yet</p>
            <p className="text-sm text-muted-foreground mt-1">Run a manual backup above, or wait for the next scheduled one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <Card key={run.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <StatusBadge status={run.status} />
                    <TypeBadge type={run.backup_type} />
                    <span className="text-sm font-medium">{formatDate(run.created_at)}</span>
                    <span className="text-xs text-muted-foreground">{formatSize(run.size_bytes)}</span>
                  </div>
                  {run.status === "complete" && (
                    <div className="flex items-center gap-2">
                      {(run.backup_type === "db" || run.backup_type === "full") && (
                        <a href={downloadUrl(run.storage_path, "db.zip")}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <Download className="w-3.5 h-3.5" /> DB
                          </Button>
                        </a>
                      )}
                      {(run.backup_type === "files" || run.backup_type === "full") && (
                        <a href={downloadUrl(run.storage_path, "files.zip")}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <Download className="w-3.5 h-3.5" /> Files
                          </Button>
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {run.error && <p className="text-xs text-destructive mt-1">{run.error}</p>}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How this works</CardTitle>
          <CardDescription>
            Database backups bundle all your content (pages, posts, products, orders, settings) as JSON/CSV/PDF/WordPress-export into one zip.
            Files backups bundle your actual media library (images, uploads) into a separate zip. Each type runs on its own schedule and
            retention — configure above. Manual backups can be run any time regardless of schedule.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
