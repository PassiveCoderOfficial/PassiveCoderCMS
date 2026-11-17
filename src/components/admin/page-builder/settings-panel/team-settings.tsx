"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { renderedVariant } from "./rendered-variant";
import type { TeamBlockProps, TeamMember } from "@/types/cms";

/** Designs with a column count (the rest are lists or fixed grids). */
const COLUMN_VARIANTS = ["", "avatar-cards", "photo-tiles", "dark-cards", "bordered-grid"];
/** Designs that print the bio when "Show Bio" is on (Message always prints it). */
const BIO_VARIANTS = ["", "avatar-cards", "bio-rows", "dark-cards", "centered-feature"];
/** Designs that print the members' social / contact icons. */
const SOCIAL_VARIANTS = ["", "avatar-cards", "minimal-list"];
/** Designs that print the member's phone under the role. */
const NO_PHONE = ["minimal-list", "message"];

/** A member's icon links, one per line; saved when the field loses focus so new lines can be typed. */
function SocialLinksField({ member, onChange }: { member: TeamMember; onChange: (social: { platform: string; url: string }[]) => void }) {
  const saved = (member.social ?? []).map((s) => s.url).join("\n");
  const [text, setText] = React.useState(saved);
  React.useEffect(() => setText(saved), [saved]);
  const commit = () => onChange(text.split("\n").map((u) => u.trim()).filter(Boolean).map((url) => {
    const old = member.social?.find((s) => s.url === url);
    return { platform: old?.platform ?? (url.startsWith("mailto:") ? "email" : url.startsWith("tel:") ? "phone" : "website"), url };
  }));
  return (
    <Textarea value={text} rows={2} className="text-xs resize-none" onChange={(e) => setText(e.target.value)} onBlur={commit}
      placeholder={"Icon links, one per line (optional)\nmailto:name@example.com or https://..."} />
  );
}

export function TeamSettings({ block }: { block: TeamBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  // Hand-written blocks sometimes say `items`; the block draws those, so the panel edits them too.
  const raw = block.data as TeamBlockProps["data"] & { items?: TeamMember[] };
  const membersKey = Array.isArray(raw.members) || !Array.isArray(raw.items) ? "members" : "items";
  const members: TeamMember[] = (membersKey === "members" ? raw.members : raw.items) ?? [];

  const addMember = () => {
    const m: TeamMember = { id: generateId(), name: "New Member", role: "Role" };
    update(membersKey, [...members, m]);
  };

  const updateMember = (id: string, f: keyof TeamMember, v: unknown) => {
    update(membersKey, members.map(m => m.id === id ? { ...m, [f]: v } : m));
  };

  const removeMember = (id: string) => update(membersKey, members.filter(m => m.id !== id));

  // Unknown saved variants (e.g. "dark-avatar-cards") draw the default grid.
  const v = renderedVariant("team", block.templateVariant);
  const message = v === "message";
  const socialApplies = SOCIAL_VARIANTS.includes(v) && block.data.showSocial !== false;

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      {/* Layout only affects the default design; the named layouts have a fixed look. */}
      {!v && (
        <div>
          <Label className="text-xs">Layout</Label>
          <Select value={block.data.layout} onValueChange={v => update("layout", v)}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{["grid","list","cards"].map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {COLUMN_VARIANTS.includes(v) && (
        <div>
          <Label className="text-xs">Columns</Label>
          <Select value={String(block.data.columns)} onValueChange={v => update("columns", Number(v))}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{[2,3,4].map(c => <SelectItem key={c} value={String(c)} className="text-xs">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {BIO_VARIANTS.includes(v) && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Bio</Label>
          <Switch checked={block.data.showBio} onCheckedChange={v => update("showBio", v)} />
        </div>
      )}
      {v === "photo-tiles" && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Framed photos (no crop)</Label>
          <Switch checked={!!block.data.framedPhotos} onCheckedChange={v => update("framedPhotos", v)} />
        </div>
      )}
      {SOCIAL_VARIANTS.includes(v) && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Social Links</Label>
          <Switch checked={block.data.showSocial} onCheckedChange={v => update("showSocial", v)} />
        </div>
      )}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Members</p>
          <Button size="sm" variant="outline" onClick={addMember} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex items-center gap-1">
                <Input value={m.name} onChange={e => updateMember(m.id, "name", e.target.value)} className="h-7 text-xs flex-1" placeholder="Name" />
                <Button size="icon" variant="ghost" onClick={() => removeMember(m.id)} className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Input value={m.role ?? ""} onChange={e => updateMember(m.id, "role", e.target.value)} className="h-7 text-xs" placeholder="Role/Title" />
              {!NO_PHONE.includes(v) && <Input value={m.phone ?? ""} onChange={e => updateMember(m.id, "phone", e.target.value)} className="h-7 text-xs" placeholder="Phone (optional)" />}
              <MediaPickerInput compact value={m.avatar ?? ""} onChange={url => updateMember(m.id, "avatar", url)} focus={m.imageFocus} onFocusChange={f => updateMember(m.id, "imageFocus", f)} />
              {(message || BIO_VARIANTS.includes(v)) && (
                // Multi-line: Message prints the bio as the person's statement, keeping line breaks.
                <Textarea value={m.bio ?? ""} onChange={e => updateMember(m.id, "bio", e.target.value)} className="text-xs resize-none" rows={message ? 5 : 2} placeholder={message ? "Their message (line breaks are kept)" : "Short bio"} />
              )}
              {socialApplies && <SocialLinksField member={m} onChange={(social) => updateMember(m.id, "social", social.length ? social : undefined)} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
