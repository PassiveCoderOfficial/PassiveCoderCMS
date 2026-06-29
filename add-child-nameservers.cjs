/**
 * One-shot: register child nameservers (glue) ns1..4.passivecoder.com at LogicBox.
 * Run locally — reads LOGICBOX_USER_ID / LOGICBOX_API_KEY from env (.env.local or shell).
 *
 *   node add-child-nameservers.cjs
 *
 * Idempotent-ish: "already exists" errors are reported but not fatal.
 */
const fs = require("fs");
const path = require("path");

// load .env.local if present
const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const USER_ID = process.env.LOGICBOX_USER_ID;
const API_KEY = process.env.LOGICBOX_API_KEY;
const ORDER_ID = "112144506"; // passivecoder.com

if (!USER_ID || !API_KEY) {
  console.error("Missing LOGICBOX_USER_ID / LOGICBOX_API_KEY in env (.env.local).");
  process.exit(1);
}

// ns hostname -> primary glue IP (one IP each; add more later if you want redundancy)
const CNS = [
  ["ns1.passivecoder.com", "162.251.82.251"],
  ["ns2.passivecoder.com", "162.251.82.120"],
  ["ns3.passivecoder.com", "162.251.82.247"],
  ["ns4.passivecoder.com", "162.251.82.124"],
];

const BASE = "https://httpapi.com/api";

function qs(params) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

async function addCns(cns, ip) {
  const url = `${BASE}/domains/add-cns.json`;
  const body = qs({ "auth-userid": USER_ID, "api-key": API_KEY, "order-id": ORDER_ID, cns, ip });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

(async () => {
  console.log("Registering child nameservers for passivecoder.com (order " + ORDER_ID + ")\n");
  for (const [cns, ip] of CNS) {
    try {
      const r = await addCns(cns, ip);
      console.log(`${r.ok ? "✓" : "✗"} ${cns} -> ${ip}  [${r.status}] ${r.text}`);
    } catch (e) {
      console.error(`✗ ${cns} -> ${ip}  ERROR ${e.message}`);
    }
  }
  console.log("\nDone. Wait a few minutes for .com registry propagation, then verify glue.");
})();
