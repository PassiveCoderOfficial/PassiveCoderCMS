#!/usr/bin/env node
/**
 * Start command of the Docker image (Dockerfile: CMD).
 *
 * A site-specific image (built with your own .env) just starts the app.
 * The ready-made image (built with PC_GENERIC=1, the one install.sh pulls)
 * first puts this site's public settings into the built files, in place of
 * the placeholders it was built with (selfhost/lib/runtime-config.mjs). The
 * untouched files are kept in /app/.pc-pristine, so new values after a
 * restart are applied cleanly. Then it starts the app in this same process.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MARKER, applyValues, isTextAsset, replacementPairs, runtimeValues, valuesStamp } from "./lib/runtime-config.mjs";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kindFile = path.join(app, ".pc-image-kind");
const kind = existsSync(kindFile) ? readFileSync(kindFile, "utf8").trim() : "site";
const pristine = path.join(app, ".pc-pristine");
const listFile = path.join(pristine, "files.txt");
const stampFile = path.join(app, ".pc-applied");

function* walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "cache") yield* walk(p); }
    else if (e.isFile()) yield p;
  }
}

/** First start of this container: find the files with placeholders and keep
 *  a clean copy of each. */
function findFiles() {
  if (existsSync(listFile)) return readFileSync(listFile, "utf8").split("\n").filter(Boolean);
  const found = [];
  const roots = [path.join(app, ".next"), path.join(app, "server.js")];
  for (const r of roots) {
    const files = existsSync(r) && statSync(r).isFile() ? [r] : walk(r);
    for (const f of files) {
      if (!isTextAsset(f)) continue;
      if (!readFileSync(f, "utf8").includes(MARKER)) continue;
      const rel = path.relative(app, f);
      const copy = path.join(pristine, rel);
      mkdirSync(path.dirname(copy), { recursive: true });
      copyFileSync(f, copy);
      found.push(rel);
    }
  }
  mkdirSync(pristine, { recursive: true });
  writeFileSync(listFile, found.join("\n") + "\n");
  return found;
}

function applySettings() {
  const res = runtimeValues(process.env);
  if (!res.ok) {
    const parts = [];
    if (res.missing.length) parts.push(`missing: ${res.missing.join(", ")}`);
    if (res.invalid.length) parts.push(`not valid: ${res.invalid.join(", ")}`);
    console.error(`[passivecoder] Settings ${parts.join("; ")}. Fix them in .env and restart (sudo sh /opt/passivecoder/update.sh --restart). Starting anyway so /setup can show what is wrong.`);
    return;
  }
  const stamp = valuesStamp(res.values);
  if (existsSync(stampFile) && readFileSync(stampFile, "utf8") === stamp) return;
  const started = Date.now();
  const files = findFiles();
  const pairs = replacementPairs(res.values);
  for (const rel of files) {
    const text = readFileSync(path.join(pristine, rel), "utf8");
    writeFileSync(path.join(app, rel), applyValues(text, pairs));
  }
  writeFileSync(stampFile, stamp);
  console.log(`[passivecoder] Site settings applied to ${files.length} files in ${Date.now() - started} ms.`);
}

if (kind === "generic") {
  try {
    applySettings();
  } catch (e) {
    console.error(`[passivecoder] Could not apply the site settings: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
}

await import(pathToFileURL(path.join(app, "server.js")).href);
