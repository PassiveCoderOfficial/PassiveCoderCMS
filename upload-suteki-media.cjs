const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const TENANT_ID = "46384b67-7497-4ec2-aedf-27fe4a9f836f";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const SRC_DIR = path.join(__dirname, "..", "clients", "SUTEKI");

async function main() {
  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith(".jpg") || f.endsWith(".png"));
  const urls = {};

  for (const file of files) {
    const filePath = path.join(SRC_DIR, file);
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(file).slice(1);
    const contentType = ext === "png" ? "image/png" : "image/jpeg";
    const storagePath = `uploads/suteki/${Date.now()}_${file}`;

    const { error } = await sb.storage.from("media").upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.error(`FAILED ${file}:`, error.message);
      continue;
    }

    const { data: pub } = sb.storage.from("media").getPublicUrl(storagePath);
    urls[file] = pub.publicUrl;
    console.log(`OK ${file} -> ${pub.publicUrl}`);
  }

  fs.writeFileSync(
    path.join(__dirname, "suteki-media-urls.json"),
    JSON.stringify(urls, null, 2),
  );
  console.log("\nSaved suteki-media-urls.json");
}

main();
