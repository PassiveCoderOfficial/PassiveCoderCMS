/** Upload Life Settle management photos to Supabase storage media/uploads, print public URLs. */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DIR = "D:/Dev/Projects/CMS/clients/Life Settle Travel And Tourism/Revision";

const MAP = [
  ["WhatsApp Image 2026-06-26 at 11.12.45 PM.jpeg", "mohammed-masud-rana-chairman"],
  ["WhatsApp Image 2026-06-26 at 11.19.04 PM.jpeg", "sharmin-akter-md"],
  ["WhatsApp Image 2026-06-26 at 11.19.37 PM.jpeg", "ceo"],
  ["WhatsApp Image 2026-06-26 at 11.20.22 PM.jpeg", "shahedul-anowar-ashraful-gm"],
  ["WhatsApp Image 2026-06-26 at 11.27.21 PM.jpeg", "ibrahim-khan-operations-manager"],
  ["WhatsApp Image 2026-06-26 at 11.20.52 PM.jpeg", "ashraful-alam-hr-manager"],
  ["WhatsApp Image 2026-06-27 at 6.31.48 AM.jpeg", "suva-akter-accountant"],
  ["WhatsApp Image 2026-06-27 at 3.36.47 AM.jpeg", "md-asaduzzaman-finance-manager"],
  ["WhatsApp Image 2026-06-26 at 11.35.42 PM.jpeg", "fujlulol-huq-it-manager"],
];

async function run() {
  const out = {};
  for (const [file, slug] of MAP) {
    const full = path.join(DIR, file);
    if (!fs.existsSync(full)) { console.error("MISSING:", file); continue; }
    const buf = fs.readFileSync(full);
    const key = `uploads/lifesettle-mgmt-${slug}.jpeg`;
    const { error } = await sb.storage.from("media").upload(key, buf, { contentType: "image/jpeg", upsert: true });
    if (error) { console.error("ERR", slug, error.message); continue; }
    const { data } = sb.storage.from("media").getPublicUrl(key);
    out[slug] = data.publicUrl;
    console.log(slug, "->", data.publicUrl);
  }
  fs.writeFileSync(path.join(__dirname, "mgmt-photo-urls.json"), JSON.stringify(out, null, 2));
  console.log("\nWrote mgmt-photo-urls.json");
}
run().catch(console.error);
