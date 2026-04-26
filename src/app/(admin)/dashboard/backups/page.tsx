import { createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import BackupsClient from "./backups-client";

export const metadata = { title: "Backups" };

export default async function BackupsPage() {
  const supabase = await createAdminClient();
  const hdrs = await headers();
  const tenantId = hdrs.get("x-tenant-id");

  let runs: BackupRun[] = [];
  if (tenantId) {
    const { data } = await supabase
      .from("backup_runs")
      .select("id,status,storage_path,created_at,completed_at,error")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(7);
    runs = (data ?? []) as BackupRun[];
  }

  return <BackupsClient runs={runs} tenantId={tenantId ?? ""} />;
}

export interface BackupRun {
  id: string;
  status: "running" | "complete" | "failed";
  storage_path: string;
  created_at: string;
  completed_at?: string;
  error?: string;
}
