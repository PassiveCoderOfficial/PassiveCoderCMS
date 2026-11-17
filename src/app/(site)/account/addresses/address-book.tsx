"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddressForm, type AddressDraft } from "@/components/site/address-form";
import { deleteAddressAction, listAddressesAction, setDefaultAddressAction, type SavedAddress } from "../actions";

/** Saved addresses: add, edit, remove, choose the default. */
export function AddressBook({ initial, areas, bd = false }: { initial: SavedAddress[]; areas: string[]; bd?: boolean }) {
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<AddressDraft | null>(initial.length ? null : { label: "Home", full_name: "", phone: "", address_line1: "", area: "", city: "", postal_code: "", is_default: true });
  const reload = async () => setList(await listAddressesAction());

  return (
    <div className="rounded-2xl bg-card border p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1">
          <h1 className="text-lg font-bold">Delivery addresses</h1>
          <p className="text-sm text-muted-foreground">Pick any of these at checkout. Up to 10.</p>
        </div>
        {!editing && list.length < 10 && (
          <button onClick={() => setEditing({ label: list.length ? "Office" : "Home", full_name: list[0]?.full_name ?? "", phone: list[0]?.phone ?? "", address_line1: "", area: "", city: "", postal_code: "", is_default: !list.length })}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            <Plus className="w-4 h-4" /> Add address
          </button>
        )}
      </div>

      {editing && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 mb-5">
          <p className="font-semibold mb-4">{editing.id ? "Edit address" : "New address"}</p>
          <AddressForm initial={editing} areas={areas} bd={bd}
            onSaved={async () => { setEditing(null); await reload(); toast.success("Address saved"); }}
            onCancel={list.length ? () => setEditing(null) : undefined} />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {list.map((a) => (
          <div key={a.id} className={`rounded-xl border p-4 ${a.is_default ? "border-primary" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-semibold">{a.label}</span>
              {a.is_default && <span className="text-[10px] font-bold uppercase tracking-wide bg-primary text-primary-foreground rounded px-1.5 py-0.5">Default</span>}
              <span className="ml-auto flex gap-1">
                <button onClick={() => setEditing({ ...a })} aria-label="Edit" className="p-1.5 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                <button aria-label="Remove" className="p-1.5 text-muted-foreground hover:text-destructive"
                  onClick={async () => { if (!confirm(`Remove the ${a.label} address?`)) return; await deleteAddressAction(a.id); await reload(); }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </span>
            </div>
            <p className="text-sm font-medium">{a.full_name} · {a.phone}</p>
            <p className="text-sm text-muted-foreground">{[a.address_line1, a.thana || a.area, a.district || a.city, a.postal_code].filter((v, i, arr) => v && arr.indexOf(v) === i).join(", ")}</p>
            {!a.is_default && (
              <button onClick={async () => { await setDefaultAddressAction(a.id); await reload(); }} className="mt-2 text-xs font-semibold text-primary hover:underline">
                Make default
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
