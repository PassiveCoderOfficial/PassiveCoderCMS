/**
 * CLI commands for AI coding agents (see selfhost/AI-INSTALL.md):
 *
 *   env-slots        write empty slots + make missing secrets in the settings file
 *   env-status       which settings are set or empty (names only; --json)
 *   supabase-create  create the Supabase project (needs --confirm; the user said yes)
 *   supabase-keys    write the project's URL, keys and DATABASE_URL into the file
 *   vercel-env       copy the settings into the linked Vercel project
 *   open-setup       open /setup with the setup code, without printing the code
 *
 * Every value goes from a CLI's output straight into the file (or from the
 * file straight into a CLI's input). Nothing here prints a value: only
 * setting names, "set" / "empty", project refs and addresses.
 */
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { c, say, step, ok, warn, bad, note, wrap } from "./ui.mjs";

const isWin = process.platform === "win32";

/**
 * @param {{ root: string, args: Record<string, any>, envFile: string }} ctx
 */
export async function runAgentCommand(command, ctx) {
  const { root, args, envFile } = ctx;
  const lib = (name) => import(pathToFileURL(path.join(root, "selfhost", "lib", name)).href);
  const envLib = await lib("env.mjs");
  const agent = await lib("agent-env.mjs");
  const { scrubSecrets } = await lib("agent-help.mjs");

  const rel = path.relative(root, envFile) || envFile;
  const readText = () => (existsSync(envFile) ? readFileSync(envFile, "utf8") : "");
  const readEnv = () => envLib.parseEnv(readText());
  const writeText = (text) => {
    writeFileSync(envFile, text, { mode: 0o600 });
    try { chmodSync(envFile, 0o600); } catch { /* Windows */ }
  };
  const stop = (message, code = 1) => { say(`\n${c.red("Stopped:")} ${wrap(message, 9)}`); process.exit(code); };
  const str = (v) => (typeof v === "string" ? v.trim() : "");

  /** Run a CLI with its output captured (never shown as is). */
  function capture(cmd, cmdArgs, { input, known = [] } = {}) {
    let [bin, ...pre] = cmd;
    // On Windows `npx` is a .cmd file that needs a shell, and a shell joins the
    // arguments (a password among them) into one command line. Run npm's own
    // npx script with node instead, so no shell is involved.
    if (isWin && bin === "npx") {
      const npxCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
      if (existsSync(npxCli)) { pre = [npxCli, ...pre]; bin = process.execPath; }
    }
    const res = spawnSync(bin, [...pre, ...cmdArgs], {
      cwd: root, encoding: "utf8", input, maxBuffer: 20 * 1024 * 1024,
      shell: isWin && bin !== process.execPath && bin !== "node",
      env: { ...process.env, NO_COLOR: "1" },
    });
    const clean = (s) => scrubSecrets(String(s ?? ""), known).trim();
    return { status: res.status ?? 1, stdout: String(res.stdout ?? ""), error: res.error, shown: clean(`${res.stderr ?? ""}\n${res.status ? res.stdout ?? "" : ""}`) };
  }
  const toolCmd = (envName, fallback) => {
    if (process.env[envName]) {
      try { return JSON.parse(process.env[envName]); } catch { return [process.env[envName]]; }
    }
    return fallback;
  };
  function supabaseCmd() {
    const own = toolCmd("PC_SUPABASE_CMD", null);
    if (own) return own;
    const probe = spawnSync("supabase", ["--version"], { stdio: "ignore", shell: isWin });
    return probe.status === 0 ? ["supabase"] : ["npx", "-y", "supabase"];
  }
  const printStatus = (env) => {
    for (const s of agent.slotStatus(env)) {
      if (s.state === "set") ok(`${s.name}: set`);
      else bad(`${s.name}: EMPTY  ${c.dim(`(${s.from})`)}`);
    }
  };

  /* ── env-slots ─────────────────────────────────────────────────────── */
  if (command === "env-slots") {
    const before = readEnv();
    const target = str(args.target) || "local";
    let address = str(args.address) || null;
    if (!address && !str(before.NEXT_PUBLIC_APP_URL) && target !== "server") address = "http://localhost:3000";
    let res;
    try {
      res = agent.ensureSlots(readText(), { address });
    } catch (e) {
      stop(e.message);
    }
    writeText(res.text);
    step(`Settings file: ${rel}`);
    if (res.added.length) note(`Empty slots added: ${res.added.join(", ")}`);
    if (res.made.length) note(`Secrets made (values not shown): ${res.made.join(", ")}`);
    printStatus(envLib.parseEnv(res.text));
    say();
    say(wrap(`Fill EMPTY slots with \`node selfhost/cli/index.mjs supabase-keys\`, or ask the user to paste each value into ${rel} (never into the chat).`, 0));
    return 0;
  }

  /* ── env-status ────────────────────────────────────────────────────── */
  if (command === "env-status") {
    const env = readEnv();
    const list = agent.slotStatus(env);
    if (args.json) say(JSON.stringify({ file: rel, exists: existsSync(envFile), settings: list.map(({ name, state }) => ({ name, state })) }, null, 2));
    else { step(`Settings file: ${rel}${existsSync(envFile) ? "" : " (not there yet)"}`); printStatus(env); }
    return agent.missingRequired(env).length ? 1 : 0;
  }

  /* ── supabase-create ───────────────────────────────────────────────── */
  if (command === "supabase-create") {
    const name = str(args.name) || "passivecoder-cms";
    const org = str(args["org-id"]);
    const region = str(args.region);
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(name)) stop("--name may hold letters, digits, - and _ only.", 2);
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(org) || !/^[a-z]{2}-[a-z]+-\d$/.test(region)) stop("Give --org-id (from `supabase orgs list`) and --region (for example ap-southeast-1; list: `supabase projects create --help`).", 2);
    let env = readEnv();
    if (agent.isProjectRef(env.SUPABASE_PROJECT_REF) && !args.again) {
      stop(`${rel} already names a project (SUPABASE_PROJECT_REF=${env.SUPABASE_PROJECT_REF}). Use it with \`supabase-keys\`, or pass --again to create another one.`, 2);
    }
    if (!args.confirm) {
      say(wrap(`Would create the Supabase project "${name}" in organisation ${org}, region ${region}. On the free plan an organisation can have 2 active projects; in a paid organisation a new project is billed. Ask the user, then run again with --confirm.`, 0));
      return 3;
    }
    if (!str(env.SUPABASE_DB_PASSWORD)) {
      writeText(agent.setValues(readText(), { SUPABASE_DB_PASSWORD: randomBytes(24).toString("hex") }));
      note(`Database password made and saved in ${rel} as SUPABASE_DB_PASSWORD (not shown).`);
      env = readEnv();
    }
    step(`Creating Supabase project "${name}" (${region})`);
    const res = capture(supabaseCmd(), ["projects", "create", name, "--org-id", org, "--region", region, "--db-password", env.SUPABASE_DB_PASSWORD, "-o", "json",
      // The user already confirmed with --confirm; newer Supabase CLIs ask again
      // when they detect an AI agent, and only accept --yes for hosted changes.
      "--yes"], { known: [env.SUPABASE_DB_PASSWORD] });
    if (res.status !== 0) stop(`supabase projects create failed${res.shown ? `:\n${res.shown}` : ""}\nIf it says you are not logged in, ask the user to run \`supabase login\` and finish the login in the browser.`);
    const ref = agent.parseProjectRef(res.stdout.trim());
    if (!ref) stop("The project may have been created, but its ref could not be read. Run `supabase projects list` and pass the ref to supabase-keys --ref.");
    writeText(agent.setValues(readText(), { SUPABASE_PROJECT_REF: ref, SUPABASE_REGION: region }));
    ok(`Project created: ${ref} (saved as SUPABASE_PROJECT_REF).`);
    note("It takes 1 to 3 minutes to start. Next: node selfhost/cli/index.mjs supabase-keys");
    return 0;
  }

  /* ── supabase-keys ─────────────────────────────────────────────────── */
  if (command === "supabase-keys") {
    let env = readEnv();
    const ref = str(args.ref) || str(env.SUPABASE_PROJECT_REF);
    const region = str(args.region) || str(env.SUPABASE_REGION);
    if (!agent.isProjectRef(ref)) stop("Give --ref <project ref> (20 letters and digits; `supabase projects list` shows it).", 2);
    step(`Reading the keys of project ${ref}`);
    const cmd = supabaseCmd();
    let keys = { anon: null, service: null };
    let last = null;
    for (const extra of [[], ["--reveal"]]) {
      const res = capture(cmd, ["projects", "api-keys", "--project-ref", ref, "-o", "json", ...extra]);
      last = res;
      if (res.status !== 0) continue;
      keys = agent.parseApiKeys(res.stdout.trim());
      if (keys.anon && keys.service) break;
    }
    if (!keys.anon || !keys.service) {
      stop(`Could not read both keys${last?.shown ? `:\n${scrubSecrets(last.shown)}` : "."}\nIf it says you are not logged in, ask the user to run \`supabase login\`. A new project may still be starting: wait a minute and run this again. Or ask the user to paste them into ${rel}.`);
    }
    const values = {
      NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: keys.anon,
      SUPABASE_SERVICE_ROLE_KEY: keys.service,
      SUPABASE_PROJECT_REF: ref,
      ...(region ? { SUPABASE_REGION: region } : {}),
    };
    writeText(agent.setValues(readText(), values));
    ok("NEXT_PUBLIC_SUPABASE_URL: set");
    ok("NEXT_PUBLIC_SUPABASE_ANON_KEY: set (value not shown)");
    ok("SUPABASE_SERVICE_ROLE_KEY: set (value not shown)");
    env = readEnv();

    // DATABASE_URL from the saved database password.
    if (str(env.DATABASE_URL) && !args["rebuild-db-url"]) { note("DATABASE_URL is already set; left as is (pass --rebuild-db-url to replace it)."); return 0; }
    const pw = str(env.SUPABASE_DB_PASSWORD);
    const candidates = agent.poolerCandidates(ref, region, pw);
    if (!candidates.length) {
      warn(wrap(`DATABASE_URL: EMPTY. ${pw ? "Give --region (the project's region, e.g. ap-southeast-1)." : "No SUPABASE_DB_PASSWORD in the file."} Or ask the user to paste the Session pooler string (Supabase > Connect > Session pooler, password filled in) into ${rel}.`));
      return 1;
    }
    let pg = null;
    // PC_SKIP_DB_VERIFY=1: write the first candidate without trying it (no network; tests).
    if (!process.env.PC_SKIP_DB_VERIFY) {
      try { pg = (await import("pg")).default; } catch { /* not installed yet */ }
    }
    if (!pg) {
      writeText(agent.setValues(readText(), { DATABASE_URL: candidates[0] }));
      warn("DATABASE_URL: set but NOT verified (run `npm ci`, then `node selfhost/cli/index.mjs doctor`; on a host error run this again with --rebuild-db-url).");
      return 0;
    }
    const db = await lib("db.mjs");
    const deadline = Date.now() + Number(args.wait ?? 180) * 1000;
    note("Trying the Session pooler (a new project can take a few minutes)…");
    for (;;) {
      const errors = [];
      for (const url of candidates) {
        try {
          const client = await db.connect(pg, url, { timeoutMs: 10000 });
          await client.end().catch(() => {});
          writeText(agent.setValues(readText(), { DATABASE_URL: url }));
          ok(`DATABASE_URL: set and verified (${new URL(url).hostname}).`);
          return 0;
        } catch (e) {
          errors.push(db.classifyDbError(e));
        }
      }
      if (Date.now() > deadline || errors.every((e) => e === "auth")) {
        bad(`DATABASE_URL: could not connect (${[...new Set(errors)].join(", ")}). ${errors.includes("auth") ? "The password in SUPABASE_DB_PASSWORD is not this project's: ask the user to reset it in Supabase and paste it into the file as SUPABASE_DB_PASSWORD, then run this again." : `Ask the user to paste the Session pooler string into ${rel}.`}`);
        return 1;
      }
      await new Promise((r) => setTimeout(r, 15000));
    }
  }

  /* ── vercel-env ────────────────────────────────────────────────────── */
  if (command === "vercel-env") {
    const env = readEnv();
    const target = str(args.environment) || "production";
    const missing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !str(env[k]));
    if (missing.length) stop(`Fill these in ${rel} first: ${missing.join(", ")}.`);
    const cmd = toolCmd("PC_VERCEL_CMD", ["vercel"]);
    const known = Object.values(env).filter(Boolean);
    step(`Copying settings to Vercel (${target})`);
    let failed = 0;
    for (const name of agent.VERCEL_SETTINGS) {
      const value = str(env[name]);
      if (!value) { note(`${name}: empty here, skipped`); continue; }
      const res = capture(cmd, ["env", "add", name, target, ...(args.replace ? ["--force"] : [])], { input: value, known });
      if (res.status === 0) ok(`${name}: added (value not shown)`);
      else if (/already (exists|been added)/i.test(res.shown)) warn(`${name}: already in Vercel, left as is (to replace it, run with --replace after asking the user)`);
      else { failed++; bad(`${name}: ${res.shown.split("\n").slice(-2).join(" ") || "failed"}`); }
    }
    if (failed) { say(wrap("If it says the project is not linked or you are not logged in: ask the user to run `vercel login`, then run `vercel link --yes`, then this again.", 0)); return 1; }
    note("Next: vercel deploy --prod --yes");
    return 0;
  }

  /* ── open-setup ────────────────────────────────────────────────────── */
  if (command === "open-setup") {
    const env = readEnv();
    const base = (str(args.url) || str(env.NEXT_PUBLIC_APP_URL)).replace(/\/+$/, "");
    if (!/^https?:\/\//.test(base)) stop("Give --url https://your-site (the deployed address).", 2);
    const token = str(env.SETUP_TOKEN);
    const url = `${base}/setup${token ? `#code=${token}` : ""}`;
    let opened = false;
    if (!process.env.SSH_CONNECTION && !process.env.CI) {
      try {
        const child = isWin ? spawn("cmd", ["/c", "start", "", url.replace(/&/g, "^&")], { stdio: "ignore", detached: true })
          : spawn(process.platform === "darwin" ? "open" : "xdg-open", [url], { stdio: "ignore", detached: true });
        child.on("error", () => {});
        child.unref();
        opened = true;
      } catch { /* fall through */ }
    }
    if (opened) ok(`Opened ${base}/setup in the browser (the setup code is in the link, not shown here).`);
    else say(wrap(`Open ${base}/setup in a browser. When it asks for the setup code, the user copies SETUP_TOKEN from ${rel} (do not print it here).`, 0));
    return 0;
  }

  return null;
}
