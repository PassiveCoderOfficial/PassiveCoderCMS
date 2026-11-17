"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Copy, Trash2, PlugZap, Truck } from "lucide-react";

/**
 * Steadfast + Pathao account cards. One component for both places:
 *  - seller panel (/vendor/courier): the seller's own accounts
 *  - admin Delivery page: the store's platform accounts (sellers without
 *    their own book through these)
 * `api` is the base route; both answer GET {own, platform, webhooks},
 * POST save (+ test), DELETE ?provider=, POST /test.
 */
type Provider = "steadfast" | "pathao";
interface Account {
  id: string;
  provider: Provider;
  mode: "live" | "sandbox";
  credentials: Record<string, string>;
  store_id: string | null;
  store_name: string | null;
  default_delivery_type: number;
  default_item_weight: number;
  webhook_token: string;
  integration_secret: string | null;
  allow_sellers: boolean;
  active: boolean;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_error: string | null;
}
interface State {
  own: Account[];
  platform: { provider: Provider; mode: string; store_name: string | null }[];
  webhooks: { steadfast: string; pathao: string };
}

const FIELDS: Record<Provider, { key: string; label: string; secret?: boolean }[]> = {
  steadfast: [
    { key: "api_key", label: "API key", secret: true },
    { key: "secret_key", label: "Secret key", secret: true },
  ],
  pathao: [
    { key: "client_id", label: "Client ID", secret: true },
    { key: "client_secret", label: "Client secret", secret: true },
    { key: "username", label: "Merchant login email" },
    { key: "password", label: "Merchant login password", secret: true },
  ],
};
const SANDBOX = { client_id: "7N1aMJQbWm", client_secret: "wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39", username: "test@pathao.com", password: "lovePathao" };
const NAME: Record<Provider, string> = { steadfast: "Steadfast", pathao: "Pathao" };

const inputCls = "w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary";
const btn = "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold disabled:opacity-50";

export function CourierAccounts({ api, variant }: { api: string; variant: "seller" | "platform" }) {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch(api);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setError(d.error ?? "Could not load"); return; }
    setState(d);
  }, [api]);
  useEffect(() => { load(); }, [load]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!state) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {(["steadfast", "pathao"] as Provider[]).map((p) => (
        <ProviderCard
          key={p}
          provider={p}
          api={api}
          variant={variant}
          account={state.own.find((a) => a.provider === p) ?? null}
          platform={state.platform.find((a) => a.provider === p) ?? null}
          webhook={state.webhooks[p]}
          onChange={load}
        />
      ))}
    </div>
  );
}

