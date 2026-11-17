"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { ContactFormField, InlineLeadFormData } from "@/types/cms";
import { defaultInlineLeadForm } from "@/components/blocks/_primitives/lead-form";

const FIELD_TYPES = [
  ["text", "Short text"], ["email", "Email"], ["tel", "Phone"], ["textarea", "Long text"],
  ["select", "Dropdown (pick one)"], ["checkboxes", "Checkboxes (pick several)"], ["file", "File upload (CV, document, photo)"],
  ["date", "Date (calendar picker)"],
] as const;

/** Add / edit / remove form fields. Shared by the Contact block and the hero form. */
export function FormFieldsEditor({ fields, onChange }: { fields: ContactFormField[]; onChange: (fields: ContactFormField[]) => void }) {
  const updateField = (id: string, patch: Partial<ContactFormField>) => onChange(fields.map((fi) => (fi.id === id ? { ...fi, ...patch } : fi)));
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Form Fields</p>
        <Button size="sm" variant="outline" onClick={() => onChange([...fields, { id: generateId(), label: "New Field", type: "text", required: false }])} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
      </div>
      <div className="space-y-2">
        {fields.map((f) => (
          <div key={f.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
            <div className="flex gap-1">
              <Input value={f.label} onChange={(e) => updateField(f.id, { label: e.target.value })} className="h-7 text-xs flex-1" placeholder="Label" />
              <Button size="icon" variant="ghost" onClick={() => onChange(fields.filter((fi) => fi.id !== f.id))} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
            </div>
            <Select value={f.type} onValueChange={(v) => updateField(f.id, { type: v as ContactFormField["type"] })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{FIELD_TYPES.map(([t, l]) => <SelectItem key={t} value={t} className="text-xs">{l}</SelectItem>)}</SelectContent>
            </Select>
            {(f.type === "select" || f.type === "checkboxes") && (
              <Textarea value={(f.options ?? []).join("\n")} rows={3} className="text-xs" placeholder="One option per line"
                onChange={(e) => updateField(f.id, { options: e.target.value.split("\n") })}
                onBlur={(e) => updateField(f.id, { options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean) })} />
            )}
            {f.type === "file" && <p className="text-[10px] text-muted-foreground">PDF, Word or image up to 10 MB. Files are private: the link in the message opens only for people who manage this site.</p>}
            {f.type !== "file" && (
              <Input value={f.defaultValue ?? ""} onChange={(e) => updateField(f.id, { defaultValue: e.target.value || undefined })} className="h-7 text-xs"
                placeholder={f.type === "select" ? "Pre-selected choice (optional)" : f.type === "checkboxes" ? "Pre-ticked choices, comma separated (optional)" : "Pre-filled answer (optional)"} />
            )}
            <div className="flex items-center gap-2">
              <Switch checked={f.required} onCheckedChange={(v) => updateField(f.id, { required: v })} />
              <Label className="text-xs">Required</Label>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * "Enquiry form in banner" section for the Hero and Slider settings. Turning
 * it on the first time seeds a short Name / Phone / Service / Message form;
 * turning it off keeps the fields so switching back restores them.
 */
export function InlineLeadFormSettings({ value, onChange, note }: { value?: InlineLeadFormData; onChange: (v: InlineLeadFormData) => void; note?: string }) {
  const on = !!value?.enabled;
  const set = (patch: Partial<InlineLeadFormData>) => value && onChange({ ...value, ...patch });
  const text = (label: string, key: "title" | "subtitle" | "submitLabel" | "successMessage" | "recipientEmail", placeholder?: string) => (
    <div><Label className="text-xs">{label}</Label><Input value={value?.[key] ?? ""} onChange={(e) => set({ [key]: e.target.value })} placeholder={placeholder} className="h-8 text-xs mt-1" /></div>
  );
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Enquiry form in banner</Label>
        <Switch checked={on} onCheckedChange={(v) => onChange(value ? { ...value, enabled: v } : defaultInlineLeadForm(generateId))} />
      </div>
      <p className="text-[10px] text-muted-foreground">{note ?? "A short form next to the headline, so visitors can enquire without scrolling. Messages arrive in your Contact inbox and CRM."}</p>
      {on && value && (
        <>
          {text("Form title", "title", "Get a free quote")}
          {text("Line under the title", "subtitle", "We reply within minutes")}
          {text("Button text", "submitLabel", "Send enquiry")}
          {text("Thank-you message", "successMessage", "Thank you! We'll contact you shortly.")}
          {text("Send notifications to (email)", "recipientEmail", "Leave blank to use your site email")}
          <div className="border-t pt-3">
            <FormFieldsEditor fields={value.fields ?? []} onChange={(fields) => set({ fields })} />
          </div>
        </>
      )}
    </div>
  );
}
