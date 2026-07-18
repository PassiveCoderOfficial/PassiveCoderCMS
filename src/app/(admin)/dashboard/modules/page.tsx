"use client";

import { useEffect, useState } from "react";
import { Puzzle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MODULE_LABELS, type ModuleKey } from "@/components/admin/sidebar/nav-items";
import { Switch } from "@/components/ui/switch";

interface ModuleRow {
  key: ModuleKey;
  enabled: boolean;
}

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleRow[] | null>(null);
  const [saving, setSaving] = useState<ModuleKey | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/modules")
      .then((r) => r.json())
      .then((data) => setModules(Array.isArray(data.modules) ? data.modules : []))
      .catch(() => setModules([]));
  }, []);

  async function toggle(key: ModuleKey, enabled: boolean) {
    setSaving(key);
    setModules((prev) => (prev ?? []).map((m) => (m.key === key ? { ...m, enabled } : m)));
    try {
      const res = await fetch("/api/dashboard/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to update");
    } catch (err) {
      setModules((prev) => (prev ?? []).map((m) => (m.key === key ? { ...m, enabled: !enabled } : m)));
      toast.error(err instanceof Error ? err.message : "Failed to update module");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Puzzle className="h-6 w-6" /> Modules</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Turn dashboard sections on or off. Only modules included in your plan are shown here.
        </p>
      </div>

      {!modules ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !modules.length ? (
        <p className="text-sm text-muted-foreground py-10 text-center">
          Your current plan doesn&apos;t include any optional modules.
        </p>
      ) : (
        <div className="rounded-xl border divide-y">
          {modules.map((m) => (
            <div key={m.key} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">{MODULE_LABELS[m.key]}</span>
              <Switch
                checked={m.enabled}
                disabled={saving === m.key}
                onCheckedChange={(v) => toggle(m.key, v)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
