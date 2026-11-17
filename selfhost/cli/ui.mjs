/**
 * Terminal helpers for the CLI: colours, questions, hidden input, progress.
 * Node built-ins only.
 */
import readline from "node:readline";

const useColour = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (useColour ? `\x1b[${code}m${s}\x1b[0m` : String(s));
export const c = { bold: paint(1), dim: paint(2), red: paint(31), green: paint(32), yellow: paint(33), cyan: paint(36) };

export const say = (text = "") => process.stdout.write(`${text}\n`);
export const step = (text) => say(`\n${c.bold(text)}`);
export const ok = (text) => say(`  ${c.green("ok")}    ${text}`);
export const warn = (text) => say(`  ${c.yellow("look")}  ${text}`);
export const bad = (text) => say(`  ${c.red("fix")}   ${text}`);
export const note = (text) => say(`  ${c.dim(text)}`);

/** Wrap long text for the terminal, with an indent on following lines. */
export function wrap(text, indent = 8, width = Math.min(process.stdout.columns || 80, 100)) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if (line && line.length + w.length + 1 > width - indent) { lines.push(line); line = w; }
    else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line);
  return lines.join(`\n${" ".repeat(indent)}`);
}

/**
 * Questions on the terminal. With no terminal (piped input, CI) answers are
 * read line by line from standard input, and a missing answer is the default.
 */
export function createPrompter({ input = process.stdin, output = process.stdout } = {}) {
  const interactive = !!input.isTTY && !!output.isTTY;
  let rl = null;
  const queue = [];
  const waiting = [];
  let closed = false;
  if (!interactive) {
    rl = readline.createInterface({ input, terminal: false });
    rl.on("line", (line) => (waiting.length ? waiting.shift()(line) : queue.push(line)));
    rl.on("close", () => { closed = true; while (waiting.length) waiting.shift()(null); });
  }

  function readLine(question, hidden) {
    if (!interactive) {
      output.write(`${question}`);
      return new Promise((resolve) => {
        const done = (line) => { output.write("\n"); resolve(line); };
        if (queue.length) done(queue.shift());
        else if (closed) done(null);
        else waiting.push(done);
      });
    }
    return new Promise((resolve) => {
      const one = readline.createInterface({ input, output, terminal: true });
      if (hidden) {
        // Show the question, then stars instead of what is typed.
        let shown = false;
        one._writeToOutput = (text) => {
          if (!shown) { output.write(text); shown = true; return; }
          output.write(/[\r\n]/.test(text) ? text : "*".repeat(text.length));
        };
      }
      one.question(question, (answer) => { one.close(); resolve(answer); });
      one.on("SIGINT", () => { one.close(); output.write("\n"); process.exit(130); });
    });
  }

  return {
    interactive,
    /** Ask for text. Enter alone gives `fallback`. */
    async ask(label, { fallback = "", hidden = false, hint = "" } = {}) {
      const shownDefault = fallback ? (hidden ? " [Enter keeps the current one]" : ` [${fallback}]`) : "";
      if (hint) say(c.dim(`  ${wrap(hint, 2)}`));
      const answer = await readLine(`${c.cyan("?")} ${label}${c.dim(shownDefault)}: `, hidden);
      const text = String(answer ?? "").trim();
      return text || fallback;
    },
    /** Yes or no. */
    async confirm(label, fallback = true) {
      const answer = await readLine(`${c.cyan("?")} ${label} ${c.dim(fallback ? "[Y/n]" : "[y/N]")}: `, false);
      const text = String(answer ?? "").trim().toLowerCase();
      if (!text) return fallback;
      return ["y", "yes", "হ্যাঁ"].includes(text);
    },
    close() { rl?.close(); },
  };
}

/** A one-line progress bar; returns the function to call with (done, total). */
export function progressBar(label) {
  let last = -1;
  return (done, total) => {
    const pct = total ? Math.floor((done / total) * 100) : 0;
    if (pct === last) return;
    last = pct;
    if (process.stdout.isTTY) {
      const filled = Math.round(pct / 4);
      process.stdout.write(`\r  ${label} [${"#".repeat(filled)}${".".repeat(25 - filled)}] ${String(pct).padStart(3)}%`);
      if (pct >= 100) process.stdout.write("\n");
    } else if (pct % 20 === 0) say(`  ${label} ${pct}%`);
  };
}

/** --name value, --name=value and --flag into an object; the rest in `_`. */
export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { out._.push(a); continue; }
    const eq = a.indexOf("=");
    if (eq > -1) out[a.slice(2, eq)] = a.slice(eq + 1);
    else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) out[a.slice(2)] = argv[++i];
    else out[a.slice(2)] = true;
  }
  return out;
}
