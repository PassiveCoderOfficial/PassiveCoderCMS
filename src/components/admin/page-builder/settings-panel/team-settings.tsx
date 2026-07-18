"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { TeamBlockProps, TeamMember } from "@/types/cms";

export function TeamSettings({ block }: { block: TeamBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const addMember = () => {
    const m: TeamMember = { id: generateId(), name: "New Member", role: "Role" };
    update("members", [...block.data.members, m]);
  };

  const updateMember = (id: string, f: keyof TeamMember, v: unknown) => {
    update("members", block.data.members.map(m => m.id === id ? { ...m, [f]: v } : m));
  };

  const removeMember = (id: string) => update("members", block.data.members.filter(m => m.id !== id));

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      {/* Layout + Show Social only affect TeamLegacy (no templateVariant) —
          "avatar-cards" has a fixed grid look and never reads these.
          Columns and Show Bio are read by both and stay visible always. */}
      {!block.templateVariant && (
        <div>
          <Label className="text-xs">Layout</Label>
          <Select value={block.data.layout} onValueChange={v => update("layout", v)}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{["grid","list","cards"].map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label className="text-xs">Columns</Label>
        <Select value={String(block.data.columns)} onValueChange={v => update("columns", Number(v))}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{[2,3,4].map(c => <SelectItem key={c} value={String(c)} className="text-xs">{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Bio</Label>
        <Switch checked={block.data.showBio} onCheckedChange={v => update("showBio", v)} />
      </div>
      {!block.templateVariant && (
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
          {block.data.members.map(m => (
            <div key={m.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex items-center gap-1">
                <Input value={m.name} onChange={e => updateMember(m.id, "name", e.target.value)} className="h-7 text-xs flex-1" placeholder="Name" />
                <Button size="icon" variant="ghost" onClick={() => removeMember(m.id)} className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Input value={m.role ?? ""} onChange={e => updateMember(m.id, "role", e.target.value)} className="h-7 text-xs" placeholder="Role/Title" />
              <Input value={m.avatar ?? ""} onChange={e => updateMember(m.id, "avatar", e.target.value)} className="h-7 text-xs" placeholder="Avatar URL" />
              <Input value={m.bio ?? ""} onChange={e => updateMember(m.id, "bio", e.target.value)} className="h-7 text-xs" placeholder="Short bio" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
