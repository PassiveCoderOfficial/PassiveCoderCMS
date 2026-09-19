"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSiteCurrency } from "@/lib/hooks/use-site-currency";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";

const schema = z.object({
  type: z.enum(["income", "expense", "transfer", "donation", "refund"]),
  status: z.enum(["pending", "completed", "cancelled", "reconciled"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().min(1),
  description: z.string().min(1, "Description is required"),
  reference: z.string().optional(),
  category: z.string().optional(),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional().or(z.literal("")),
  message: z.string().optional(),
  is_public: z.boolean(),
  date: z.string().min(1, "Date is required"),
});

type FormValues = z.infer<typeof schema>;

const TYPE_KEY: Record<FormValues["type"], TranslationKey> = {
  income: "acctTx.typeIncome", expense: "acctTx.typeExpense", donation: "acctTx.typeDonation",
  transfer: "acctTx.typeTransfer", refund: "acctTx.typeRefund",
};
const STATUS_KEY: Record<FormValues["status"], TranslationKey> = {
  pending: "txForm.statusPending", completed: "txForm.statusCompleted",
  cancelled: "txForm.statusCancelled", reconciled: "txForm.statusReconciled",
};

export function TransactionForm() {
  const router = useRouter();
  const t = useT();
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const { currency, currency_symbol } = useSiteCurrency();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      type: "income", status: "completed", currency: "USD",
      amount: 0, description: "", is_public: false, date: today,
    },
  });

  const txType = form.watch("type");

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const tenantId = await getClientTenantId();
      if (!tenantId) throw new Error(t("txForm.noTenantFound"));
      // Currency is the site-wide base currency, not a per-transaction choice.
      const { error } = await supabase.from("transactions").insert({ ...values, currency, tenant_id: tenantId });
      if (error) throw error;
      toast.success(t("txForm.transactionAdded"));
      router.push("/dashboard/accounting/transactions");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("txForm.failedToSave"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t("txForm.type")}</Label>
          <Select defaultValue="income" onValueChange={(v) => form.setValue("type", v as FormValues["type"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["income", "expense", "donation", "transfer", "refund"] as const).map((tx) => (
                <SelectItem key={tx} value={tx}>{t(TYPE_KEY[tx])}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("txForm.status")}</Label>
          <Select defaultValue="completed" onValueChange={(v) => form.setValue("status", v as FormValues["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["pending", "completed", "cancelled", "reconciled"] as const).map((s) => (
                <SelectItem key={s} value={s}>{t(STATUS_KEY[s])}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t("txForm.amount")}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {currency_symbol}
          </span>
          <Input type="number" step="0.01" {...form.register("amount")} className="pl-7" />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("txForm.currencyHint", { currency })}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>{t("txForm.description")}</Label>
        <Input {...form.register("description")} placeholder={t("txForm.descriptionPlaceholder")} />
        {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>{t("txForm.date")}</Label><Input type="date" {...form.register("date")} /></div>
        <div className="space-y-1.5"><Label>{t("txForm.reference")}</Label><Input {...form.register("reference")} placeholder={t("txForm.referencePlaceholder")} /></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>{t("txForm.fromToName")}</Label><Input {...form.register("customer_name")} placeholder={t("txForm.fromToPlaceholder")} /></div>
        <div className="space-y-1.5"><Label>{t("txForm.category")}</Label><Input {...form.register("category")} placeholder={t("txForm.categoryPlaceholder")} /></div>
      </div>

      {(txType === "donation" || txType === "income") && (
        <div className="space-y-1.5">
          <Label>{t("txForm.publicMessage")}</Label>
          <Textarea {...form.register("message")} placeholder={t("txForm.publicMessagePlaceholder")} rows={2} />
        </div>
      )}

      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div>
          <Label>{t("txForm.showPublicly")}</Label>
          <p className="text-xs text-muted-foreground">{t("txForm.showPubliclyHint")}</p>
        </div>
        <Switch defaultChecked={false} onCheckedChange={(v) => form.setValue("is_public", v)} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {t("txForm.addTransaction")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>{t("txForm.cancel")}</Button>
      </div>
    </form>
  );
}
