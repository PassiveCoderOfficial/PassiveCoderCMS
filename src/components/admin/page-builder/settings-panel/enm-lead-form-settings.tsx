"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { EnmLeadFormBlockProps } from "@/types/cms";

export function EnmLeadFormSettings({ block }: { block: EnmLeadFormBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const upd = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">ENM API Key</Label>
        <Input
          value={block.data.apiKey}
          onChange={e => upd("apiKey", e.target.value)}
          className="h-8 text-xs mt-1 font-mono"
          placeholder="enm_xxxxxxxxxxxxxxxx…"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Generate from ExpertNear.Me → Dashboard → API Keys
        </p>
      </div>

      <div>
        <Label className="text-xs">Form Title</Label>
        <Input
          value={block.data.formTitle}
          onChange={e => upd("formTitle", e.target.value)}
          className="h-8 text-xs mt-1"
          placeholder="Get in Touch"
        />
      </div>

      <div>
        <Label className="text-xs">Button Label</Label>
        <Input
          value={block.data.buttonLabel}
          onChange={e => upd("buttonLabel", e.target.value)}
          className="h-8 text-xs mt-1"
          placeholder="Send Message"
        />
      </div>

      <div>
        <Label className="text-xs">Thank-you Message</Label>
        <Input
          value={block.data.thankYouMessage}
          onChange={e => upd("thankYouMessage", e.target.value)}
          className="h-8 text-xs mt-1"
          placeholder="Thanks! We'll be in touch soon."
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Label className="text-xs">Show Phone Field</Label>
        <Switch checked={block.data.showPhone} onCheckedChange={v => upd("showPhone", v)} />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Message Field</Label>
        <Switch checked={block.data.showMessage} onCheckedChange={v => upd("showMessage", v)} />
      </div>
    </div>
  );
}
