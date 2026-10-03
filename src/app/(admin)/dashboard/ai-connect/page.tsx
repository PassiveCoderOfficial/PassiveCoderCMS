"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Copy, Check, KeyRound, Plug, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Conn = { id: string; type: "token" | "app"; name: string; prefix: string | null; scope: "read" | "write"; created_at: string; last_used_at: string | null };
type Activity = { tool: string; ok: boolean; error: string | null; created_at: string; mine: boolean };

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const MCP_URL = ROOT.includes("localhost") ? `http://${ROOT}/api/mcp` : `https://www.${ROOT}/api/mcp`;

function CopyBox({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className={cn("relative group", className)}>
      <pre className="rounded-lg bg-muted px-3 py-2.5 pr-10 text-xs font-mono whitespace-pre-wrap break-all">{text}</pre>
      <button
        type="button"
        onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
        className="absolute top-2 right-2 p-1 rounded hover:bg-background"
        aria-label="Copy"
      >
        {done ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}

const APPS: { key: string; label: string; oauth: boolean; steps: (token: string) => { text: string; code?: string }[] }[] = [
  {
    key: "claude", label: "Claude (web & desktop)", oauth: true,
    steps: () => [
      { text: "In Claude, open Settings > Connectors > Add custom connector." },
      { text: "Name it Passive Coder and paste this URL:", code: MCP_URL },
      { text: "Click Connect, sign in here, choose the site and access level, then Allow." },
    ],
  },
  {
    key: "chatgpt", label: "ChatGPT", oauth: true,
    steps: () => [
      { text: "In ChatGPT, open Settings > Apps & Connectors > Advanced and turn on Developer mode." },
      { text: "Create a connector with this MCP server URL and OAuth authentication:", code: MCP_URL },
      { text: "Sign in here when asked, pick the site, then Allow." },
    ],
  },
  {
    key: "claude-code", label: "Claude Code", oauth: true,
    steps: (token) => [
      { text: "Sign in with your account (recommended):", code: `claude mcp add --transport http passivecoder ${MCP_URL}` },
      { text: "Then run /mcp inside Claude Code and choose Authenticate. Or use a personal token instead:", code: `claude mcp add --transport http passivecoder ${MCP_URL} --header "Authorization: Bearer ${token}"` },
    ],
  },
  {
    key: "codex", label: "Codex CLI", oauth: false,
    steps: (token) => [
      { text: "Add to ~/.codex/config.toml:", code: `[mcp_servers.passivecoder]\nurl = "${MCP_URL}"\nbearer_token_env_var = "PASSIVECODER_TOKEN"` },
      { text: "Then set the token in your shell before starting Codex:", code: `export PASSIVECODER_TOKEN=${token}` },
    ],
  },
  {
    key: "gemini", label: "Gemini CLI", oauth: false,
    steps: (token) => [
      { text: "Add to ~/.gemini/settings.json:", code: JSON.stringify({ mcpServers: { passivecoder: { httpUrl: MCP_URL, headers: { Authorization: `Bearer ${token}` } } } }, null, 2) },
    ],
  },
  {
    key: "cursor", label: "Cursor / other", oauth: false,
    steps: (token) => [
      { text: "Add to .cursor/mcp.json (or your app's MCP settings):", code: JSON.stringify({ mcpServers: { passivecoder: { url: MCP_URL, headers: { Authorization: `Bearer ${token}` } } } }, null, 2) },
    ],
  },
];

/**
 * AI Connect: connect your own AI agent (Claude, ChatGPT, Codex, Gemini,
 * Cursor) to this site's dashboard through the Passive Coder MCP server
 * (app/api/mcp). Sign-in apps use OAuth; CLIs use a personal access token.
 */
export default function AiConnectPage() {
  const [data, setData] = useState<{ access: "read" | "write"; tokens: Conn[]; activity: Activity[] } | null>(null);
  const [app, setApp] = useState("claude");
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"read" | "write">("write");
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/mcp-tokens");
    if (r.ok) setData(await r.json());
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function create() {
    if (!name.trim()) { toast.error("Give the token a name, e.g. My laptop - Codex"); return; }
    setCreating(true);
    const r = await fetch("/api/mcp-tokens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, scope }) });
    const d = await r.json().catch(() => ({}));
    setCreating(false);
    if (!r.ok) { toast.error(d.error ?? "Could not create token"); return; }
    setNewToken(d.token); setName(""); void load();
  }

  async function revoke(id: string) {
    if (!confirm("Disconnect this? The AI app or tool using it will stop working immediately.")) return;
    const r = await fetch(`/api/mcp-tokens?id=${id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Disconnected"); void load(); } else toast.error("Could not disconnect");
  }

  const selected = APPS.find((a) => a.key === app)!;
  const tokenForSteps = newToken ?? "YOUR_TOKEN";

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="w-6 h-6 text-primary" /> AI Connect</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Use your own AI assistant (Claude, ChatGPT, Codex, Gemini, Cursor) to work on this site in plain words: build and edit pages, write blog posts, update products, handle orders, bookings and leads.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plug className="w-4 h-4" /> Connect your AI app</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Server URL</p>
            <CopyBox text={MCP_URL} />
          </div>
          <div className="flex flex-wrap gap-2">
            {APPS.map((a) => (
              <button key={a.key} type="button" onClick={() => setApp(a.key)}
                className={cn("rounded-full border px-3 py-1.5 text-sm", app === a.key ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>
                {a.label}
              </button>
            ))}
          </div>
          <ol className="space-y-3 list-decimal pl-5">
            {selected.steps(tokenForSteps).map((s, i) => (
              <li key={i} className="text-sm space-y-1.5">
                <span>{s.text}</span>
                {s.code && <CopyBox text={s.code} />}
              </li>
            ))}
          </ol>
          {!selected.oauth && !newToken && (
            <p className="text-xs text-amber-700 dark:text-amber-300">This app needs a personal access token: create one below, and it will be filled into these steps.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><KeyRound className="w-4 h-4" /> Personal access tokens</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {newToken && (
            <div className="rounded-lg border border-green-500/40 bg-green-500/5 p-3 space-y-2">
              <p className="text-sm font-medium">Copy your token now. It won&apos;t be shown again.</p>
              <CopyBox text={newToken} />
            </div>
          )}
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My laptop - Codex" />
            </div>
            <select value={scope} onChange={(e) => setScope(e.target.value as "read" | "write")} className="h-9 rounded-md border bg-background px-2 text-sm">
              <option value="write" disabled={data?.access === "read"}>View and edit</option>
              <option value="read">View only</option>
            </select>
            <Button onClick={create} disabled={creating}>{creating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Create token</Button>
          </div>
          <p className="text-xs text-muted-foreground">Tokens work for this site only, last one year, and never allow more than your own role. Agents can never delete anything.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Your connections to this site</CardTitle></CardHeader>
        <CardContent>
          {!data ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : data.tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing connected yet.</p>
          ) : (
            <ul className="divide-y">
              {data.tokens.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex-1 min-w-0">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{t.type === "app" ? "Signed-in app" : `Token ${t.prefix}…`} · {t.scope === "write" ? "view and edit" : "view only"}</span>
                    <span className="block text-xs text-muted-foreground">
                      Created {new Date(t.created_at).toLocaleDateString()} · {t.last_used_at ? `last used ${new Date(t.last_used_at).toLocaleString()}` : "never used"}
                    </span>
                  </span>
                  <Button size="sm" variant="outline" onClick={() => revoke(t.id)}><Trash2 className="w-3.5 h-3.5 mr-1" /> Disconnect</Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Recent AI activity on this site</CardTitle></CardHeader>
        <CardContent>
          {!data?.activity.length ? <p className="text-sm text-muted-foreground">No activity yet.</p> : (
            <ul className="space-y-1 text-xs">
              {data.activity.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-muted-foreground w-36 shrink-0">{new Date(a.created_at).toLocaleString()}</span>
                  <span className={cn("font-mono", a.ok ? "" : "text-red-600")}>{a.tool}</span>
                  {!a.ok && a.error && <span className="text-red-600 truncate">{a.error}</span>}
                  {!a.mine && <span className="text-muted-foreground">(another team member)</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
