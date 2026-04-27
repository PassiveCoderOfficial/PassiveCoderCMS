// PDF summary using jsPDF — lightweight text-only summary
// Install: npm install jspdf

export async function generatePdfSummary(
  tenantSlug: string,
  data: Record<string, unknown[]>,
  createdAt: string,
): Promise<Buffer> {
  // Dynamic import so it only loads when backup runs (not in browser bundle)
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.default ?? (jsPDFModule as unknown as { jsPDF: typeof jsPDFModule.default }).jsPDF;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const tableNames = Object.keys(data);
  const totalRecords = Object.values(data).reduce((sum, rows) => sum + rows.length, 0);

  doc.setFontSize(22);
  doc.text("Passive Coder — Site Backup", 20, 20);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Site: ${tenantSlug}`, 20, 32);
  doc.text(`Generated: ${new Date(createdAt).toLocaleString()}`, 20, 39);

  doc.setDrawColor(220);
  doc.line(20, 45, 190, 45);

  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text("Export Summary", 20, 55);

  doc.setFontSize(11);
  let y = 65;

  for (const table of tableNames) {
    const count = data[table].length;
    doc.text(`${table.replace(/_/g, " ")}: ${count} records`, 25, y);
    y += 7;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }

  y += 5;
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 180);
  doc.text(`Total: ${totalRecords} records across ${tableNames.length} tables`, 20, y);

  // Per-table detail pages for posts and pages
  for (const table of ["posts", "pages"] as const) {
    const rows = (data[table] ?? []) as Array<Record<string, unknown>>;
    if (!rows.length) continue;

    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(`${table.charAt(0).toUpperCase() + table.slice(1)}`, 20, 20);
    doc.setFontSize(10);

    let ry = 32;
    for (const row of rows.slice(0, 50)) {
      const title = String(row.title ?? row.name ?? row.id ?? "");
      const status = String(row.status ?? "");
      const date = String(row.created_at ?? row.updated_at ?? "").slice(0, 10);
      doc.text(`• ${title}  [${status}]  ${date}`, 22, ry);
      ry += 6;
      if (ry > 275) {
        doc.addPage();
        ry = 20;
      }
    }
    if (rows.length > 50) {
      doc.text(`...and ${rows.length - 50} more`, 22, ry);
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}
