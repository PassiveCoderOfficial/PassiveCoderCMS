import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import BackupsClient from "./backups-client";

export const metadata = { title: "Backups" };

export default async function BackupsPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createAdminClient();

  const [{ data: runs }, { data: settings }] = await Promise.all([
    supabase
      .from("backup_runs")
      .select("id,status,storage_path,created_at,completed_at,error,backup_type,size_bytes")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("backup_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  return (
    <BackupsClient
      runs={(runs ?? []) as BackupRun[]}
      tenantId={tenantId}
      initialSettings={settings as BackupSettings | null}
    />
  );
}

export interface BackupRun {
  id: string;
  status: "running" | "complete" | "failed";
  storage_path: string;
  created_at: string;
  completed_at?: string;
  error?: string;
  backup_type: "db" | "files" | "full";
  size_bytes?: number | null;
}

export interface BackupSettings {
  db_enabled: boolean;
  db_frequency: "daily" | "weekly" | "monthly";
  db_retention_count: number;
  files_enabled: boolean;
  files_frequency: "daily" | "weekly" | "monthly";
  files_retention_count: number;
}
