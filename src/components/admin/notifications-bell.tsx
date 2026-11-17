"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

const SW = "/push-sw.js";
const EVENTS: { key: string; label: string; hint: string }[] = [
  { key: "order", label: "New orders", hint: "When a customer places an order" },
  { key: "lead", label: "New enquiries", hint: "Contact form messages" },
  { key: "booking", label: "New bookings", hint: "Appointment requests" },
  { key: "payment", label: "Payments and invoices", hint: "Payment received, invoice sent or due" },
  { key: "ticket", label: "Support replies", hint: "When Passive Coder answers your ticket" },
];

function keyBytes(b64: string): ArrayBuffer {
  const p = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + p).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out.buffer;
}

/**
 * Header bell: turn notifications on for this device and choose which events
 * to hear about. Works in phone browsers and the installed app; shows a plain
 * message where the browser can't do push (e.g. iPhone Safari outside the app).
 */
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<Record<string, boolean>>({});
  const [thisDevice, setThisDevice] = useState(false);
  const [devices, setDevices] = useState(0);
  const [pubKey, setPubKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");

  const load = useCallback(async () => {
    const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setPerm(supported ? Notification.permission : "unsupported");
    let endpoint = "";
    if (supported) {
      const reg = await navigator.serviceWorker.getRegistration(SW);
      endpoint = (await reg?.pushManager.getSubscription())?.endpoint ?? "";
    }
    const j = await fetch(`/api/notifications${endpoint ? `?endpoint=${encodeURIComponent(endpoint)}` : ""}`).then((r) => r.json()).catch(() => null);
    if (j && !j.error) { setEvents(j.events ?? {}); setThisDevice(!!j.thisDevice); setDevices(j.devices ?? 0); setPubKey(j.publicKey ?? ""); }
  }, []);
  useEffect(() => { if (open) load(); }, [open, load]);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      setPerm(permission);
      if (permission !== "granted") { toast.error("Notifications are blocked. Allow them in your browser's site settings, then try again."); return; }
      const reg = await navigator.serviceWorker.register(SW);
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(pubKey) });
      const res = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON() }) });
      if (!res.ok) throw new Error("Could not save this device");
      toast.success("Notifications are on for this device");
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not turn notifications on"); }
    finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) { await fetch(`/api/notifications?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: "DELETE" }); await sub.unsubscribe(); }
      await load();
    } finally { setBusy(false); }
  }

  async function toggle(key: string, on: boolean) {
    const next = { ...events, [key]: on };
    setEvents(next);
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events: next }) });
  }

  const Icon = perm === "unsupported" ? Bell : thisDevice ? BellRing : BellOff;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notifications">
          <Icon className="h-4 w-4" />
          {thisDevice && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div>
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">Get a message on your phone or computer, even when the dashboard is closed.</p>
        </div>
        {perm === "unsupported" ? (
          <p className="text-xs text-muted-foreground">This browser can&apos;t show notifications. On iPhone, add the dashboard to your Home Screen first, then open it from there.</p>
        ) : thisDevice ? (
          <div className="flex items-center justify-between gap-2 rounded-md bg-emerald-500/10 px-3 py-2">
            <p className="text-xs text-emerald-700 dark:text-emerald-400">On for this device{devices > 1 ? ` (${devices} devices in total)` : ""}</p>
            <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy} onClick={disable}>Turn off</Button>
          </div>
        ) : (
          <Button className="w-full" disabled={busy || !pubKey} onClick={enable}>
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Bell className="w-4 h-4 mr-1" />} Enable notifications on this device
          </Button>
        )}
        <div className="space-y-2.5 border-t pt-3">
          {EVENTS.map((e) => (
            <label key={e.key} className="flex items-center justify-between gap-3">
              <span><span className="block text-sm">{e.label}</span><span className="block text-[11px] text-muted-foreground">{e.hint}</span></span>
              <Switch checked={events[e.key] !== false} onCheckedChange={(v) => toggle(e.key, v)} />
            </label>
          ))}
        </div>
        {thisDevice && (
          <Button variant="outline" size="sm" className="w-full" onClick={async () => { const r = await fetch("/api/notifications/test", { method: "POST" }); toast[r.ok ? "success" : "error"](r.ok ? "Test sent. It should appear in a moment." : "Could not send the test"); }}>
            <Send className="w-3.5 h-3.5 mr-1" /> Send a test
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
