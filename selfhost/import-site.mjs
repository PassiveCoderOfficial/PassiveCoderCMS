#!/usr/bin/env node
/**
 * Load a site package (made by Passive Coder when a hosted site moves to
 * self-hosting) into a fresh self-hosted Passive Coder CMS database.
 *
 *   node selfhost/import-site.mjs <package folder> [--owner-password <pw>] [--dry-run]
 *        [--licence-dest <path>]
 *
 * Env (your install's .env.local is read if present):
 *   DATABASE_URL                Postgres connection string of your Supabase project
 *   NEXT_PUBLIC_SUPABASE_URL    your Supabase URL
 *   SUPABASE_SERVICE_ROLE_KEY   your Supabase secret key
 *   COURIER_SECRET_KEY          needed when the package holds courier/payment secrets
 *   NEXT_PUBLIC_APP_URL         optional: your site's address, saved as the site URL
 *
 * Run it on an empty database (schema loaded, no site yet: before /setup).
 * It uploads the files, creates the logins (owner gets --owner-password or a
 * generated one, printed once; everyone else uses "Forgot password"), then
 * writes every row in one transaction: on any error nothing is written.
 * --dry-run does the database part and rolls it back, without uploads or logins.
 *
 * If the package holds a licence.json (the site's paid-module licence), it is
 * copied to --licence-dest, else PASSIVECODER_LICENCE_FILE, else ./licence.json
 * (run this from the app's folder). Hosts without a disk (Vercel): put the
 * file's contents in the PASSIVECODER_LICENCE setting instead.
 */
import { createCipheriv, randomBytes } from "node:crypto";
import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const PLAIN_MARK = "pcmove-plain:";
const TENANT_RESET = [
  "stripe_customer_id", "stripe_subscription_id", "trial_ends_at", "referred_by_staff_id", "assigned_staff_id",
  "staff_id", "enm_user_id", "enm_tier", "staff_commission_override", "deletion_requested_at", "deletion_requested_by",
  "referred_by_agent_id", "assigned_agent_id", "demo_expires_at", "demo_created_by", "demo_whatsapp",
  "referred_by_partner_id", "referred_at", "reseller_partner_id", "client_price", "trial_delete_after",
  "trial_notice_stage", "assigned_admin_id", "delete_scheduled_for",
];
const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", avif: "image/avif", svg: "image/svg+xml", ico: "image/x-icon", pdf: "application/pdf", mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", json: "application/json", txt: "text/plain", css: "text/css", js: "text/javascript", woff2: "font/woff2", woff: "font/woff", zip: "application/zip" };

function args() {
  const a = process.argv.slice(2);
  const get = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const dir = a.find((x, i) => !x.startsWith("--") && a[i - 1] !== "--owner-password" && a[i - 1] !== "--licence-dest");
  if (!dir) { console.error("usage: node selfhost/import-site.mjs <package folder> [--owner-password <pw>] [--dry-run] [--licence-dest <path>]"); process.exit(2); }
  return { dir: path.resolve(dir), ownerPassword: get("--owner-password"), dryRun: a.includes("--dry-run"), licenceDest: get("--licence-dest") };
}

function sealWith(key) {
  return (plain) => {
    const iv = randomBytes(12);
    const c = createCipheriv("aes-256-gcm", key, iv);
    const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
    return `sb1:${iv.toString("base64url")}:${c.getAuthTag().toString("base64url")}:${ct.toString("base64url")}`;
  };
}

/** Walk a value: swap the storage address, seal marked secrets again. */
function transform(v, ctx) {
  if (typeof v === "string") {
    if (v.startsWith(PLAIN_MARK)) {
      ctx.secrets++;
      return ctx.seal(Buffer.from(v.slice(PLAIN_MARK.length), "base64url").toString("utf8"));
    }
    return v.includes(ctx.from) ? v.split(ctx.from).join(ctx.to) : v;
  }
  if (Array.isArray(v)) return v.map((x) => transform(x, ctx));
  if (v && typeof v === "object") {
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = transform(x, ctx);
    return o;
  }
  return v;
}

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else yield p;
  }
}

