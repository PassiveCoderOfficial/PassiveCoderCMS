import { createAdminClient } from "@/lib/supabase/server";
import { exportAllJson, jsonToBuffer } from "./json-export";
import { objectsToCsv } from "./csv-export";
import { generatePdfSummary } from "./pdf-export";
import { generateWxr } from "./wxr-export";
import { collectImagePaths, buildImageManifest } from "./image-export";
import type { BackupManifest } from "./types";

const BUCKET = "backups";
const KEEP_DAYS = 7;

export async function runBackup(tenantId: string): Promise<{ runId: string; path: string }> {
  const supabase = await createAdminClient();

  // Get tenant info
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
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const basePath = `${tenantId}/${dateStr}`;

  // Insert run record
  const { data: run } = await supabase
    .from("backup_runs")
    .insert({
      tenant_id: tenantId,
      status: "running",
      storage_path: basePath,
    })
    .select("id")
    .single();
  if (!run) throw new Error("Failed to create backup_run record");

  try {
    // Export all table data as JSON
    const allData = await exportAllJson(supabase, tenantId);

    // Upload JSON
    const jsonBuf = jsonToBuffer(allData);
    await supabase.storage
      .from(BUCKET)
      .upload(`${basePath}/data.json`, jsonBuf, { contentType: "application/json", upsert: true });

    // Upload CSV per table
    for (const [table, rows] of Object.entries(allData)) {
      if (!rows.length) continue;
      const csvBuf = objectsToCsv(rows as Record<string, unknown>[]);
      await supabase.storage
        .from(BUCKET)
        .upload(`${basePath}/csv/${table}.csv`, csvBuf, { contentType: "text/csv", upsert: true });
    }

    // Upload PDF summary
    const pdfBuf = await generatePdfSummary(tenant.slug, allData, now.toISOString());
    await supabase.storage
      .from(BUCKET)
      .upload(`${basePath}/summary.pdf`, pdfBuf, { contentType: "application/pdf", upsert: true });

    // WordPress WXR export
    const posts = (allData.posts ?? []) as Parameters<typeof generateWxr>[2];
    const pages = (allData.pages ?? []) as Parameters<typeof generateWxr>[3];
    const siteUrl = settings?.site_url ?? `https://${tenant.slug}.localhost:3000`;
    const siteName = settings?.site_name ?? tenant.name;
    const wxrBuf = generateWxr(siteUrl, siteName, posts, pages);
    await supabase.storage
      .from(BUCKET)
      .upload(`${basePath}/wordpress-export.xml`, wxrBuf, { contentType: "application/xml", upsert: true });

    // Image manifest (download URLs, organized by folder)
    const images = await collectImagePaths(supabase, tenantId);
    const manifestBuf = buildImageManifest(images);
    await supabase.storage
      .from(BUCKET)
      .upload(`${basePath}/images/manifest.tsv`, manifestBuf, { contentType: "text/plain", upsert: true });

    // Upload backup manifest
    const manifest: BackupManifest = {
      tenantId,
      tenantSlug: tenant.slug,
      createdAt: now.toISOString(),
      version: "1.0",
      tables: Object.keys(allData),
      imageCount: images.length,
    };
    await supabase.storage
      .from(BUCKET)
      .upload(`${basePath}/manifest.json`, Buffer.from(JSON.stringify(manifest, null, 2)), {
        contentType: "application/json",
        upsert: true,
      });

    // Mark complete
    await supabase
      .from("backup_runs")
      .update({ status: "complete", completed_at: now.toISOString() })
      .eq("id", run.id);

    // Rotate: delete runs older than KEEP_DAYS
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

  const { data: runs } = await supabase
    .from("backup_runs")
    .select("id, storage_path, created_at")
    .eq("tenant_id", tenantId)
    .eq("status", "complete")
    .order("created_at", { ascending: false });

  if (!runs || runs.length <= KEEP_DAYS) return;

  const toDelete = runs.slice(KEEP_DAYS);
  for (const run of toDelete) {
    // List and remove all files under the storage path
    const { data: files } = await supabase.storage.from(BUCKET).list(run.storage_path);
    if (files?.length) {
      await supabase.storage
        .from(BUCKET)
        .remove(files.map((f) => `${run.storage_path}/${f.name}`));
    }
    await supabase.from("backup_runs").delete().eq("id", run.id);
  }
}
