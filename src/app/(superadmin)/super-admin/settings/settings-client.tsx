"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, Zap, UserCheck, Smartphone, DollarSign, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface PlatformSettings {
  default_commission_rate?: number;
  default_commission_type?: "recurring" | "one_time";
  default_agent_one_time_pct?: number | null;
  default_staff_recurring_pct?: number | null;
  agent_signup_enabled: boolean;
  agent_auto_approve: boolean;
  bkash_number?: string | null;
  nagad_number?: string | null;
  bank_details?: string | null;
  manual_payment_instructions?: string | null;
  usd_to_bdt_rate?: number | null;
  shurjopay_mode?: "sandbox" | "live" | null;
  dodo_mode?: "sandbox" | "live" | null;
  whatsapp_number?: string | null;
  // Dodo live
  dodo_live_api_key?: string | null;
  dodo_live_webhook_secret?: string | null;
  dodo_live_product_basic_yearly?: string | null;
  dodo_live_product_pro_yearly?: string | null;
  dodo_live_product_basic_monthly?: string | null;
  dodo_live_product_pro_monthly?: string | null;
  // Dodo sandbox
  dodo_sandbox_api_key?: string | null;
  dodo_sandbox_webhook_secret?: string | null;
  dodo_sandbox_product_basic_yearly?: string | null;
  dodo_sandbox_product_pro_yearly?: string | null;
  dodo_sandbox_product_basic_monthly?: string | null;
  dodo_sandbox_product_pro_monthly?: string | null;
  // shurjoPay live
  shurjopay_live_base_url?: string | null;
  shurjopay_live_username?: string | null;
  shurjopay_live_password?: string | null;
  shurjopay_live_prefix?: string | null;
  // shurjoPay sandbox
  shurjopay_sandbox_username?: string | null;
  shurjopay_sandbox_password?: string | null;
  shurjopay_sandbox_prefix?: string | null;
}

function Field({ label, value, onChange, placeholder, type = "text", mono = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={mono ? "font-mono" : ""}
      />
    </div>
  );
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-accent/60 hover:bg-accent transition-colors text-left">
        <span className="text-xs font-semibold">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </Card>
  );
}