async function main() {
  const opt = args();
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const { DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: SERVICE } = process.env;
  if (!DATABASE_URL || !NEXT_PUBLIC_SUPABASE_URL || !SERVICE) throw new Error("DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  const SUPA = NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");

  const manifest = JSON.parse(await readFile(path.join(opt.dir, "manifest.json"), "utf8"));
  if (manifest.format !== "pc-site-package" || manifest.version !== 1) throw new Error("Not a Passive Coder site package (or a newer version: update your install first)");
  const users = JSON.parse(await readFile(path.join(opt.dir, "users.json"), "utf8"));
  const data = {};
  for (const f of await readdir(path.join(opt.dir, "data"))) {
    if (f.endsWith(".json")) data[f.slice(0, -5)] = JSON.parse(await readFile(path.join(opt.dir, "data", f), "utf8"));
  }
  let tenant = data.tenants?.[0];
  if (!tenant) throw new Error("The package has no site row");

  // The paid-module licence, checked before anything is written. The app
  // verifies its signature itself at start-up; this only catches a mix-up.
  const licenceSrc = path.join(opt.dir, "licence.json");
  let licence = null;
  if (existsSync(licenceSrc)) {
    licence = JSON.parse(await readFile(licenceSrc, "utf8"));
    if (licence?.format !== "pc-licence" || !licence.licence || !licence.signature) throw new Error("licence.json in the package is not a licence file");
    if (licence.licence.tenant_id !== tenant.id) throw new Error(`licence.json is for another site (${licence.licence.tenant_id})`);
  }
  console.log(`package: ${manifest.source.name} (${manifest.source.slug}), made ${manifest.created_at}, app ${manifest.app_version}`);

  const rawKey = process.env.COURIER_SECRET_KEY?.trim();
  const key = rawKey ? Buffer.from(rawKey, "base64") : null;
  const ctx = {
    from: `${manifest.source.supabase_url}/storage/v1/`,
    to: `${SUPA}/storage/v1/`,
    secrets: 0,
    seal: key?.length === 32 ? sealWith(key) : () => { throw new Error("The package holds saved secrets: set COURIER_SECRET_KEY (32 random bytes, base64) first"); },
  };

  const db = new pg.Client({ connectionString: DATABASE_URL, ssl: DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1") ? false : { rejectUnauthorized: false } });
  await db.connect();
  const q = async (sql, params) => (await db.query(sql, params)).rows;

  const [{ n: existing }] = await q(`select count(*)::int n from tenants`);
  if (existing > 0) throw new Error("This database already has a site. Import into a fresh database (before /setup).");
  const [selfhostPlan] = await q(`select id, modules from plans where id = 'selfhost'`);
  if (!selfhostPlan) throw new Error("The selfhost plan row is missing: load the full schema first");

  // Target schema.
  const colRows = await q(`select table_name t, column_name c, data_type dt, is_nullable = 'YES' nullable, is_generated = 'ALWAYS' generated, identity_generation ident
    from information_schema.columns where table_schema = 'public'`);
  const cols = new Map();
  for (const r of colRows) { if (!cols.has(r.t)) cols.set(r.t, new Map()); cols.get(r.t).set(r.c, r); }
  const fks = (await q(`select con.conrelid::regclass::text as child, a.attname as col, con.confrelid::regclass::text as parent, af.attname as pcol
    from pg_constraint con
    join pg_attribute a on a.attrelid=con.conrelid and a.attnum=con.conkey[1]
    join pg_attribute af on af.attrelid=con.confrelid and af.attnum=con.confkey[1]
    where con.contype='f' and con.connamespace='public'::regnamespace and array_length(con.conkey,1)=1`))
    .map((f) => ({ ...f, child: f.child.replace(/^public\./, "").replace(/"/g, ""), parent: f.parent === "auth.users" ? "auth.users" : f.parent.replace(/^public\./, "").replace(/"/g, "") }));
  const pkRows = await q(`select tc.table_name t, kcu.column_name c from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
    where tc.table_schema = 'public' and tc.constraint_type = 'PRIMARY KEY' order by kcu.ordinal_position`);
  const pks = new Map();
  for (const r of pkRows) { if (!pks.has(r.t)) pks.set(r.t, []); pks.get(r.t).push(r.c); }

  const warnings = [];
  for (const t of Object.keys(data)) if (!cols.has(t)) { warnings.push(`table ${t} is not in this install (${data[t].length} rows skipped)`); delete data[t]; }

  // 1. Files.
  let uploaded = 0;
  const uploadFailed = [];
  const filesDir = path.join(opt.dir, "files");
  if (!opt.dryRun && existsSync(filesDir)) {
    const auth = { Authorization: `Bearer ${SERVICE}`, apikey: SERVICE };
    const buckets = new Set();
    // Form uploads, project files and the like are reached by signed link only: those buckets stay private.
    const privateBuckets = new Set(manifest.private_buckets ?? []);
    for (const b of await readdir(filesDir)) {
      const res = await fetch(`${SUPA}/storage/v1/bucket/${b}`, { headers: auth });
      if (!res.ok) {
        const mk = await fetch(`${SUPA}/storage/v1/bucket`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ id: b, name: b, public: !privateBuckets.has(b) }) });
        if (!mk.ok) { uploadFailed.push(`bucket ${b}: ${mk.status} ${await mk.text()}`); continue; }
      }
      buckets.add(b);
    }
    const files = [];
    for await (const f of walk(filesDir)) files.push(f);
    let i = 0;
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (i < files.length) {
        const f = files[i++];
        const rel = path.relative(filesDir, f).split(path.sep);
        const bucket = rel.shift();
        if (!buckets.has(bucket)) continue;
        const ext = path.extname(f).slice(1).toLowerCase();
        const res = await fetch(`${SUPA}/storage/v1/object/${bucket}/${rel.map(encodeURIComponent).join("/")}`, {
          method: "POST",
          headers: { ...auth, "x-upsert": "true", "Content-Type": MIME[ext] ?? "application/octet-stream" },
          body: await readFile(f),
        });
        if (res.ok) uploaded++; else uploadFailed.push(`${bucket}/${rel.join("/")}: ${res.status}`);
      }
    }));
    console.log(`files uploaded ${uploaded}/${files.length}`);
  }

  // 2. Logins. Same ids where the auth server allows it; otherwise remapped.
  const userMap = new Map();
  let ownerPassword = null;
  if (opt.dryRun) {
    console.log("dry run: no logins made, so rows that need one are left out below");
  } else {
    const auth = { Authorization: `Bearer ${SERVICE}`, apikey: SERVICE, "Content-Type": "application/json" };
    for (const u of users) {
      const isOwner = u.role === "owner";
      const password = isOwner && opt.ownerPassword ? opt.ownerPassword : randomBytes(18).toString("base64url");
      if (isOwner) ownerPassword = password;
      const body = { id: u.id, email: u.email ?? undefined, phone: u.phone || undefined, password, email_confirm: true, phone_confirm: !!u.phone, user_metadata: u.user_metadata ?? {} };
      let res = await fetch(`${SUPA}/auth/v1/admin/users`, { method: "POST", headers: auth, body: JSON.stringify(body) });
      let out = await res.json().catch(() => ({}));
      if (res.ok) { userMap.set(u.id, out.id ?? u.id); continue; }
      // Already there (a re-run): find it by email and reuse it.
      const found = (await q(`select id from auth.users where lower(email) = lower($1)`, [u.email ?? ""]))[0];
      if (found) {
        userMap.set(u.id, found.id);
        if (isOwner) await fetch(`${SUPA}/auth/v1/admin/users/${found.id}`, { method: "PUT", headers: auth, body: JSON.stringify({ password }) });
        continue;
      }
      warnings.push(`login ${u.email ?? u.id} not created: ${out.msg ?? out.message ?? res.status}`);
    }
    console.log(`logins ${userMap.size}/${users.length}`);
  }

  // 3. Rows: new storage address, secrets sealed with this install's key,
  //    user ids mapped, the site row made a self-hosted site.
  for (const t of Object.keys(data)) data[t] = data[t].map((r) => transform(r, ctx));
  tenant = data.tenants[0];
  const tcols = cols.get("tenants");
  for (const c of TENANT_RESET) {
    if (!tcols.has(c)) continue;
    if (tcols.get(c).nullable) tenant[c] = null; else delete tenant[c]; // the column default
  }
  Object.assign(tenant, { plan: "selfhost", status: "active", onboarding_completed: true, enabled_modules: manifest.modules ?? {} });
  if (tenant.owner_id) tenant.owner_id = userMap.get(tenant.owner_id) ?? null;
  for (const f of fks.filter((x) => x.parent === "auth.users")) {
    for (const r of data[f.child] ?? []) if (r[f.col] != null) r[f.col] = userMap.get(r[f.col]) ?? r[f.col];
  }
  if (process.env.NEXT_PUBLIC_APP_URL && data.site_settings?.[0]) data.site_settings[0].site_url = process.env.NEXT_PUBLIC_APP_URL;

  // 4. References that point outside the package (Passive Coder staff, our
  //    templates, billing rows): cleared when optional, the row dropped when not.
  const present = new Map();
  const valuesOf = async (parent, pcol, needed) => {
    const k = `${parent}.${pcol}`;
    if (!present.has(k)) {
      if (parent === "auth.users") present.set(k, new Set([...userMap.values()]));
      else {
        const set = new Set((data[parent] ?? []).map((r) => r[pcol]).filter((v) => v != null).map(String));
        const outside = [...needed].filter((v) => !set.has(v));
        if (outside.length) for (const r of await q(`select "${pcol}"::text v from public."${parent}" where "${pcol}"::text = any($1)`, [outside])) set.add(r.v);
        present.set(k, set);
      }
    }
    return present.get(k);
  };
  const dropped = {}, cleared = {};
  for (let changed = true; changed;) {
    changed = false;
    present.clear();
    for (const f of fks) {
      const rows = data[f.child];
      if (!rows?.length) continue;
      const needed = new Set(rows.map((r) => r[f.col]).filter((v) => v != null).map(String));
      if (!needed.size) continue;
      const ok = await valuesOf(f.parent, f.pcol, needed);
      const nullable = cols.get(f.child)?.get(f.col)?.nullable;
      const keep = [];
      for (const r of rows) {
        if (r[f.col] == null || ok.has(String(r[f.col]))) { keep.push(r); continue; }
        if (nullable) { r[f.col] = null; cleared[`${f.child}.${f.col}`] = (cleared[`${f.child}.${f.col}`] ?? 0) + 1; keep.push(r); }
        else { dropped[f.child] = (dropped[f.child] ?? 0) + 1; changed = true; }
      }
      data[f.child] = keep;
    }
  }

  // 5. Order: parents before children. Self references and cycles are written
  //    empty first and filled in afterwards.
  const tables = Object.keys(data).filter((t) => data[t].length);
  const deferred = [];
  const edges = new Map(tables.map((t) => [t, new Set()]));
  for (const f of fks) {
    if (!edges.has(f.child) || !edges.has(f.parent)) continue;
    if (f.child === f.parent) { deferred.push(f); continue; }
    edges.get(f.child).add(f.parent);
  }
  const order = [];
  const left = new Set(tables);
  while (left.size) {
    const ready = [...left].filter((t) => [...edges.get(t)].every((p) => !left.has(p)));
    if (ready.length) { for (const t of ready) { order.push(t); left.delete(t); } continue; }
    // A cycle: defer one optional reference to break it.
    const f = fks.find((x) => left.has(x.child) && left.has(x.parent) && x.child !== x.parent && cols.get(x.child)?.get(x.col)?.nullable && edges.get(x.child).has(x.parent));
    if (!f) throw new Error(`Cannot order tables: ${[...left].join(", ")}`);
    deferred.push(f);
    if (!fks.some((x) => x !== f && x.child === f.child && x.parent === f.parent && !deferred.includes(x))) edges.get(f.child).delete(f.parent);
  }
  const later = []; // [table, pk values, col, value]
  for (const f of deferred) {
    const pk = pks.get(f.child);
    if (!pk?.length) throw new Error(`${f.child} needs a primary key to fill ${f.col} afterwards`);
    for (const r of data[f.child] ?? []) {
      if (r[f.col] == null) continue;
      later.push([f.child, pk, pk.map((c) => r[c]), f.col, r[f.col]]);
      r[f.col] = null;
    }
  }

  // 6. Write everything in one transaction, with the tables' own triggers off
  //    (they would send emails, log activity or block moving owner fields).
  const counts = {};
  await q("begin");
  try {
    for (const t of order) await q(`alter table public."${t}" disable trigger user`);
    for (const t of order) {
      const tc = cols.get(t);
      const rows = data[t];
      const used = new Set();
      for (const r of rows) for (const k of Object.keys(r)) used.add(k);
      const unknown = [...used].filter((c) => !tc.has(c));
      if (unknown.length) warnings.push(`${t}: columns not in this install, skipped: ${unknown.join(", ")}`);
      const names = [...used].filter((c) => tc.has(c) && !tc.get(c).generated);
      if (!names.length) continue;
      const overriding = names.some((c) => tc.get(c).ident === "ALWAYS") ? " overriding system value" : "";
      // Rows the install made by itself (a profile per new login) are overwritten.
      const pk = pks.get(t) ?? [];
      const rest = names.filter((c) => !pk.includes(c));
      const conflict = pk.length && pk.every((c) => names.includes(c))
        ? ` on conflict (${pk.map((c) => `"${c}"`).join(",")}) ` + (rest.length ? `do update set ${rest.map((c) => `"${c}" = excluded."${c}"`).join(",")}` : "do nothing")
        : "";
      const per = Math.max(1, Math.min(500, Math.floor(30000 / names.length)));
      for (let i = 0; i < rows.length; i += per) {
        const params = [];
        const tuples = rows.slice(i, i + per).map((r) => "(" + names.map((c) => {
          if (!(c in r)) return "default";
          let v = r[c];
          const dt = tc.get(c).dt;
          if (v != null && (dt === "json" || dt === "jsonb")) v = JSON.stringify(v);
          params.push(v);
          return `$${params.length}`;
        }).join(",") + ")");
        await q(`insert into public."${t}" (${names.map((c) => `"${c}"`).join(",")})${overriding} values ${tuples.join(",")}${conflict}`, params);
      }
      counts[t] = rows.length;
    }
    for (const [t, pk, vals, col, value] of later) {
      await q(`update public."${t}" set "${col}" = $1 where ${pk.map((c, i) => `"${c}" = $${i + 2}`).join(" and ")}`, [value, ...vals]);
    }
    for (const t of order) await q(`alter table public."${t}" enable trigger user`);

    // Counters (serial and identity columns) continue after the imported rows.
    for (const t of order) {
      for (const [c] of cols.get(t)) {
        const [s] = await q(`select pg_get_serial_sequence($1, $2) seq`, [`public."${t}"`, c]);
        if (s?.seq) await q(`select setval($1, greatest((select coalesce(max("${c}"), 0) from public."${t}"), 1))`, [s.seq]);
      }
    }

    // Frozen modules: the self-hosted plan includes what the site had.
    const modules = { ...(selfhostPlan.modules ?? {}) };
    for (const [k, on] of Object.entries(manifest.modules ?? {})) modules[k] = { ...(modules[k] ?? {}), included: true, defaultOn: !!on };
    await q(`update plans set modules = $1 where id = 'selfhost'`, [JSON.stringify(modules)]);

    if (opt.dryRun) { await q("rollback"); console.log("dry run: rolled back"); }
    else await q("commit");
  } catch (e) {
    await q("rollback").catch(() => {});
    throw e;
  } finally {
    await db.end();
  }

  const rows = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`rows ${rows} in ${Object.keys(counts).length} tables${ctx.secrets ? `, secrets sealed ${ctx.secrets}` : ""}`);
  if (Object.keys(dropped).length) console.log(`rows left out (they pointed at Passive Coder accounts or records): ${JSON.stringify(dropped)}`);
  if (Object.keys(cleared).length) console.log(`references cleared: ${JSON.stringify(cleared)}`);
  for (const w of warnings) console.log(`warning: ${w}`);
  if (uploadFailed.length) console.log(`files not uploaded: ${uploadFailed.length}\n  ${uploadFailed.slice(0, 20).join("\n  ")}`);
  if (licence) {
    const dest = path.resolve(opt.licenceDest ?? process.env.PASSIVECODER_LICENCE_FILE ?? "licence.json");
    const bare = (d) => String(d ?? "").toLowerCase().replace(/^https?:\/\//, "").split("/")[0].replace(/:\d+$/, "").replace(/^www\./, "");
    const here = bare(process.env.NEXT_PUBLIC_ROOT_DOMAIN);
    if (opt.dryRun) console.log(`licence: ${licence.licence.modules.join(", ")} for ${licence.licence.domain} (dry run: not copied; would go to ${dest})`);
    else {
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(licenceSrc, dest);
      console.log(`licence: ${licence.licence.modules.join(", ")} for ${licence.licence.domain}, installed at ${dest} (restart the app to load it)`);
    }
    if (here && here !== bare(licence.licence.domain)) console.log(`warning: the licence is for ${licence.licence.domain} but NEXT_PUBLIC_ROOT_DOMAIN is ${process.env.NEXT_PUBLIC_ROOT_DOMAIN}; the paid modules stay off until they match.`);
  }
  if (!opt.dryRun) {
    const owner = users.find((u) => u.role === "owner");
    if (owner) console.log(`\nowner login: ${owner.email}${opt.ownerPassword ? " (password as given)" : `\npassword (shown once, change it after signing in): ${ownerPassword}`}`);
    console.log("other logins: use \"Forgot password\" on the sign-in page.");
    console.log("next: start the app, sign in, re-enter payment and courier keys if needed, connect Google again, point your domain here.");
  }
}

main().catch((e) => { console.error(`import failed: ${e.message}`); process.exit(1); });
