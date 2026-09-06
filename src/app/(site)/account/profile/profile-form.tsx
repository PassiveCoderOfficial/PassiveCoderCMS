"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveCustomerProfileAction, type CustomerProfileFields } from "../actions";

export function ProfileForm({ initial }: { initial: CustomerProfileFields }) {
  const [fields, setFields] = useState(initial);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof CustomerProfileFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await saveCustomerProfileAction(fields);
      if (result.error) toast.error(result.error);
      else toast.success("Profile saved");
    } finally {
      setSaving(false);
    }
  }

  const Field = ({ k, label, placeholder }: { k: keyof CustomerProfileFields; label: string; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="text"
        value={fields[k]}
        onChange={set(k)}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field k="full_name" label="Full name" />
      <Field k="phone" label="Phone" />

      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3">Default shipping address</p>
        <div className="space-y-3">
          <Field k="address_line1" label="Address line 1" />
          <Field k="address_line2" label="Address line 2 (optional)" />
          <div className="grid grid-cols-2 gap-3">
            <Field k="city" label="City" />
            <Field k="area" label="Area / State" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field k="postal_code" label="Postal code" />
            <Field k="country" label="Country" />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Profile"}
      </button>
    </form>
  );
}
