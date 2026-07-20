import { createAdminClient } from "@/lib/supabase/server";
import { exportAllJson, jsonToBuffer } from "./json-export";
import { objectsToCsv } from "./csv-export";
import { generatePdfSummary } from "./pdf-export";
import { generateWxr } from "./wxr-export";
import { collectImagePaths } from "./image-export";
import { buildDbZip } from "./db-zip";
import { buildFilesZip } from "./files-zip";
import type { BackupManifest } from "./types";

const BUCKET = "backups";
const DEFAULT_DB_RETENTION = 7;
const DEFAULT_FILES_RETENTION = 2;

export type BackupType = "db" | "files" | "full";

export async function runBackup(tenantId: string, type: BackupType = "full"): Promise<{ runId: string; path: string }> {
  const supabase = await createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("slug, name")
    .eq("id", tenantId)
    .single();
  if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

  const { data: settings } = await supabase
    .from("site_settings")
    .select("site_url, site_name")
    .eq("tenant_id", tenantId)
    .single();

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const basePath = `${tenantId}/${dateStr}-${now.getTime()}`;

  const { data: run } = await supabase
    .from("backup_runs")
    .insert({ tenant_id: tenantId, status: "running", storage_path: basePath, backup_type: type })
    .select("id")
    .single();
  if (!run) throw new Error("Failed to create backup_run record");

  try {
    let sizeBytes = 0;

    if (type === "db" || type === "full") {
      const allData = await exportAllJson(supabase, tenantId);
      const jsonBuf = jsonToBuffer(allData);

      const csv: Record<string, Buffer> = {};
      for (const [table, rows] of Object.entries(allData)) {
        if (!rows.length) continue;
        csv[table] = objectsToCsv(rows as Record<string, unknown>[]);
      }

      const pdfBuf = await generatePdfSummary(tenant.slug, allData, now.toISOString());

      const posts = (allData.posts ?? []) as Parameters<typeof generateWxr>[2];
      const pages = (allData.pages ?? []) as Parameters<typeof generateWxr>[3];
      const siteUrl = settings?.site_url ?? `https://${tenant.slug}.localhost:3000`;
      const siteName = settings?.site_name ?? tenant.name;
      const wxrBuf = generateWxr(siteUrl, siteName, posts, pages);

      const manifest: BackupManifest = {
        tenantId,
        tenantSlug: tenant.slug,
        createdAt: now.toISOString(),
        version: "2.0",
        tables: Object.keys(allData),
        imageCount: 0,
      };
      const manifestBuf = Buffer.from(JSON.stringify(manifest, null, 2));

      const dbZip = await buildDbZip({
        "data.json": jsonBuf,
        "summary.pdf": pdfBuf,
        "wordpress-export.xml": wxrBuf,
        csv,
        "manifest.json": manifestBuf,
      });

      await supabase.storage.from(BUCKET).upload(`${basePath}/db.zip`, dbZip, { contentType: "application/zip", upsert: true });
      sizeBytes += dbZip.byteLength;
    }

    if (type === "files" || type === "full") {
      const images = await collectImagePaths(supabase, tenantId);
      const { buffer: filesZip } = await buildFilesZip(images);
      await supabase.storage.from(BUCKET).upload(`${basePath}/files.zip`, filesZip, { contentType: "application/zip", upsert: true });
      sizeBytes += filesZip.byteLength;
    }

    await supabase
      .from("backup_runs")
      .update({ status: "complete", completed_at: now.toISOString(), size_bytes: sizeBytes })
      .eq("id", run.id);

    await rotateOldBackups(tenantId);

    return { runId: run.id, path: basePath };
  } catch (err) {
    await supabase
      .from("backup_runs")
      .update({ status: "failed", error: String(err) })
      .eq("id", run.id);
    throw err;
  }
}

async function rotateOldBackups(tenantId: string): Promise<void> {
  const supabase = await createAdminClient();

  const { data: settings } = await supabase
    .from("backup_settings")
    .select("db_retention_count, files_retention_count")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const dbRetention = settings?.db_retention_count ?? DEFAULT_DB_RETENTION;
  const filesRetention = settings?.files_retention_count ?? DEFAULT_FILES_RETENTION;

  for (const [backupType, retention] of [["db", dbRetention], ["files", filesRetention], ["full", dbRetention]] as const) {
    const { data: runs } = await supabase
      .from("backup_runs")
      .select("id, storage_path, created_at")
      .eq("tenant_id", tenantId)
      .eq("backup_type", backupType)
      .eq("status", "complete")
      .order("created_at", { ascending: false });

    if (!runs || runs.length <= retention) continue;

    const toDelete = runs.slice(retention);
    for (const run of toDelete) {
      const { data: files } = await supabase.storage.from(BUCKET).list(run.storage_path);
      if (files?.length) {
        await supabase.storage.from(BUCKET).remove(files.map((f) => `${run.storage_path}/${f.name}`));
      }
      await supabase.from("backup_runs").delete().eq("id", run.id);
    }
  }
}
