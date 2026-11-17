import JSZip from "jszip";

export interface DbExportFiles {
  "data.json": Buffer;
  "summary.pdf": Buffer;
  "wordpress-export.xml": Buffer;
  csv: Record<string, Buffer>; // table name -> csv buffer
  "manifest.json": Buffer;
}

export async function buildDbZip(files: DbExportFiles): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("data.json", files["data.json"]);
  zip.file("summary.pdf", files["summary.pdf"]);
  zip.file("wordpress-export.xml", files["wordpress-export.xml"]);
  zip.file("manifest.json", files["manifest.json"]);
  for (const [table, buf] of Object.entries(files.csv)) {
    zip.file(`csv/${table}.csv`, buf);
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
