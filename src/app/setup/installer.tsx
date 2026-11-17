"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bot, Check, CheckCircle2, ChevronLeft, Circle, Copy, ExternalLink, Eye, EyeOff, Loader2, Lock, RefreshCw, Sparkles, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "@/lib/currency/currencies";
import { LanguageProvider, useLanguage } from "@/lib/i18n/language-provider";
import { en } from "@/lib/i18n/locales/en";
import { bn } from "@/lib/i18n/locales/bn";
import { ISSUES_URL, fixPrompt } from "../../../selfhost/lib/agent-help.mjs";

/*
 * The web installer for a self-hosted install (standalone mode only).
 * Steps: system check (and database set-up), site, admin account, optional
 * extras, finish. Every call goes to /api/setup/*, which refuses once a site
 * exists; the setup code (SETUP_TOKEN) travels in the "x-setup-token" header
 * and is kept for this browser tab only.
 */

type Status = "ok" | "warn" | "fail" | "skip";
type CheckResult = { id: string; status: Status; code: string; params: Record<string, string | number> };
type Platform = "vercel" | "docker" | "node";
type CheckData = {
  platform: Platform;
  version: string;
  needsToken: boolean;
  results: CheckResult[];
  summary: { ready: boolean; blocking: string[]; canLoadDatabase: boolean; canUpdateDatabase: boolean; pendingMigrations: number };
  canSave: boolean;
  has: { email: boolean; smtp?: boolean; emailFrom: boolean; ai: boolean; licence: boolean; pcAi?: boolean };
  templates: { slug: string; name: string; category: string | null }[];
};
type Extras = { email: "saved" | "manual" | "skipped" | "invalid"; ai: "saved" | "manual" | "skipped" | "invalid"; licence: "saved" | "manual" | "skipped" | "invalid" };
type Note = { ok: boolean; text: string } | null;

const DICTS = { en, bn } as Record<string, Record<string, string>>;
const CODE_KEY = "pc-setup-code";
const DOCS_URL = "https://github.com/PassiveCoderOfficial/PassiveCoderCMS/blob/main/selfhost/README.md";
const AI_SIGNUP_URL = "https://passivecoder.com/api-signup";
/** Where to turn when stuck: the paid install service, the hosted trial. */
const INSTALL_SERVICE_URL = (platform: Platform) => `https://passivecoder.com/api/open-source/checkout?item=${platform === "docker" ? "install_server" : "install_cloud"}`;
const HOSTED_TRIAL_URL = "https://passivecoder.com";
const SITE_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা (Bangla)" },
  { value: "ar", label: "العربية (Arabic)" },
];
/** A sensible first guess; the owner can pick any currency. */
const ZONE_CURRENCY: Record<string, string> = {
  "Asia/Dhaka": "BDT", "Asia/Dubai": "AED", "Asia/Kuala_Lumpur": "MYR", "Asia/Singapore": "SGD", "Asia/Riyadh": "SAR",
  "Asia/Qatar": "QAR", "Asia/Muscat": "OMR", "Asia/Kolkata": "INR", "Asia/Calcutta": "INR", "Europe/London": "GBP",
};
/** Settings the installer can make a fresh value for (in the browser). */
const SECRET_FOR: Record<string, string> = {
  courier_key_missing: "COURIER_SECRET_KEY", courier_key_bad: "COURIER_SECRET_KEY", cron_secret_missing: "CRON_SECRET",
  app_secret_missing: "APP_SECRET", app_secret_short: "APP_SECRET", setup_token_missing: "SETUP_TOKEN",
};

function randomSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function timeZones(): string[] {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone");
    if (list?.length) return list;
  } catch { /* older browser */ }
  return ["UTC", "Asia/Dhaka", "Asia/Dubai", "Asia/Kolkata", "Asia/Kuala_Lumpur", "Asia/Qatar", "Asia/Riyadh", "Asia/Singapore", "Europe/London", "America/New_York", "America/Los_Angeles", "Australia/Sydney"];
}

const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function Installer() {
  return (
    <LanguageProvider>
      <InstallerInner />
    </LanguageProvider>
  );
}

