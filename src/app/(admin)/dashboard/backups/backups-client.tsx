"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Archive, Download, CheckCircle2, Loader2, RotateCcw, ShieldCheck, Images } from "lucide-react";
import type { BackupRun } from "./page";
import { useT } from "@/lib/i18n/language-provider";

interface Props {
  runs: BackupRun[];
  tenantId: string;
  siteName: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatSize(bytes?: number | null) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${mb.toFixed(1)} MB`;
}

const hasData = (r: BackupRun) => r.backup_type === "db" || r.backup_type === "full";
const hasFiles = (r: BackupRun) => r.backup_type === "files" || r.backup_type === "full";
/** A run still "running" after 30 minutes was cut off (function time limit). */
const stuck = (r: BackupRun) => r.status === "running" && Date.now() - new Date(r.created_at).getTime() > 30 * 60_000;

/**
 * One plain screen: when the last backup was made, Back up now, Download,
 * and the saved copies with Download and Restore. Downloads go straight to
 * storage through a short-lived link, so large files work.
 */
export default function BackupsClient({ runs: initialRuns, tenantId, siteName }: Props) {
  const t = useT();
  const [runs, setRuns] = useState<BackupRun[]>(initialRuns);
  const [running, setRunning] = useState<"db" | "full" | null>(null);
  const [restoreRun, setRestoreRun] = useState<BackupRun | null>(null);
  const [restoreName, setRestoreName] = useState("");
  const [restoring, setRestoring] = useState(false);
  const nameOk = restoreName.trim().toLowerCase() === siteName.trim().toLowerCase() && siteName.trim() !== "";

  const visible = runs.filter((r) => r.status === "complete" || (r.status === "running" && !stuck(r)));
  const latest = visible.find((r) => r.status === "complete");

  async function refreshRuns() {
    const res = await fetch(`/api/backup/list?tenantId=${tenantId}`);
    const j = await res.json().catch(() => ({}));
    if (res.ok) setRuns(j.runs ?? []);
  }

  async function backUp(type: "db" | "full") {
    setRunning(type);
    try {
      const res = await fetch("/api/backup/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId, type }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? t("backups.backupFailed"));
      await refreshRuns();
      toast.success(t("backups.backupComplete", { type: type === "db" ? t("backups.kindData") : t("backups.kindFull") }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("backups.unknownError"));
      await refreshRuns();
    } finally {
      setRunning(null);
    }
  }

  async function doRestore() {
    if (!restoreRun || !nameOk) return;
    setRestoring(true);
    try {
      const res = await fetch("/api/backup/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId, backupId: restoreRun.id, confirm: restoreName }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 207) throw new Error(j.error ?? t("backups.failed"));
      toast.success(j.ok ? t("backups.restoreDone") : t("backups.restorePartial"));
      setRestoreRun(null);
      setRestoreName("");
      await refreshRuns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("backups.unknownError"));
    } finally {
      setRestoring(false);
    }
  }

  const fileUrl = (r: BackupRun, file: "db.zip" | "files.zip") => `/api/backup/download?path=${encodeURIComponent(`${r.storage_path}/${file}`)}`;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Archive className="w-6 h-6" /> {t("backups.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("backups.simpleSubtitle")}</p>
      </div>

      {/* Status + main actions */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className={`w-8 h-8 shrink-0 ${latest ? "text-green-600" : "text-muted-foreground"}`} />
            <div>
              <div className="text-sm text-muted-foreground">{t("backups.lastBackup")}</div>
              {latest ? (
                <div className="font-semibold">
                  {formatDate(latest.created_at)}
                  <span className="font-normal text-muted-foreground"> · {hasFiles(latest) ? t("backups.kindFull") : t("backups.kindData")}{latest.size_bytes ? ` · ${formatSize(latest.size_bytes)}` : ""}</span>
                </div>
              ) : (
                <div className="font-medium">{t("backups.never")}</div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => backUp("db")} disabled={running !== null}>
              {running === "db" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              {t("backups.backUpNow")}
            </Button>
            {latest && hasData(latest) && (
              <a href={fileUrl(latest, "db.zip")}>
                <Button variant="outline"><Download className="w-4 h-4 mr-1.5" />{t("backups.downloadLatest")}</Button>
              </a>
            )}
            <Button variant="ghost" onClick={() => backUp("full")} disabled={running !== null}>
              {running === "full" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Images className="w-4 h-4 mr-1.5" />}
              {t("backups.backUpWithFiles")}
            </Button>
          </div>
          {running && <p className="text-sm text-muted-foreground">{t("backups.working")}</p>}
        </CardContent>
      </Card>

      {/* Saved copies */}
      {visible.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("backups.savedCopies")}</h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {visible.map((r) => (
                <div key={r.id} className="flex items-center justify-between flex-wrap gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{formatDate(r.created_at)}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.backup_type === "files" ? t("backups.kindFiles") : hasFiles(r) ? t("backups.kindFull") : t("backups.kindData")}
                      {r.size_bytes ? ` · ${formatSize(r.size_bytes)}` : ""}
                    </div>
                  </div>
                  {r.status === "running" ? (
                    <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />{t("backups.statusRunning")}</Badge>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {hasData(r) && (
                        <a href={fileUrl(r, "db.zip")}><Button size="sm" variant="outline"><Download className="w-3.5 h-3.5 mr-1" />{t("backups.downloadData")}</Button></a>
                      )}
                      {hasFiles(r) && (
                        <a href={fileUrl(r, "files.zip")}><Button size="sm" variant="outline"><Download className="w-3.5 h-3.5 mr-1" />{t("backups.downloadFiles")}</Button></a>
                      )}
                      {hasData(r) && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setRestoreName(""); setRestoreRun(r); }}>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />{t("backups.restore")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("backups.simpleHow")}</p>

      <Dialog open={!!restoreRun} onOpenChange={(o) => { if (!o && !restoring) setRestoreRun(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("backups.restoreTitle")}</DialogTitle>
            <DialogDescription>{restoreRun ? t("backups.restoreDesc", { date: formatDate(restoreRun.created_at) }) : ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm" htmlFor="restore-confirm">{t("backups.restoreTypeName", { name: siteName })}</label>
            <Input id="restore-confirm" value={restoreName} onChange={(e) => setRestoreName(e.target.value)} autoComplete="off" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreRun(null)} disabled={restoring}>{t("backups.cancel")}</Button>
            <Button variant="destructive" onClick={() => void doRestore()} disabled={!nameOk || restoring}>
              {restoring && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {restoring ? t("backups.restoring") : t("backups.restoreConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
