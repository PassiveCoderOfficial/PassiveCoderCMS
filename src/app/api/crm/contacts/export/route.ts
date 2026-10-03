import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/** All CRM contacts for the current site as a CSV download (opens in Excel / Google Sheets). */
export async function GET() {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("contacts")
    .select("first_name, last_name, email, phone, company, source, tags, created_at, last_activity_at, crm_stages(name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(20000);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const cell = (v: unknown) => {
    let s = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s; // no spreadsheet formula injection
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = ["First name", "Last name", "Email", "Phone", "Company", "Stage", "Source", "Tags", "Created", "Last activity"];
  const rows = (data ?? []).map((c) => {
    const stage = (Array.isArray(c.crm_stages) ? c.crm_stages[0] : c.crm_stages) as { name?: string } | null;
    return [c.first_name, c.last_name, c.email, c.phone, c.company, stage?.name, c.source, c.tags, c.created_at?.slice(0, 10), c.last_activity_at?.slice(0, 10)].map(cell).join(",");
  });
  const csv = "﻿" + [header.map(cell).join(","), ...rows].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