function InstallerInner() {
  const { language, setLanguage } = useLanguage();
  const t = useCallback((key: string, vars?: Record<string, string | number>, fallback?: string) => {
    let str = DICTS[language]?.[key] ?? DICTS.en[key] ?? fallback ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) str = str.split(`{${k}}`).join(String(v));
    return str;
  }, [language]);

  const tokenRef = useRef("");
  const [phase, setPhase] = useState<"loading" | "code" | "wizard">("loading");
  const [codeInput, setCodeInput] = useState("");
  const [codeWrong, setCodeWrong] = useState(false);
  const [platform, setPlatform] = useState<Platform>("node");
  const [step, setStep] = useState(0);

  // Step 0
  const [check, setCheck] = useState<CheckData | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [db, setDb] = useState<{ action: "load" | "update"; percent: number } | null>(null);
  const [dbError, setDbError] = useState<{ text: string; detail?: string } | null>(null);
  const [dbDone, setDbDone] = useState(false);
  const [explain, setExplain] = useState<{ busy: boolean; text?: string; error?: string } | null>(null);

  // Steps 1 and 2
  const zones = useMemo(timeZones, []);
  const [siteName, setSiteName] = useState("");
  const [siteLanguage, setSiteLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("USD");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Step 3
  const [template, setTemplate] = useState("starter");
  const [emailKey, setEmailKey] = useState("");
  // Most owners already have a mailbox (their host, Gmail): SMTP comes first.
  const [emailVia, setEmailVia] = useState<"smtp" | "resend">("smtp");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [emailNote, setEmailNote] = useState<Note>(null);
  const [aiKey, setAiKey] = useState("");
  const [aiNote, setAiNote] = useState<Note>(null);
  const [licence, setLicence] = useState<{ text: string; domain: string; modules: string[] } | null>(null);
  const [licenceNote, setLicenceNote] = useState<Note>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Step 4
  const [done, setDone] = useState<{ extras: Extras; signedIn: boolean } | null>(null);

  const api = useCallback(async (path: string, body: unknown) => {
    return fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(tokenRef.current ? { "x-setup-token": tokenRef.current } : {}) },
      body: JSON.stringify(body),
    });
  }, []);

  const runCheck = useCallback(async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const res = await api("/api/setup/check", { origin: window.location.origin });
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) return window.location.assign("/login");
      if (res.status === 401 || res.status === 403) {
        setCodeWrong(res.status === 403);
        setPhase("code");
        return;
      }
      if (!res.ok) throw new Error(body.code ?? "failed");
      if (tokenRef.current) sessionStorage.setItem(CODE_KEY, tokenRef.current);
      setCheck(body as CheckData);
      setPlatform((body as CheckData).platform);
      setPhase("wizard");
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setCheckError(code === "rate_limited" ? t("installer.result.rate_limited") : t("installer.check.failed"));
      setPhase((p) => (p === "loading" ? "wizard" : p));
    } finally {
      setChecking(false);
    }
  }, [api, t]);

  // First load: the setup code from the link (#code=...) or this tab's memory.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const fromLink = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("code");
    if (fromLink) history.replaceState(null, "", window.location.pathname);
    tokenRef.current = (fromLink ?? sessionStorage.getItem(CODE_KEY) ?? "").trim();
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setTimezone(zone);
    setCurrency(ZONE_CURRENCY[zone] ?? (zone.startsWith("Europe/") ? "EUR" : "USD"));
    void runCheck();
  }, [runCheck]);

  // The site's language starts as the language the installer is read in.
  const languageTouched = useRef(false);
  useEffect(() => {
    if (!languageTouched.current) setSiteLanguage(language === "bn" ? "bn" : "en");
  }, [language]);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    tokenRef.current = codeInput.trim();
    await runCheck();
  }

  async function runDatabase(action: "load" | "update") {
    setDb({ action, percent: 0 });
    setDbError(null);
    setDbDone(false);
    let finished = false;
    try {
      const res = await api("/api/setup/database", { action });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw Object.assign(new Error(body.code ?? "database_failed"), { detail: undefined });
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done: end } = await reader.read();
        if (end) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line) as { type: string; done?: number; total?: number; code?: string; message?: string };
          if (msg.type === "progress" && msg.total) setDb({ action, percent: Math.min(99, Math.round(((msg.done ?? 0) / msg.total) * 100)) });
          else if (msg.type === "done") finished = true;
          else if (msg.type === "error") throw Object.assign(new Error(msg.code ?? "database_failed"), { detail: msg.message });
        }
      }
      if (!finished) throw new Error("database_failed");
      setDbDone(true);
    } catch (e) {
      const code = e instanceof Error ? e.message : "database_failed";
      setDbError({ text: t(`installer.result.${code}`, undefined, t("installer.db.failed")), detail: (e as { detail?: string }).detail });
    } finally {
      setDb(null);
      await runCheck();
    }
  }

  /** "Explain this": failed checks (ids, codes, setting names) to Passive Coder AI. */
  async function runExplain() {
    const failed = check?.results.filter((r) => r.status === "fail") ?? [];
    if (!failed.length) return;
    setExplain({ busy: true });
    try {
      const res = await api("/api/setup/explain", { platform, checks: failed.map(({ id, code, params }) => ({ id, code, params })) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok && body.text) setExplain({ busy: false, text: String(body.text) });
      else if (res.status === 409) window.location.assign("/login");
      else setExplain({ busy: false, error: t(body.code === "rate_limited" ? "installer.result.rate_limited" : body.code === "ai_no_credits" ? "installer.ai.noCredits" : body.code === "ai_key_invalid" ? "installer.result.ai_key_invalid" : "installer.ai.explainFailed") });
    } catch {
      setExplain({ busy: false, error: t("installer.ai.explainFailed") });
    }
  }

  function nextFromSite() {
    if (!siteName.trim()) return setFormError(t("installer.site.nameNeeded"));
    setFormError(null);
    setStep(2);
  }

  function nextFromAccount() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setFormError(t("installer.account.emailNeeded"));
    if (password.length < 8) return setFormError(t("installer.account.short"));
    if (password !== confirm) return setFormError(t("installer.account.mismatch"));
    setFormError(null);
    setStep(3);
  }

  /** What the owner typed for outgoing email: an SMTP server or a Resend key (nothing = keep what is saved). */
  function emailServer(): { smtp: { host: string; port: number; user?: string; pass?: string } } | { apiKey: string } | null {
    if (emailVia === "smtp" && smtpHost.trim()) {
      return { smtp: { host: smtpHost.trim(), port: Number(smtpPort) || 587, ...(smtpUser.trim() ? { user: smtpUser.trim() } : {}), ...(smtpPass ? { pass: smtpPass } : {}) } };
    }
    if (emailVia === "resend" && emailKey.trim()) return { apiKey: emailKey.trim() };
    return null;
  }

  async function runTest(kind: "email" | "ai", body: Record<string, unknown>, setNote: (n: Note) => void) {
    setBusy(kind);
    setNote(null);
    try {
      const res = await api("/api/setup/test", { kind, ...body });
      const data = await res.json().catch(() => ({}));
      const code = String(data.code ?? "network");
      const text = t(`installer.result.${code}`, { domain: data.domain ?? "" }, t("installer.result.network"));
      setNote({ ok: !!data.ok, text: data.detail && !data.ok && /^(email_|smtp_)/.test(code) ? `${text} (${data.detail})` : text });
    } catch {
      setNote({ ok: false, text: t("installer.result.network") });
    } finally {
      setBusy(null);
    }
  }

  async function pickLicence(file: File | undefined) {
    if (!file) return;
    setLicenceNote(null);
    setLicence(null);
    setBusy("licence");
    try {
      const text = (await file.text()).slice(0, 20_000);
      const res = await api("/api/setup/test", { kind: "licence", text });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setLicence({ text, domain: data.domain, modules: data.modules ?? [] });
      } else {
        setLicenceNote({ ok: false, text: t(`installer.result.${data.code ?? "licence_invalid"}`, { domain: data.domain ?? "" }, t("installer.result.licence_invalid")) });
      }
    } catch {
      setLicenceNote({ ok: false, text: t("installer.result.network") });
    } finally {
      setBusy(null);
    }
  }

  async function install() {
    setBusy("install");
    setFormError(null);
    try {
      const wantsEmail = !!emailFrom.trim() && (!!emailServer() || !!check?.has.email);
      const res = await api("/api/setup", {
        siteName: siteName.trim(), email: email.trim(), password, language: siteLanguage, timezone, currency, template,
        ...(wantsEmail ? { emailSettings: { ...emailServer(), from: emailFrom.trim() } } : {}),
        ...(aiKey.trim() ? { aiKey: aiKey.trim() } : {}),
        ...(licence ? { licence: licence.text } : {}),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) return window.location.assign("/login");
        throw new Error(t(`installer.result.${body.code ?? "network"}`, undefined, body.error ?? t("installer.result.network")));
      }
      sessionStorage.removeItem(CODE_KEY);
      tokenRef.current = "";
      const { error: signInError } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
      setPassword("");
      setConfirm("");
      setDone({ extras: body.extras as Extras, signedIn: !signInError });
      setStep(4);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t("installer.result.network"));
    } finally {
      setBusy(null);
    }
  }

  const steps = ["check", "site", "account", "extras", "finish"] as const;
  const fails = check?.results.filter((r) => r.status === "fail").length ?? 0;
  const warns = check?.results.filter((r) => r.status === "warn").length ?? 0;
  const cronOk = check?.results.find((r) => r.id === "cron")?.status === "ok";

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t("installer.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("installer.subtitle")}</p>
          </div>
          <div className="flex shrink-0 rounded-md border bg-background p-0.5 text-xs" role="group" aria-label="Language">
            {(["en", "bn"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                aria-pressed={language === l}
                className={cn("rounded px-2.5 py-1.5 font-medium transition-colors", language === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {l === "en" ? "English" : "বাংলা"}
              </button>
            ))}
          </div>
        </header>

        {phase === "loading" && (
          <Card><CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("installer.loading")}</CardContent></Card>
        )}

        {phase === "code" && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={submitCode} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">{t("installer.code.title")}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{t("installer.code.help")}</p>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-code">{t("installer.code.label")}</Label>
                  <Input id="setup-code" type="password" autoComplete="off" autoFocus required value={codeInput} onChange={(e) => setCodeInput(e.target.value)} className="h-10" />
                </div>
                {codeWrong && <p className="text-sm text-destructive" role="alert">{t("installer.code.wrong")}</p>}
                {checkError && <p className="text-sm text-destructive" role="alert">{checkError}</p>}
                <div className="space-y-1 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
                  <p>{t("installer.code.where.vercel")}</p>
                  <p>{t("installer.code.where.docker")}</p>
                  <p>{t("installer.code.where.node")}</p>
                </div>
                <Button type="submit" className="h-10 w-full" disabled={checking}>
                  {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{t("installer.next")}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {phase === "wizard" && (
          <>
            <ol className="mb-4 flex items-center gap-1.5" aria-label={t("installer.stepOf", { n: step + 1, total: steps.length })}>
              {steps.map((s, i) => (
                <li key={s} className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className={cn("h-1.5 rounded-full", i < step ? "bg-primary" : i === step ? "bg-primary/70" : "bg-border")} />
                  <span className={cn("hidden truncate text-xs sm:block", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>{t(`installer.step.${s}`)}</span>
                </li>
              ))}
            </ol>
            <p className="mb-3 text-xs text-muted-foreground sm:hidden">{t("installer.stepOf", { n: step + 1, total: steps.length })}: <span className="font-medium text-foreground">{t(`installer.step.${steps[step]}`)}</span></p>

            <Card>
              <CardContent className="space-y-5 pt-6">
                {/* ── Step 0: system check ─────────────────────────────── */}
                {step === 0 && (
                  <>
                    <div>
                      <h2 className="text-lg font-semibold">{t("installer.step.check")}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{t("installer.check.intro")}</p>
                    </div>

                    {checkError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{checkError}</p>}

                    {check && (
                      <ul className="divide-y rounded-lg border">
                        {check.results.map((r) => (
                          <li key={r.id} className="flex gap-3 p-3">
                            <StatusIcon status={r.status} label={t(`installer.check.status.${r.status}`)} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{t(`installer.check.title.${r.id}`)}</p>
                              <p className={cn("mt-0.5 break-words text-sm", r.status === "fail" ? "text-foreground" : "text-muted-foreground")}>{t(`installer.fix.${r.code}`, r.params)}</p>
                              {r.status !== "ok" && SECRET_FOR[r.code] && <SecretOffer name={SECRET_FOR[r.code]} t={t} />}
                              {r.status === "fail" && <AskAi result={r} platform={platform} version={check.version} t={t} />}
                              {r.id === "schema" && r.code === "schema_empty" && check.summary.canLoadDatabase && !db && (
                                <Button className="mt-3 h-10" onClick={() => runDatabase("load")}>{t("installer.db.setup")}</Button>
                              )}
                              {r.id === "schema" && r.code === "schema_pending" && check.summary.canUpdateDatabase && !db && (
                                <Button variant="outline" className="mt-3 h-10" onClick={() => runDatabase("update")}>{t("installer.db.update")}</Button>
                              )}
                              {r.id === "schema" && db && (
                                <div className="mt-3 space-y-2" role="status" aria-live="polite">
                                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(4, db.percent)}%` }} /></div>
                                  <p className="text-sm">{t(db.action === "load" ? "installer.db.working" : "installer.db.updating", { percent: db.percent })}</p>
                                  <p className="text-xs text-muted-foreground">{t("installer.db.keepOpen")}</p>
                                </div>
                              )}
                              {r.id === "schema" && dbDone && !db && r.status === "ok" && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{t("installer.db.done")}</p>}
                              {r.id === "schema" && dbError && !db && (
                                <div className="mt-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                                  <p>{dbError.text}</p>
                                  {dbError.detail && <p className="mt-1 break-words text-xs opacity-80">{t("installer.db.detail")} {dbError.detail}</p>}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {check && (
                      <p className={cn("text-sm", fails ? "text-destructive" : "text-muted-foreground")}>
                        {fails ? t("installer.check.blocked", { n: fails }) : warns ? t("installer.check.warnings", { n: warns }) : t("installer.check.allGood")}
                      </p>
                    )}
                    {check && (fails > 0 || warns > 0) && <p className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">{t(`installer.check.howto.${platform}`)}</p>}
                    {check && fails > 0 && (
                      <div className="space-y-3 rounded-md border p-3 text-sm">
                        <p className="text-xs text-muted-foreground">{t("installer.ai.hint")}</p>
                        {check.has.pcAi && (
                          <div className="space-y-2">
                            <Button type="button" variant="outline" size="sm" onClick={runExplain} disabled={!!explain?.busy || checking}>
                              {explain?.busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                              {explain?.busy ? t("installer.ai.explaining") : t("installer.ai.explain")}
                            </Button>
                            {explain?.text && (
                              <div className="rounded-md bg-muted/60 p-3" role="status" aria-live="polite">
                                <p className="text-xs font-semibold">{t("installer.ai.explainTitle")}</p>
                                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{explain.text}</p>
                                <p className="mt-2 text-xs text-muted-foreground">{t("installer.ai.explainNote")}</p>
                              </div>
                            )}
                            {explain?.error && <p className="text-sm text-destructive" role="alert">{explain.error}</p>}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {t("installer.ai.stuck")}{" "}
                          <a className="underline underline-offset-2" href={INSTALL_SERVICE_URL(platform)} target="_blank" rel="noreferrer">{platform === "docker" ? "Server install ($199)" : "Cloud install ($99)"}</a>
                          {" · "}<a className="underline underline-offset-2" href={HOSTED_TRIAL_URL} target="_blank" rel="noreferrer">passivecoder.com</a>
                          {" · "}<a className="underline underline-offset-2" href={ISSUES_URL} target="_blank" rel="noreferrer">GitHub issues</a>
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                      <Button variant="outline" className="h-10" onClick={() => runCheck()} disabled={checking || !!db}>
                        {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        {checking ? t("installer.check.running") : t("installer.check.again")}
                      </Button>
                      <Button className="h-10" onClick={() => setStep(1)} disabled={!check?.summary.ready || checking || !!db}>{t("installer.next")}</Button>
                    </div>
                  </>
                )}

                {/* ── Step 1: the site ─────────────────────────────────── */}
                {step === 1 && (
                  <>
                    <div>
                      <h2 className="text-lg font-semibold">{t("installer.step.site")}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{t("installer.site.intro")}</p>
                    </div>
                    <Field id="site-name" label={t("installer.site.name")}>
                      <Input id="site-name" className="h-10" maxLength={80} autoFocus value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder={t("installer.site.namePlaceholder")} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field id="site-language" label={t("installer.site.language")}>
                        <select id="site-language" className={selectClass} value={siteLanguage} onChange={(e) => { languageTouched.current = true; setSiteLanguage(e.target.value); }}>
                          {SITE_LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      </Field>
                      <Field id="site-currency" label={t("installer.site.currency")} help={t("installer.site.currencyHelp")}>
                        <select id="site-currency" className={selectClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                          {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}: {c.name}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field id="site-timezone" label={t("installer.site.timezone")}>
                      <select id="site-timezone" className={selectClass} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                        {(zones.includes(timezone) ? zones : [timezone, ...zones]).map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}</option>)}
                      </select>
                    </Field>
                    {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
                    <StepButtons onBack={() => { setFormError(null); setStep(0); }} onNext={nextFromSite} t={t} />
                  </>
                )}

                {/* ── Step 2: the admin account ────────────────────────── */}
                {step === 2 && (
                  <>
                    <div>
                      <h2 className="text-lg font-semibold">{t("installer.step.account")}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{t("installer.account.intro")}</p>
                    </div>
                    <Field id="admin-email" label={t("installer.account.email")}>
                      <Input id="admin-email" className="h-10" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
                    </Field>
                    <Field id="admin-password" label={t("installer.account.password")} help={t("installer.account.passwordHelp")}>
                      <div className="flex gap-2">
                        <Input id="admin-password" className="h-10" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Button type="button" variant="outline" className="h-10 shrink-0" onClick={() => setShowPassword((v) => !v)} aria-label={t(showPassword ? "installer.account.hide" : "installer.account.show")}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </Field>
                    <Field id="admin-confirm" label={t("installer.account.confirm")}>
                      <Input id="admin-confirm" className="h-10" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </Field>
                    {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
                    <StepButtons onBack={() => { setFormError(null); setStep(1); }} onNext={nextFromAccount} t={t} />
                  </>
                )}

                {/* ── Step 3: optional extras ──────────────────────────── */}
                {step === 3 && check && (
                  <>
                    <div>
                      <h2 className="text-lg font-semibold">{t("installer.step.extras")}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{t("installer.extras.intro")}</p>
                    </div>

                    <Section title={t("installer.template.title")}>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          { slug: "starter", name: t("installer.template.starter"), help: t("installer.template.starterHelp") },
                          ...check.templates.map((tpl) => ({ slug: tpl.slug, name: tpl.name, help: tpl.category ?? "" })),
                          { slug: "empty", name: t("installer.template.empty"), help: t("installer.template.emptyHelp") },
                        ].map((o) => (
                          <label key={o.slug} className={cn("flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors", template === o.slug ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                            <input type="radio" name="template" className="mt-1" checked={template === o.slug} onChange={() => setTemplate(o.slug)} />
                            <span><span className="font-medium">{o.name}</span>{o.help && <span className="mt-0.5 block text-xs text-muted-foreground">{o.help}</span>}</span>
                          </label>
                        ))}
                      </div>
                    </Section>

                    <Section title={t("installer.email.title")} optional={t("installer.optional")} help={t("installer.email.help")}>
                      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("installer.email.title")}>
                        {(["smtp", "resend"] as const).map((via) => (
                          <label key={via} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors", emailVia === via ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                            <input type="radio" name="email-via" checked={emailVia === via} onChange={() => { setEmailVia(via); setEmailNote(null); }} />
                            <span className="font-medium">{t(`installer.email.provider.${via}`)}</span>
                          </label>
                        ))}
                      </div>
                      {emailVia === "smtp" ? (
                        <>
                          {check.has.smtp && <p className="text-xs text-muted-foreground">{t("installer.email.smtpSet")}</p>}
                          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
                            <Field id="smtp-host" label={t("installer.email.smtpHost")} help={t("installer.email.smtpHostHelp")}>
                              <Input id="smtp-host" className="h-10" autoComplete="off" spellCheck={false} value={smtpHost} onChange={(e) => { setSmtpHost(e.target.value); setEmailNote(null); }} placeholder="smtp.gmail.com" />
                            </Field>
                            <Field id="smtp-port" label={t("installer.email.smtpPort")} help={t("installer.email.smtpPortHelp")}>
                              <Input id="smtp-port" className="h-10" inputMode="numeric" value={smtpPort} onChange={(e) => { setSmtpPort(e.target.value.replace(/[^0-9]/g, "").slice(0, 5)); setEmailNote(null); }} />
                            </Field>
                          </div>
                          <Field id="smtp-user" label={t("installer.email.smtpUser")} help={t("installer.email.smtpUserHelp")}>
                            <Input id="smtp-user" className="h-10" autoComplete="off" spellCheck={false} value={smtpUser} onChange={(e) => { setSmtpUser(e.target.value); setEmailNote(null); }} placeholder="hello@yourdomain.com" />
                          </Field>
                          <Field id="smtp-pass" label={t("installer.email.smtpPass")} help={t("installer.email.smtpPassHelp")}>
                            <Input id="smtp-pass" className="h-10" type="password" autoComplete="new-password" value={smtpPass} onChange={(e) => { setSmtpPass(e.target.value); setEmailNote(null); }} />
                          </Field>
                        </>
                      ) : (
                        <Field id="email-key" label={t("installer.email.key")} help={check.has.email && !check.has.smtp ? t("installer.email.keySet") : undefined}>
                          <Input id="email-key" className="h-10" type="password" autoComplete="off" value={emailKey} onChange={(e) => { setEmailKey(e.target.value); setEmailNote(null); }} placeholder="re_..." />
                        </Field>
                      )}
                      <Field id="email-from" label={t("installer.email.from")} help={t("installer.email.fromHelp")}>
                        <Input id="email-from" className="h-10" value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} placeholder={t("installer.email.fromPlaceholder")} />
                      </Field>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button type="button" variant="outline" className="h-10" disabled={busy !== null || !emailFrom.trim() || (!emailServer() && !check.has.email)}
                          onClick={() => runTest("email", { ...emailServer(), from: emailFrom.trim(), to: email.trim() }, setEmailNote)}>
                          {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{t("installer.email.test")}
                        </Button>
                        <span className="text-xs text-muted-foreground">{t("installer.email.testTo", { email: email.trim() })}</span>
                      </div>
                      <NoteLine note={emailNote} />
                    </Section>

                    <Section title={t("installer.ai.title")} optional={t("installer.optional")} help={t("installer.ai.help")}>
                      {check.has.ai && <p className="text-xs text-muted-foreground">{t("installer.ai.alreadySet")}</p>}
                      <Field id="ai-key" label={t("installer.ai.key")}>
                        <Input id="ai-key" className="h-10" type="password" autoComplete="off" value={aiKey} onChange={(e) => { setAiKey(e.target.value); setAiNote(null); }} />
                      </Field>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="outline" className="h-10" disabled={busy !== null || aiKey.trim().length < 8} onClick={() => runTest("ai", { key: aiKey.trim() }, setAiNote)}>
                          {busy === "ai" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{t("installer.ai.check")}
                        </Button>
                        <a href={AI_SIGNUP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1 px-2 text-sm text-primary underline-offset-4 hover:underline">
                          {t("installer.ai.get")}<ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <NoteLine note={aiNote} />
                    </Section>

                    <Section title={t("installer.licence.title")} optional={t("installer.optional")} help={t("installer.licence.help")}>
                      {check.has.licence ? (
                        <p className="text-sm text-muted-foreground">{t("installer.licence.alreadySet")}</p>
                      ) : licence ? (
                        <div className="flex items-start justify-between gap-3 rounded-md bg-emerald-500/10 p-3 text-sm">
                          <span className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{t("installer.licence.valid", { domain: licence.domain, modules: licence.modules.join(", ") || "-" })}</span>
                          <button type="button" className="shrink-0 text-xs underline" onClick={() => setLicence(null)}>{t("installer.licence.remove")}</button>
                        </div>
                      ) : (
                        <label className={cn("inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-accent", busy === "licence" && "pointer-events-none opacity-60")}>
                          {busy === "licence" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{t("installer.licence.choose")}
                          <input type="file" accept=".json,application/json" className="sr-only" onChange={(e) => { void pickLicence(e.target.files?.[0]); e.target.value = ""; }} />
                        </label>
                      )}
                      <NoteLine note={licenceNote} />
                    </Section>

                    {formError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{formError}</p>}
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                      <Button variant="outline" className="h-10" onClick={() => { setFormError(null); setStep(2); }} disabled={busy !== null}><ChevronLeft className="h-4 w-4" />{t("installer.back")}</Button>
                      <Button className="h-10" onClick={install} disabled={busy !== null}>
                        {busy === "install" ? <><Loader2 className="h-4 w-4 animate-spin" />{t("installer.installing")}</> : t("installer.install")}
                      </Button>
                    </div>
                  </>
                )}

                {/* ── Step 4: finish ───────────────────────────────────── */}
                {step === 4 && done && (
                  <>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-emerald-600" />
                      <div>
                        <h2 className="text-lg font-semibold">{t("installer.finish.heading")}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{t(done.signedIn ? "installer.finish.signedIn" : "installer.finish.signIn", { email: email.trim() })}</p>
                      </div>
                    </div>

                    <FinishList title={t("installer.finish.works")} tone="ok" items={[
                      t("installer.finish.works.pages"), t("installer.finish.works.leads"), t("installer.finish.works.shop"),
                      ...(cronOk ? [t("installer.finish.works.jobs")] : []),
                      ...(done.extras.email === "saved" || (check?.has.email && check.has.emailFrom) ? [t("installer.finish.email.saved")] : []),
                      ...(done.extras.ai === "saved" || check?.has.ai ? [t("installer.finish.ai.saved")] : []),
                      ...(done.extras.licence === "saved" || check?.has.licence ? [t("installer.finish.licence.saved")] : []),
                    ]} />

                    <FinishList title={t("installer.finish.todo")} tone="todo" items={[
                      t("installer.finish.supabase", { url: window.location.origin }),
                      ...(done.extras.email === "manual" ? [t("installer.finish.email.manual")] : []),
                      ...(done.extras.ai === "manual" ? [t("installer.finish.ai.manual")] : []),
                      ...(done.extras.licence === "manual" ? [t("installer.finish.licence.manual")] : []),
                      ...(done.extras.licence === "invalid" ? [t("installer.finish.licence.invalid")] : []),
                      ...(!cronOk ? [t("installer.finish.jobsOff")] : []),
                    ]} />

                    <FinishList title={t("installer.finish.optional")} tone="optional" items={[
                      ...(done.extras.email === "skipped" && !(check?.has.email && check.has.emailFrom) ? [t("installer.finish.email.skipped")] : []),
                      ...(done.extras.ai === "skipped" && !check?.has.ai ? [t("installer.finish.ai.skipped")] : []),
                    ]} />

                    <p className="flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" />{t("installer.finish.locked")}</p>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button className="h-10" onClick={() => window.location.assign(done.signedIn ? "/dashboard" : "/login")}>{t(done.signedIn ? "installer.finish.dashboard" : "installer.finish.login")}</Button>
                      <Button variant="outline" className="h-10" onClick={() => window.open("/", "_blank", "noopener")}>{t("installer.finish.site")}</Button>
                      <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center gap-1 px-3 text-sm text-primary underline-offset-4 hover:underline">
                        {t("installer.finish.docs")}<ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            {check?.version && <p className="mt-4 text-center text-xs text-muted-foreground">Passive Coder CMS v{check.version}</p>}
          </>
        )}
      </div>
    </main>
  );
}

type T = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

function StatusIcon({ status, label }: { status: Status; label: string }) {
  const cls = "mt-0.5 h-5 w-5 shrink-0";
  return (
    <span title={label}>
      {status === "ok" && <CheckCircle2 className={cn(cls, "text-emerald-600")} />}
      {status === "warn" && <AlertTriangle className={cn(cls, "text-amber-500")} />}
      {status === "fail" && <XCircle className={cn(cls, "text-destructive")} />}
      {status === "skip" && <Circle className={cn(cls, "text-muted-foreground/50")} />}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** "Ask your AI to fix this": copies a ready prompt (problem, fix steps,
 *  runbook link; never a setting's value, see selfhost/lib/agent-help.mjs). */
function AskAi({ result, platform, version, t }: { result: CheckResult; platform: Platform; version: string; t: T }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const prompt = useMemo(() => fixPrompt({ id: result.id, code: result.code, params: result.params, platform, version }), [result, platform, version]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setState("copied");
      setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("failed");
    }
  }
  return (
    <div className="mt-2">
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {state === "copied" ? <Check className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}{t("installer.ai.ask")}
      </Button>
      {state === "copied" && <p className="mt-1.5 text-xs text-muted-foreground" role="status">{t("installer.ai.copied")}</p>}
      {state === "failed" && (
        <div className="mt-1.5 space-y-1">
          <p className="text-xs text-destructive" role="alert">{t("installer.ai.copyFailed")}</p>
          <textarea readOnly value={prompt} rows={6} className="w-full rounded-md border bg-background p-2 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
        </div>
      )}
    </div>
  );
}

/** A fresh random value, made in the browser and never sent anywhere. */
function SecretOffer({ name, t }: { name: string; t: T }) {
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setValue(randomSecret()), []);
  if (!value) return null;
  return (
    <div className="mt-2 rounded-md bg-muted/60 p-3 text-xs">
      <p className="text-muted-foreground">{t("installer.secret.offer")}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded bg-background px-2 py-1.5 font-mono">{value}</code>
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => { void navigator.clipboard?.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{t(copied ? "installer.secret.copied" : "installer.secret.copy")}
        </Button>
      </div>
      <p className="mt-1.5 text-muted-foreground">{t("installer.secret.addAs", { name })}</p>
    </div>
  );
}

function Field({ id, label, help, children }: { id: string; label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function Section({ title, optional, help, children }: { title: string; optional?: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border p-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold">{title}{optional && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground">{optional}</span>}</h3>
        {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
      </div>
      {children}
    </section>
  );
}

function NoteLine({ note }: { note: Note }) {
  if (!note) return null;
  return <p className={cn("break-words text-sm", note.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")} role="status">{note.text}</p>;
}

function StepButtons({ onBack, onNext, t }: { onBack: () => void; onNext: () => void; t: T }) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
      <Button variant="outline" className="h-10" onClick={onBack}><ChevronLeft className="h-4 w-4" />{t("installer.back")}</Button>
      <Button className="h-10" onClick={onNext}>{t("installer.next")}</Button>
    </div>
  );
}

function FinishList({ title, items, tone }: { title: string; items: string[]; tone: "ok" | "todo" | "optional" }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm">
            {tone === "ok" ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : tone === "todo" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> : <Circle className="mt-1 h-3 w-3 shrink-0 text-muted-foreground/60" />}
            <span className={cn("break-words", tone === "optional" && "text-muted-foreground")}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
