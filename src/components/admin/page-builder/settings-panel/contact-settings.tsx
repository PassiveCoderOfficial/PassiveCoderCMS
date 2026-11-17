"use client";

import React, { useEffect, useState } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Briefcase } from "lucide-react";
import { FormFieldsEditor } from "./lead-form-settings";
import { TextField } from "./showcase-fields";
import { UiTextFields } from "./ui-text-fields";
import type { ContactBlockProps } from "@/types/cms";
import { PhoneInput } from "@/components/ui/phone-input";
import { MapLocationInput } from "@/components/map/map-location-input";
import { loadSiteBusinessAddress, loadSiteContactRow } from "@/components/map/business-address";
import { toast } from "sonner";

type ContactData = ContactBlockProps["data"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-t pt-3">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

export function ContactSettings({ block }: { block: ContactBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const tenantId = useBuilderStore((s) => s.tenantId);
  // Always merge into the newest data: map lookups finish after a network
  // call, and the editor may have typed in another field meanwhile.
  const patch = (fields: Partial<ContactData>) => {
    const cur = (useBuilderStore.getState().getBlock(block.id) as ContactBlockProps | undefined)?.data ?? block.data;
    updateBlock(block.id, { data: { ...cur, ...fields } });
  };
  const update = (f: keyof ContactData, v: unknown) => patch({ [f]: v } as Partial<ContactData>);
  const d = block.data;

  // The site's Contact details address: the map shows it while this block
  // has neither its own address nor a map location.
  const [siteAddress, setSiteAddress] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadSiteContactRow(tenantId).then((r) => { if (live) setSiteAddress(r?.address ?? null); }).catch(() => {});
    return () => { live = false; };
  }, [tenantId]);

  // Fill the contact fields from the tenant's business profile. Only fills
  // what is empty — it must never overwrite something already written here for
  // this specific block.
  const [filling, setFilling] = useState(false);
  async function fillFromProfile() {
    setFilling(true);
    try {
      const res = await fetch("/api/business-profile");
      const p = (await res.json()).profile;
      if (!p) { toast.error("No business profile saved yet"); return; }
      const next: Partial<ContactData> = {};
      let changed = 0;
      if (!d.email && p.email) { next.email = p.email; changed++; }
      if (!d.phone && (p.whatsapp || p.phone)) { next.phone = p.whatsapp || p.phone; changed++; }
      if (!d.address && p.office_address) { next.address = p.office_address; changed++; }
      if (!changed) { toast.info("Nothing to fill: these are already set"); return; }
      patch(next);
      toast.success(`Filled ${changed} field${changed === 1 ? "" : "s"} from your business profile`);
    } catch {
      toast.error("Could not load your business profile");
    } finally {
      setFilling(false);
    }
  }

  // "Use my business address": this block's own address when it has one,
  // else the site's Contact details (with its saved map pin).
  async function businessAddress() {
    const site = await loadSiteBusinessAddress(tenantId);
    const own = (useBuilderStore.getState().getBlock(block.id) as ContactBlockProps | undefined)?.data.address?.trim() || "";
    if (!own) return site;
    return { address: own, embedUrl: site?.address?.trim() === own ? site.embedUrl : null };
  }

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={d.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={d.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={d.layout} onValueChange={v => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["centered","left","split"].map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs">Hide the form</Label>
          <p className="text-[10px] text-muted-foreground">Show only the contact details and map</p>
        </div>
        <Switch checked={!!d.hideForm} onCheckedChange={v => update("hideForm", v || undefined)} />
      </div>

      {!d.hideForm && (
        <Section title="Form">
          <TextField label="Button text" value={d.submitLabel} onChange={(v) => update("submitLabel", v)} placeholder="Send Message" />
          <TextField label="Thank-you message" value={d.successMessage} onChange={(v) => update("successMessage", v)} placeholder="Message sent!" />
          <TextField label="Send notifications to (email)" value={d.recipientEmail} onChange={(v) => update("recipientEmail", v)} placeholder="notifications@example.com" />
          <div className="space-y-1.5 rounded-md border p-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Open WhatsApp after submit</Label>
                <p className="text-[10px] text-muted-foreground">Saves the enquiry, then opens WhatsApp with the answers filled in</p>
              </div>
              <Switch checked={!!d.whatsappAfterSubmit?.enabled} onCheckedChange={v => update("whatsappAfterSubmit", { ...d.whatsappAfterSubmit, enabled: v })} />
            </div>
            {d.whatsappAfterSubmit?.enabled && (
              <>
                <PhoneInput value={d.whatsappAfterSubmit.number ?? ""} onChange={v => update("whatsappAfterSubmit", { ...d.whatsappAfterSubmit, number: v })} inputClassName="h-8 text-xs" />
                <p className="text-[10px] text-muted-foreground">Empty: the WhatsApp number below or in Contact details.</p>
                <Input value={d.whatsappAfterSubmit.intro ?? ""} onChange={e => update("whatsappAfterSubmit", { ...d.whatsappAfterSubmit, intro: e.target.value })} className="h-8 text-xs" placeholder="First line, e.g. Hello, I would like a quote." />
              </>
            )}
          </div>
          <div>
            <Label className="text-xs">Form look</Label>
            <Select value={d.formStyle ?? "card"} onValueChange={v => update("formStyle", v === "card" ? undefined : v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="card" className="text-xs">Card (labels above the boxes)</SelectItem>
                <SelectItem value="filled" className="text-xs">Filled boxes (labels inside the boxes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Taller form fields</Label>
            <Switch checked={!!d.largeInputs} onCheckedChange={v => update("largeInputs", v || undefined)} />
          </div>
        </Section>
      )}

      <Section title="Contact details">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Contact Info</Label>
          <Switch checked={d.showContactInfo} onCheckedChange={v => update("showContactInfo", v)} />
        </div>
        {d.showContactInfo && (
          <>
            <div><Label className="text-xs">Email</Label><Input value={d.email ?? ""} onChange={e => update("email", e.target.value)} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">Phone</Label><PhoneInput value={d.phone ?? ""} onChange={v => update("phone", v)} className="mt-1" inputClassName="h-8 text-xs" /></div>
            <div><Label className="text-xs">Address</Label><Input value={d.address ?? ""} onChange={e => update("address", e.target.value)} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">WhatsApp</Label><PhoneInput value={d.whatsapp ?? ""} onChange={v => update("whatsapp", v)} className="mt-1" inputClassName="h-8 text-xs" /></div>
            <div><Label className="text-xs">Opening hours</Label><Input value={d.hours ?? ""} onChange={e => update("hours", e.target.value)} placeholder="Sat–Thu, 10am–8pm" className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">Reply note</Label><Input value={d.note ?? ""} onChange={e => update("note", e.target.value)} placeholder="We reply within one business day" className="h-8 text-xs mt-1" /></div>
            <Button type="button" variant="outline" size="sm" onClick={fillFromProfile} disabled={filling} className="w-full h-8 text-xs">
              <Briefcase className="w-3 h-3 mr-1.5" />
              {filling ? "Loading…" : "Fill from business profile"}
            </Button>
          </>
        )}
      </Section>

      <Section title="Map">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Map</Label>
          <Switch checked={d.showMap} onCheckedChange={v => update("showMap", v)} />
        </div>
        {d.showMap && (
          <MapLocationInput
            hideTitle
            location={d.mapLocation}
            embedUrl={d.mapEmbedUrl}
            onChange={(loc, url) => patch({ mapLocation: loc ?? undefined, mapEmbedUrl: url || undefined })}
            fallbackAddress={d.address || siteAddress}
            loadBusinessAddress={businessAddress}
            height={{ value: d.mapHeight, onChange: (v) => update("mapHeight", v) }}
          />
        )}
      </Section>

      {!d.hideForm && (
        <div className="border-t pt-3">
          <FormFieldsEditor fields={d.fields} onChange={(fields) => update("fields", fields)} />
        </div>
      )}

      {/* Call us, Sending…, Select…: the block's other built-in words (ui-text.ts). */}
      <UiTextFields block={block} />
    </div>
  );
}
