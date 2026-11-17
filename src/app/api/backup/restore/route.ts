import { NextResponse } from "next/server";
import JSZip from "jszip";
import { createAdminClient } from "@/lib/supabase/server";
import { apiUser } from "@/lib/auth/api-caller";
import { runBackup } from "@/lib/backup/runner";
import { parseBackupData, restoreBackupData, type RestoreDb } from "@/lib/backup/restore";
import { startAdminAudit, finishAdminAudit } from "@/lib/mcp/admin-scope";

export const maxDuration = 300;

const BUCKET = "backups";
const UUID = /^[0-9a-f-]{36}$/i;

/**
 * POST { tenantId, backupId, confirm } — restore a site's content from one of
 * its backups (web cookie session or mobile Bearer). Owners/admins of the
 * site or super admins only; `confirm` must be the site's name.
 *
 * Order: read the chosen backup first (so rotation can't remove it), make an
 * automatic "before restore" backup, then restore (src/lib/backup/restore.ts)
 * and log to admin_audit_log.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { tenantId?: string; backupId?: string; confirm?: string };
  const { tenantId, backupId } = body;
  if (!tenantId || !backupId || !UUID.test(tenantId) || !UUID.test(backupId)) {
    return NextResponse.json({ error: "Missing site or backup" }, { status: 400 });
  }

  const user = await apiUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const [{ data: member }, { data: sa }, { data: tenant }] = await Promise.all([
    admin.from("tenant_members").select("role").eq("tenant_id", tenantId).eq("user_id", user.id).maybeSingle(),
    admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    admin.from("tenants").select("name").eq("id", tenantId).maybeSingle(),
  ]);
  const allowed = (!!member && ["owner", "admin"].includes(member.role as string)) || !!sa;
  if (!allowed) return NextResponse.json({ error: "Only site owners and admins can restore a backup." }, { status: 403 });
  if (!tenant) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();
  if (norm(body.confirm) !== norm(tenant.name)) {
    return NextResponse.json({ error: "Type the site name exactly to confirm." }, { status: 400 });
  }

  const { data: run } = await admin
    .from("backup_runs")
    .select("id, status, storage_path, backup_type, created_at")
    .eq("id", backupId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!run || run.status !== "complete" || !run.storage_path) {
    return NextResponse.json({ error: "That backup is not available." }, { status: 404 });
  }
  if (run.backup_type === "files") {
    return NextResponse.json({ error: "This backup holds files only. Choose a content or full backup to restore." }, { status: 400 });
  }

  // 1. Read the backup before anything else.
  let data: ReturnType<typeof parseBackupData>;
  try {
    const { data: blob, error } = await admin.storage.from(BUCKET).download(`${run.storage_path}/db.zip`);
    if (error || !blob) throw new Error("The backup file could not be found.");
    const zip = await JSZip.loadAsync(Buffer.from(await blob.arrayBuffer()));
    const file = zip.file("data.json");
    if (!file) throw new Error("The backup file is not a site backup.");
    data = parseBackupData(await file.async("string"));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "The backup could not be read." }, { status: 422 });
  }

  const via = req.headers.get("authorization")?.toLowerCase().startsWith("bearer ") ? "app" : "web";
  let auditId: string;
  try {
    auditId = await startAdminAudit(admin, {
      actorUserId: user.id, action: "backup.restore", tenantId, via,
      args: { backupId, backupDate: run.created_at },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Audit log unavailable" }, { status: 500 });
  }

  // 2. Safety net: an automatic backup of the site as it is now.
  let safety: { runId: string };
  try {
    safety = await runBackup(tenantId, "db");
  } catch (e) {
    const msg = `Could not make the safety backup, nothing was changed (${e instanceof Error ? e.message : String(e)})`;
    await finishAdminAudit(admin, auditId, false, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // 3. Restore.
  const db: RestoreDb = {
    async listIds(table, tid) {
      const ids: string[] = [];
      for (let from = 0; ; from += 1000) {
        const { data: rows, error } = await admin.from(table).select("id").eq("tenant_id", tid).range(from, from + 999);
        if (error) throw new Error(error.message);
        ids.push(...(rows ?? []).map((r) => String((r as { id: unknown }).id)));
        if (!rows || rows.length < 1000) return ids;
      }
    },
    async upsert(table, rows, opts) {
      const { error } = await admin.from(table).upsert(rows, opts);
      if (error) throw new Error(error.message);
    },
    async deleteIds(table, tid, ids) {
      const { error } = await admin.from(table).delete().eq("tenant_id", tid).in("id", ids);
      if (error) throw new Error(error.message);
    },
  };
  const result = await restoreBackupData(db, tenantId, data);
  const failed = result.tables.filter((t) => t.error);
  await finishAdminAudit(admin, auditId, result.ok, failed.length ? failed.map((t) => `${t.table}: ${t.error}`).join("; ").slice(0, 1000) : null);

  return NextResponse.json({
    ok: result.ok,
    safetyBackupId: safety.runId,
    restored: result.tables.reduce((n, t) => n + t.restored, 0),
    removed: result.tables.reduce((n, t) => n + t.removed, 0),
    failedParts: failed.length,
  }, { status: result.ok ? 200 : 207 });
}
