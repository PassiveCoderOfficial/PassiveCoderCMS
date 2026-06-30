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

export function TransactionForm() {
  const router = useRouter();
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
      if (!tenantId) throw new Error("No tenant found for your account");
      // Currency is the site-wide base currency, not a per-transaction choice.
      const { error } = await supabase.from("transactions").insert({ ...values, currency, tenant_id: tenantId });
      if (error) throw error;
      toast.success("Transaction added");
      router.push("/dashboard/accounting/transactions");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select defaultValue="income" onValueChange={(v) => form.setValue("type", v as FormValues["type"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["income","expense","donation","transfer","refund"].map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select defaultValue="completed" onValueChange={(v) => form.setValue("status", v as FormValues["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["pending","completed","cancelled","reconciled"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {currency_symbol}
          </span>
          <Input type="number" step="0.01" {...form.register("amount")} className="pl-7" />
        </div>
        <p className="text-xs text-muted-foreground">
          Currency: <strong>{currency}</strong> — set site-wide in Settings → Base Currency
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input {...form.register("description")} placeholder="What was this transaction for?" />
        {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>Date</Label><Input type="date" {...form.register("date")} /></div>
        <div className="space-y-1.5"><Label>Reference</Label><Input {...form.register("reference")} placeholder="Invoice #, Order ID..." /></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5"><Label>From/To Name</Label><Input {...form.register("customer_name")} placeholder="Customer or vendor name" /></div>
        <div className="space-y-1.5"><Label>Category</Label><Input {...form.register("category")} placeholder="Sales, Marketing..." /></div>
      </div>

      {(txType === "donation" || txType === "income") && (
        <div className="space-y-1.5">
          <Label>Public Message</Label>
          <Textarea {...form.register("message")} placeholder="Optional message to display publicly..." rows={2} />
        </div>
      )}

      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div>
          <Label>Show publicly on website</Label>
          <p className="text-xs text-muted-foreground">Appears in donation feeds and accounting blocks</p>
        </div>
        <Switch defaultChecked={false} onCheckedChange={(v) => form.setValue("is_public", v)} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add Transaction
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