function ProviderCard({ provider, api, variant, account, platform, webhook, onChange }: {
  provider: Provider; api: string; variant: "seller" | "platform"; account: Account | null;
  platform: State["platform"][number] | null; webhook: string; onChange: () => void;
}) {
  const [editing, setEditing] = useState(!account);
  const [creds, setCreds] = useState<Record<string, string>>(account?.credentials ?? {});
  const [mode, setMode] = useState<"live" | "sandbox">(account?.mode ?? "live");
  const [storeId, setStoreId] = useState(account?.store_id ?? "");
  const [stores, setStores] = useState<{ store_id: number; store_name: string }[]>([]);
  const [deliveryType, setDeliveryType] = useState(account?.default_delivery_type ?? 48);
  const [weight, setWeight] = useState(String(account?.default_item_weight ?? 0.5));
  const [allowSellers, setAllowSellers] = useState(account?.allow_sellers ?? true);
  const [integration, setIntegration] = useState(account?.integration_secret ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setCreds(account?.credentials ?? {});
    setMode(account?.mode ?? "live");
    setStoreId(account?.store_id ?? "");
    // A Pathao account saved without a pickup store stays open so the seller
    // can pick from the stores the test just loaded.
    setEditing(!account || (provider === "pathao" && !account.store_id));
  }, [account, provider]);

  async function save(extra: Record<string, unknown> = {}) {
    setBusy("save");
    setMsg(null);
    const store = stores.find((s) => String(s.store_id) === String(storeId));
    const r = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider, mode, credentials: creds, store_id: storeId || null, store_name: store?.store_name ?? account?.store_name ?? null,
        default_delivery_type: deliveryType, default_item_weight: weight, allow_sellers: allowSellers,
        integration_secret: integration, ...extra,
      }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(null);
    if (!r.ok) { setMsg({ ok: false, text: d.error ?? "Could not save" }); return; }
    if (d.test) {
      setMsg({ ok: d.test.ok, text: d.test.message });
      if (d.test.stores) {
        setStores(d.test.stores);
        if (!storeId && d.test.stores.length === 1) setStoreId(String(d.test.stores[0].store_id));
      }
    } else setMsg({ ok: true, text: "Saved" });
    if (d.test?.ok && (provider !== "pathao" || storeId)) setEditing(false);
    onChange();
  }

  async function test() {
    setBusy("test");
    setMsg(null);
    const r = await fetch(`${api}/test`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider }) });
    const d = await r.json().catch(() => ({}));
    setBusy(null);
    setMsg({ ok: !!d.ok, text: d.message ?? d.error ?? "Test failed" });
    if (d.stores) setStores(d.stores);
    onChange();
  }

  async function remove() {
    if (!confirm(`Remove the ${NAME[provider]} account? Parcels already booked keep their tracking.`)) return;
    setBusy("remove");
    await fetch(`${api}?provider=${provider}`, { method: "DELETE" });
    setBusy(null);
    onChange();
  }

  const connected = !!account && account.last_test_ok !== false;
  const needsStore = provider === "pathao" && account && !account.store_id;

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Truck className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{NAME[provider]}</p>
          <p className="text-xs text-muted-foreground">
            {account
              ? `${connected ? "Connected" : "Login failed"}${account.mode === "sandbox" ? " (sandbox, test parcels only)" : ""}${account.store_name ? ` · ${account.store_name}` : ""}`
              : platform && variant === "seller"
                ? `Not connected. You can still book with the store's ${NAME[provider]} account.`
                : "Not connected"}
          </p>
        </div>
        {account && (connected ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-destructive" />)}
      </div>

      {variant === "seller" && platform && !account && (
        <p className="text-xs rounded-lg bg-muted/60 px-3 py-2">
          Booking with the store&apos;s account: the courier pays cash on delivery to the store, and the store pays you out from your balance.
          Connect your own account to receive COD from {NAME[provider]} directly.
        </p>
      )}

      {account && !editing && (
        <div className="space-y-2 text-sm">
          {FIELDS[provider].map((f) => (
            <div key={f.key} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{f.label}</span>
              <span className="font-mono text-xs truncate">{account.credentials[f.key] || "-"}</span>
            </div>
          ))}
          {provider === "pathao" && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Delivery</span>
              <span>{account.default_delivery_type === 12 ? "On demand (12h)" : "Normal (48h)"} · {Number(account.default_item_weight)} kg default</span>
            </div>
          )}
          {account.last_error && <p className="text-xs text-destructive">{account.last_error}</p>}
          {needsStore && <p className="text-xs text-destructive">Pick your pickup store: tap Edit, then Save and test.</p>}
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          {provider === "pathao" && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={mode === "sandbox"} onChange={(e) => setMode(e.target.checked ? "sandbox" : "live")} className="w-4 h-4 accent-[hsl(var(--primary))]" />
                Sandbox (test mode)
              </label>
              {mode === "sandbox" && (
                <button type="button" onClick={() => setCreds({ ...SANDBOX })} className="text-xs font-semibold text-primary hover:underline">
                  Fill Pathao test login
                </button>
              )}
            </div>
          )}
          {FIELDS[provider].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium mb-1">{f.label}</label>
              <input
                className={inputCls}
                type={f.secret && f.key === "password" ? "password" : "text"}
                autoComplete="off"
                value={creds[f.key] ?? ""}
                onFocus={(e) => { if (e.target.value.includes("••")) setCreds({ ...creds, [f.key]: "" }); }}
                onChange={(e) => setCreds({ ...creds, [f.key]: e.target.value })}
                placeholder={account ? "Leave as is to keep the saved value" : ""}
              />
            </div>
          ))}
          {provider === "pathao" && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1">Pickup store</label>
                {stores.length ? (
                  <select className={inputCls} value={storeId} onChange={(e) => setStoreId(e.target.value)}>
                    <option value="">Choose a store</option>
                    {stores.map((s) => <option key={s.store_id} value={s.store_id}>{s.store_name}</option>)}
                  </select>
                ) : (
                  <p className="text-xs text-muted-foreground">{account?.store_name ? `${account.store_name}. ` : ""}Save and test to load your Pathao stores.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Delivery type</label>
                  <select className={inputCls} value={deliveryType} onChange={(e) => setDeliveryType(Number(e.target.value))}>
                    <option value={48}>Normal (48h)</option>
                    <option value={12}>On demand (12h)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Default parcel weight (kg)</label>
                  <input className={inputCls} type="number" min="0.5" max="10" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
              </div>
            </>
          )}
          {variant === "platform" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allowSellers} onChange={(e) => setAllowSellers(e.target.checked)} className="w-4 h-4 accent-[hsl(var(--primary))]" />
              Sellers without their own account can book through this one
            </label>
          )}
        </div>
      )}

      {msg && (
        <p className={`text-sm rounded-lg px-3 py-2 ${msg.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{msg.text}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {editing ? (
          <>
            <button onClick={() => save()} disabled={!!busy} className={`${btn} bg-primary text-primary-foreground`}>
              {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />} Save and test
            </button>
            {account && <button onClick={() => setEditing(false)} className={`${btn} text-muted-foreground`}>Cancel</button>}
          </>
        ) : (
          <>
            <button onClick={test} disabled={!!busy} className={`${btn} border hover:border-primary`}>
              {busy === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />} Test connection
            </button>
            <button onClick={() => setEditing(true)} className={`${btn} border hover:border-primary`}>Edit</button>
            <button onClick={remove} disabled={!!busy} className={`${btn} text-destructive ml-auto`} aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
          </>
        )}
      </div>

      {account && (
        <div className="border-t pt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live status updates (webhook)</p>
          <p className="text-xs text-muted-foreground">
            {provider === "steadfast"
              ? "In the Steadfast merchant panel open the API webhook settings, paste this URL as the callback and this token as the Bearer token."
              : "In the Pathao merchant panel open Developer API > Webhook integration, paste this URL and the token as the secret."}
          </p>
          <CopyRow label="Webhook URL" value={webhook} />
          <CopyRow label={provider === "steadfast" ? "Bearer token" : "Secret"} value={account.webhook_token} />
          {provider === "pathao" && editing && (
            <div>
              <label className="block text-xs font-medium mb-1">Integration secret (only if Pathao shows one)</label>
              <input className={inputCls} value={integration} onChange={(e) => setIntegration(e.target.value)} placeholder="Leave empty to use Pathao's standard value" />
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">Without the webhook, statuses still update once a day and whenever a customer opens the tracking page.</p>
        </div>
      )}
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <code className="flex-1 min-w-0 truncate text-xs bg-muted/60 rounded px-2 py-1.5">{value}</code>
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); }}
        className="shrink-0 p-1.5 rounded hover:bg-muted"
        aria-label={`Copy ${label}`}
      >
        {done ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