export default function SASettingsClient({ settings }: { settings: PlatformSettings | null }) {
  const s = settings;

  // Commission
  const [agentOneTimePct, setAgentOneTimePct] = useState(String(s?.default_agent_one_time_pct ?? 10));
  const [staffRecurringPct, setStaffRecurringPct] = useState(String(s?.default_staff_recurring_pct ?? 10));
  // Agent signup
  const [agentSignup, setAgentSignup] = useState(s?.agent_signup_enabled !== false);
  const [autoApprove, setAutoApprove] = useState(s?.agent_auto_approve !== false);
  // Manual payment
  const [bkash, setBkash] = useState(s?.bkash_number ?? "");
  const [nagad, setNagad] = useState(s?.nagad_number ?? "");
  const [bankDetails, setBankDetails] = useState(s?.bank_details ?? "");
  const [manualNote, setManualNote] = useState(s?.manual_payment_instructions ?? "");
  // Currency
  const [bdtRate, setBdtRate] = useState(String(s?.usd_to_bdt_rate ?? 125));
  // Gateway modes
  const [shurjopayMode, setShurjopayMode] = useState<"sandbox" | "live">(s?.shurjopay_mode ?? "sandbox");
  const [dodoMode, setDodoMode] = useState<"sandbox" | "live">(s?.dodo_mode ?? "live");
  // WhatsApp
  const [whatsappNumber, setWhatsappNumber] = useState(s?.whatsapp_number ?? "");
  // Dodo live creds
  const [dodoLiveKey, setDodoLiveKey] = useState(s?.dodo_live_api_key ?? "");
  const [dodoLiveWebhook, setDodoLiveWebhook] = useState(s?.dodo_live_webhook_secret ?? "");
  const [dodoLiveBasicYearly, setDodoLiveBasicYearly] = useState(s?.dodo_live_product_basic_yearly ?? "");
  const [dodoLiveProYearly, setDodoLiveProYearly] = useState(s?.dodo_live_product_pro_yearly ?? "");
  const [dodoLiveBasicMonthly, setDodoLiveBasicMonthly] = useState(s?.dodo_live_product_basic_monthly ?? "");
  const [dodoLiveProMonthly, setDodoLiveProMonthly] = useState(s?.dodo_live_product_pro_monthly ?? "");
  // Dodo sandbox creds
  const [dodoSandboxKey, setDodoSandboxKey] = useState(s?.dodo_sandbox_api_key ?? "");
  const [dodoSandboxWebhook, setDodoSandboxWebhook] = useState(s?.dodo_sandbox_webhook_secret ?? "");
  const [dodoSandboxBasicYearly, setDodoSandboxBasicYearly] = useState(s?.dodo_sandbox_product_basic_yearly ?? "");
  const [dodoSandboxProYearly, setDodoSandboxProYearly] = useState(s?.dodo_sandbox_product_pro_yearly ?? "");
  const [dodoSandboxBasicMonthly, setDodoSandboxBasicMonthly] = useState(s?.dodo_sandbox_product_basic_monthly ?? "");
  const [dodoSandboxProMonthly, setDodoSandboxProMonthly] = useState(s?.dodo_sandbox_product_pro_monthly ?? "");
  // shurjoPay live creds
  const [spLiveBase, setSpLiveBase] = useState(s?.shurjopay_live_base_url ?? "");
  const [spLiveUser, setSpLiveUser] = useState(s?.shurjopay_live_username ?? "");
  const [spLivePass, setSpLivePass] = useState(s?.shurjopay_live_password ?? "");
  const [spLivePrefix, setSpLivePrefix] = useState(s?.shurjopay_live_prefix ?? "");
  // shurjoPay sandbox creds
  const [spSandboxUser, setSpSandboxUser] = useState(s?.shurjopay_sandbox_username ?? "");
  const [spSandboxPass, setSpSandboxPass] = useState(s?.shurjopay_sandbox_password ?? "");
  const [spSandboxPrefix, setSpSandboxPrefix] = useState(s?.shurjopay_sandbox_prefix ?? "");

  const [saving, setSaving] = useState(false);

  async function save() {
    const oneTime = parseFloat(agentOneTimePct);
    const recurring = parseFloat(staffRecurringPct);
    const rate = parseFloat(bdtRate);
    if (isNaN(oneTime) || oneTime < 0 || oneTime > 100) { toast.error("One-time % must be 0–100"); return; }
    if (isNaN(recurring) || recurring < 0 || recurring > 100) { toast.error("Recurring % must be 0–100"); return; }
    if (isNaN(rate) || rate <= 0) { toast.error("BDT rate must be a positive number"); return; }
    setSaving(true);
    const res = await fetch("/api/super-admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        default_agent_one_time_pct: oneTime,
        default_staff_recurring_pct: recurring,
        agent_signup_enabled: agentSignup,
        agent_auto_approve: autoApprove,
        bkash_number: bkash,
        nagad_number: nagad,
        bank_details: bankDetails,
        manual_payment_instructions: manualNote,
        usd_to_bdt_rate: rate,
        shurjopay_mode: shurjopayMode,
        dodo_mode: dodoMode,
        whatsapp_number: whatsappNumber,
        dodo_live_api_key: dodoLiveKey,
        dodo_live_webhook_secret: dodoLiveWebhook,
        dodo_live_product_basic_yearly: dodoLiveBasicYearly,
        dodo_live_product_pro_yearly: dodoLiveProYearly,
        dodo_live_product_basic_monthly: dodoLiveBasicMonthly,
        dodo_live_product_pro_monthly: dodoLiveProMonthly,
        dodo_sandbox_api_key: dodoSandboxKey,
        dodo_sandbox_webhook_secret: dodoSandboxWebhook,
        dodo_sandbox_product_basic_yearly: dodoSandboxBasicYearly,
        dodo_sandbox_product_pro_yearly: dodoSandboxProYearly,
        dodo_sandbox_product_basic_monthly: dodoSandboxBasicMonthly,
        dodo_sandbox_product_pro_monthly: dodoSandboxProMonthly,
        shurjopay_live_base_url: spLiveBase,
        shurjopay_live_username: spLiveUser,
        shurjopay_live_password: spLivePass,
        shurjopay_live_prefix: spLivePrefix,
        shurjopay_sandbox_username: spSandboxUser,
        shurjopay_sandbox_password: spSandboxPass,
        shurjopay_sandbox_prefix: spSandboxPrefix,
      }),
    });
    setSaving(false);
    if (res.ok) toast.success("Settings saved");
    else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Failed to save");
    }
  }

  function Toggle({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
        <Switch checked={value} onCheckedChange={onChange} />
      </div>
    );
  }

  function ModeToggle({ mode, setMode }: { mode: "sandbox" | "live"; setMode: (m: "sandbox" | "live") => void }) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {(["sandbox", "live"] as const).map(m => (
          <Button
            key={m}
            type="button"
            variant="outline"
            onClick={() => setMode(m)}
            className={
              mode === m
                ? m === "live"
                  ? "border-green-500 bg-green-500/10 text-green-500 hover:bg-green-500/10 hover:text-green-500"
                  : "border-yellow-500 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-500"
                : "text-muted-foreground"
            }
          >
            {m === "sandbox" ? "🧪 Sandbox" : "🟢 Live"}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Commission defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Commission Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Platform-wide defaults. Individual agents can override with per-agent rates.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Agent one-time % <span className="text-muted-foreground font-normal">(first payment only)</span></Label>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} max={100} step={0.5} value={agentOneTimePct} onChange={e => setAgentOneTimePct(e.target.value)} className="w-24" />
                <span className="text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">Applies to all agents (staff + external)</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Staff recurring % <span className="text-muted-foreground font-normal">(each renewal)</span></Label>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} max={100} step={0.5} value={staffRecurringPct} onChange={e => setStaffRecurringPct(e.target.value)} className="w-24" />
                <span className="text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">Only for agents with is_staff = true</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent signup settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><UserCheck className="w-4 h-4 text-blue-400" /> Agent Signup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle value={agentSignup} onChange={setAgentSignup} label="Allow self-signup (/become-agent)"
            desc="If off, the become-agent form returns an error. Only SA can create agents." />
          <Toggle value={autoApprove} onChange={setAutoApprove} label="Auto-approve new agents"
            desc="If on, agents get 'active' status immediately. If off, they get 'pending' and must be activated by SA." />
        </CardContent>
      </Card>

      {/* Manual payment methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Smartphone className="w-4 h-4 text-green-400" /> Manual Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Shown to clients at subscription checkout. Leave blank to hide a method.</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="bKash number" value={bkash} onChange={setBkash} placeholder="01XXXXXXXXX" />
            <Field label="Nagad number" value={nagad} onChange={setNagad} placeholder="01XXXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Bank transfer details</Label>
            <Textarea value={bankDetails} onChange={e => setBankDetails(e.target.value)} rows={3}
              placeholder="Bank name, account name, account number, branch/routing…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Extra instructions (optional)</Label>
            <Textarea value={manualNote} onChange={e => setManualNote(e.target.value)} rows={2}
              placeholder="e.g. Send money as 'Payment', include your site name in reference." />
          </div>
        </CardContent>
      </Card>

      {/* Currency rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400" /> Currency Conversion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Used by Pricing blocks with USD/BDT switcher enabled.</p>
          <div className="space-y-1.5">
            <Label className="text-xs">1 USD = ? BDT</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min={1} step={0.5} value={bdtRate} onChange={e => setBdtRate(e.target.value)} className="w-28" />
              <span className="text-muted-foreground text-sm">BDT</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment gateways */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-violet-400" /> Payment Gateways</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-xs text-muted-foreground">Configure credentials for each gateway. Toggle mode to switch between Sandbox and Live without redeploying.</p>

          {/* ── shurjoPay ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">shurjoPay</span>
              <Badge variant="secondary">Bangladesh</Badge>
            </div>
            <ModeToggle mode={shurjopayMode} setMode={setShurjopayMode} />
            {shurjopayMode === "sandbox" && (
              <p className="text-xs text-yellow-500">Sandbox active — payments hit test environment, no real money charged.</p>
            )}

            <Section title="Live credentials" defaultOpen={shurjopayMode === "live"}>
              <Field label="Base URL" value={spLiveBase} onChange={setSpLiveBase}
                placeholder="https://engine.shurjopayment.com" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Username" value={spLiveUser} onChange={setSpLiveUser} placeholder="sp_username" mono />
                <Field label="Prefix" value={spLivePrefix} onChange={setSpLivePrefix} placeholder="sp" mono />
              </div>
              <Field label="Password" value={spLivePass} onChange={setSpLivePass} type="password" placeholder="••••••••" mono />
            </Section>

            <Section title="Sandbox credentials" defaultOpen={shurjopayMode === "sandbox"}>
              <p className="text-xs text-muted-foreground">Leave blank to use shurjoPay public sandbox defaults (sp_sandbox / pyyk97hu&amp;6u6).</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Username" value={spSandboxUser} onChange={setSpSandboxUser} placeholder="sp_sandbox" mono />
                <Field label="Prefix" value={spSandboxPrefix} onChange={setSpSandboxPrefix} placeholder="sp" mono />
              </div>
              <Field label="Password" value={spSandboxPass} onChange={setSpSandboxPass} type="password" placeholder="••••••••" mono />
            </Section>
          </div>

          <div className="border-t" />

          {/* ── Dodo Payments ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">Dodo Payments</span>
              <Badge variant="secondary">International cards / PayPal</Badge>
            </div>
            <ModeToggle mode={dodoMode} setMode={setDodoMode} />
            {dodoMode === "sandbox" && (
              <p className="text-xs text-yellow-500">Sandbox active — use test card 4242 4242 4242 4242, any future expiry.</p>
            )}

            <Section title="Live credentials" defaultOpen={dodoMode === "live"}>
              <Field label="API Key" value={dodoLiveKey} onChange={setDodoLiveKey} type="password" placeholder="m_1-..." mono />
              <Field label="Webhook Secret" value={dodoLiveWebhook} onChange={setDodoLiveWebhook} type="password" placeholder="whsec_..." mono />
              <p className="text-xs text-muted-foreground pt-1">Product IDs (from Dodo dashboard → Products → Live mode)</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Basic — Yearly" value={dodoLiveBasicYearly} onChange={setDodoLiveBasicYearly} placeholder="pdt_..." mono />
                <Field label="Pro — Yearly" value={dodoLiveProYearly} onChange={setDodoLiveProYearly} placeholder="pdt_..." mono />
                <Field label="Basic — Monthly" value={dodoLiveBasicMonthly} onChange={setDodoLiveBasicMonthly} placeholder="pdt_..." mono />
                <Field label="Pro — Monthly" value={dodoLiveProMonthly} onChange={setDodoLiveProMonthly} placeholder="pdt_..." mono />
              </div>
            </Section>

            <Section title="Sandbox / Test credentials" defaultOpen={dodoMode === "sandbox"}>
              <Field label="Test API Key" value={dodoSandboxKey} onChange={setDodoSandboxKey} type="password" placeholder="m_1-test-..." mono />
              <Field label="Test Webhook Secret" value={dodoSandboxWebhook} onChange={setDodoSandboxWebhook} type="password" placeholder="whsec_..." mono />
              <p className="text-xs text-muted-foreground pt-1">Product IDs (from Dodo dashboard → Products → Test mode)</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Basic — Yearly" value={dodoSandboxBasicYearly} onChange={setDodoSandboxBasicYearly} placeholder="pdt_..." mono />
                <Field label="Pro — Yearly" value={dodoSandboxProYearly} onChange={setDodoSandboxProYearly} placeholder="pdt_..." mono />
                <Field label="Basic — Monthly" value={dodoSandboxBasicMonthly} onChange={setDodoSandboxBasicMonthly} placeholder="pdt_..." mono />
                <Field label="Pro — Monthly" value={dodoSandboxProMonthly} onChange={setDodoSandboxProMonthly} placeholder="pdt_..." mono />
              </div>
            </Section>
          </div>

          <div className="border-t" />

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <Label className="text-xs">WhatsApp number <span className="text-muted-foreground font-normal">(international format, no +)</span></Label>
            <Input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="e.g. 8801678669699" />
            <p className="text-xs text-muted-foreground">Used in checkout &quot;WhatsApp&quot; button for manual payment requests.</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </Button>
    </div>
  );
}
