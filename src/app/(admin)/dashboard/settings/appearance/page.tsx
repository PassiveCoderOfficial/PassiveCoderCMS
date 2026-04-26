"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SiteTheme = "light" | "dark" | "system";

interface ThemeOptionProps {
  value: SiteTheme;
  label: string;
  icon: React.ReactNode;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

function ThemeOption({ value, label, icon, description, selected, onSelect }: ThemeOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all text-left w-full",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/40 bg-card"
      )}
    >
      {selected && (
        <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </span>
      )}
      <div className="text-muted-foreground">{icon}</div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground text-center">{description}</div>
      {/* mini preview */}
      <div className={cn(
        "w-full h-10 rounded border overflow-hidden flex",
        value === "dark" ? "bg-zinc-900 border-zinc-700" : value === "light" ? "bg-white border-gray-200" : "bg-gradient-to-r from-white to-zinc-900 border-gray-300"
      )}>
        <div className={cn("w-1/3 h-full", value === "dark" ? "bg-zinc-800" : value === "light" ? "bg-gray-100" : "bg-gray-100")} />
        <div className="flex-1 p-1.5 space-y-1">
          <div className={cn("h-1.5 rounded-full w-3/4", value === "dark" ? "bg-zinc-600" : "bg-gray-300")} />
          <div className={cn("h-1.5 rounded-full w-1/2", value === "dark" ? "bg-zinc-700" : "bg-gray-200")} />
        </div>
      </div>
    </button>
  );
}

export default function AppearanceSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("site_settings").select("*").single().then(({ data }) => {
      if (data) setSettings(data);
    });
  }, []);

  const update = (key: string, value: unknown) => setSettings((s) => s ? { ...s, [key]: value } : s);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("site_settings")
      .update(settings)
      .eq("id", settings.id as string);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Appearance settings saved");
  };

  if (!settings) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  const siteTheme = (settings.site_theme as SiteTheme) ?? "system";

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Appearance</h1>

      {/* Frontend Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Frontend Theme</CardTitle>
          <CardDescription className="text-xs">
            Controls the color scheme visitors see on your public website. This is independent of the admin panel theme (toggled in the top-right corner).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <ThemeOption
              value="light"
              label="Light"
              icon={<Sun className="h-5 w-5" />}
              description="Always light mode"
              selected={siteTheme === "light"}
              onSelect={() => update("site_theme", "light")}
            />
            <ThemeOption
              value="dark"
              label="Dark"
              icon={<Moon className="h-5 w-5" />}
              description="Always dark mode"
              selected={siteTheme === "dark"}
              onSelect={() => update("site_theme", "dark")}
            />
            <ThemeOption
              value="system"
              label="System"
              icon={<Monitor className="h-5 w-5" />}
              description="Follows visitor's OS preference"
              selected={siteTheme === "system"}
              onSelect={() => update("site_theme", "system")}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <strong>Note:</strong> "System" lets each visitor's device choose based on their OS dark/light mode preference.
          </p>
        </CardContent>
      </Card>

      {/* Custom Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Custom Code</CardTitle>
          <CardDescription className="text-xs">Injected into every page of your public site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Custom CSS</Label>
            <Textarea
              value={settings.custom_css as string ?? ""}
              onChange={(e) => update("custom_css", e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder="/* Your custom CSS here */"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Custom JavaScript</Label>
            <Textarea
              value={settings.custom_js as string ?? ""}
              onChange={(e) => update("custom_js", e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder="// Your custom JavaScript here"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Analytics Code</Label>
            <Textarea
              value={settings.analytics_code as string ?? ""}
              onChange={(e) => update("analytics_code", e.target.value)}
              rows={4}
              className="font-mono text-xs"
              placeholder="<!-- Google Analytics or other tracking code -->"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Settings
      </Button>
    </div>
  );
}
