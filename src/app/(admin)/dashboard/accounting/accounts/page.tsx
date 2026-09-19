"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { BookMarked, Plus, Trash2, Pencil, Check, X, Loader2, Star } from "lucide-react";
import { useSiteCurrency } from "@/lib/hooks/use-site-currency";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";

interface Account {
  id: string;
  name: string;
  type: "cash" | "bank" | "credit" | "investment";
  currency: string;
  balance: number;
  is_default: boolean;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  cash: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  bank: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  credit: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  investment: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const TYPE_LABEL_KEY: Record<string, TranslationKey> = {
  cash: "accounts.typeCash", bank: "accounts.typeBank",
  credit: "accounts.typeCredit", investment: "accounts.typeInvestment",
};

const supabase = createClient();

export default function AccountsPage() {
  const t = useT();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "bank" as Account["type"], balance: "0", is_default: false });
  const [saving, setSaving] = useState(false);
  const { currency, format } = useSiteCurrency();

  useEffect(() => {
    getClientTenantId().then((tenantId) => {
      let q = supabase.from("accounts").select("*").order("created_at");
      if (tenantId) q = q.eq("tenant_id", tenantId);
      q.then(({ data }) => {
        setAccounts(data ?? []);
        setLoading(false);
      });
    });
  }, []);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      currency, // site-wide base currency
      balance: parseFloat(form.balance) || 0,
      is_default: form.is_default,
    };
    if (editingId) {
      const { error } = await supabase.from("accounts").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      setAccounts(prev => prev.map(a => a.id === editingId ? { ...a, ...payload } : a));
      setEditingId(null);
    } else {
      const tenantId = await getClientTenantId();
      if (!tenantId) { toast.error(t("accounts.noTenantFound")); setSaving(false); return; }
      const { data, error } = await supabase.from("accounts").insert({ ...payload, tenant_id: tenantId }).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      setAccounts(prev => [...prev, data as Account]);
      setAdding(false);
    }
    setForm({ name: "", type: "bank", balance: "0", is_default: false });
    setSaving(false);
    toast.success(t("accounts.saved"));
  }

  function startEdit(a: Account) {
    setEditingId(a.id);
    setForm({ name: a.name, type: a.type, balance: String(a.balance), is_default: a.is_default });
    setAdding(false);
  }

  async function remove(id: string) {
    if (!confirm(t("accounts.deleteConfirm"))) return;
    await supabase.from("accounts").delete().eq("id", id);
    setAccounts(prev => prev.filter(a => a.id !== id));
  }

  async function setDefault(id: string) {
    await supabase.from("accounts").update({ is_default: false }).neq("id", "");
    await supabase.from("accounts").update({ is_default: true }).eq("id", id);
    setAccounts(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
  }

  const formPanel = (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="font-semibold text-sm">{editingId ? t("accounts.editAccount") : t("accounts.newAccount")}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs mb-1 block">{t("accounts.accountName")}</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder={t("accounts.accountNamePlaceholder")} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("accounts.type")}</Label>
            <select value={form.type} onChange={e => set("type", e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="cash">{t("accounts.typeCash")}</option>
              <option value="bank">{t("accounts.typeBank")}</option>
              <option value="credit">{t("accounts.typeCredit")}</option>
              <option value="investment">{t("accounts.typeInvestment")}</option>
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("accounts.openingBalance", { currency })}</Label>
            <Input type="number" step="0.01" value={form.balance} onChange={e => set("balance", e.target.value)} />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <Switch checked={form.is_default} onCheckedChange={v => set("is_default", v)} id="default" />
            <Label htmlFor="default" className="text-sm">{t("accounts.setAsDefault")}</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            {editingId ? t("accounts.update") : t("accounts.create")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditingId(null); }}>
            <X className="w-4 h-4 mr-2" /> {t("accounts.cancel")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookMarked className="w-6 h-6" /> {t("accounts.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("accounts.subtitle")}</p>
        </div>
        {!adding && !editingId && (
          <Button size="sm" onClick={() => setAdding(true)}><Plus className="w-4 h-4 mr-2" /> {t("accounts.addAccount")}</Button>
        )}
      </div>

      {(adding && !editingId) && formPanel}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : accounts.length === 0 && !adding ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookMarked className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">{t("accounts.noAccountsYet")}</p>
            <p className="text-sm text-muted-foreground">{t("accounts.noAccountsHint")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {accounts.map(a => (
            editingId === a.id ? <div key={a.id}>{formPanel}</div> : (
              <Card key={a.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{a.name}</p>
                      {a.is_default && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[a.type]}`}>{t(TYPE_LABEL_KEY[a.type])}</span>
                    </div>
                  </div>
                  <p className={`font-bold text-base shrink-0 ${a.balance < 0 ? "text-destructive" : ""}`}>
                    {format(a.balance)}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    {!a.is_default && (
                      <Button size="sm" variant="ghost" onClick={() => setDefault(a.id)} title={t("accounts.setDefault")}>
                        <Star className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => startEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(a.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  );
}
