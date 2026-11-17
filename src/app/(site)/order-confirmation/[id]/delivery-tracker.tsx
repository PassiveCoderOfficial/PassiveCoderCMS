"use client";

import { useEffect, useState } from "react";
import { Bike, Check, ChefHat, MapPin, Phone, ShoppingBag, PackageCheck } from "lucide-react";

type Step = "received" | "cooking" | "ready" | "rider_coming" | "on_the_way" | "delivered" | "cancelled";
type Track = { step: Step; rider: { name: string; phone: string | null; lat: number | null; lng: number | null } | null };

const STEPS: { key: Exclude<Step, "cancelled">; icon: typeof Bike; en: string; bn: string }[] = [
  { key: "received", icon: ShoppingBag, en: "Order received", bn: "অর্ডার পেয়েছি" },
  { key: "cooking", icon: ChefHat, en: "Cooking", bn: "রান্না হচ্ছে" },
  { key: "ready", icon: PackageCheck, en: "Food ready", bn: "খাবার তৈরি" },
  { key: "rider_coming", icon: Bike, en: "Rider picking up", bn: "রাইডার আনতে যাচ্ছেন" },
  { key: "on_the_way", icon: Bike, en: "Rider on the way", bn: "রাইডার আসছেন" },
  { key: "delivered", icon: Check, en: "Delivered", bn: "ডেলিভারি হয়েছে" },
];

/** Live delivery status on the customer's order page (food delivery phase 7). */
export function DeliveryTracker({ orderId, lang = "en" }: { orderId: string; lang?: "bn" | "en" }) {
  const [t, setT] = useState<Track | null>(null);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const res = await fetch(`/api/food/track?order=${orderId}`, { cache: "no-store" });
        if (res.ok) {
          const d = (await res.json()) as Track;
          if (!alive) return;
          setT(d);
          if (d.step === "delivered" || d.step === "cancelled") return;
        }
      } catch { /* try again */ }
      if (alive) timer = setTimeout(tick, 15_000);
    };
    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, [orderId]);

  if (!t || t.step === "cancelled") return null;
  const at = STEPS.findIndex((s) => s.key === t.step);
  return (
    <div className="bg-card border rounded-2xl p-4 space-y-3" data-delivery-tracker>
      <ol className="space-y-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i <= at;
          return (
            <li key={s.key} className={`flex items-center gap-3 text-sm ${done ? "text-foreground" : "text-muted-foreground/60"}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center ${i === at ? "bg-green-600 text-white" : done ? "bg-green-100 text-green-700" : "bg-muted"}`}><Icon className="w-4 h-4" /></span>
              <span className={i === at ? "font-semibold" : ""}>{lang === "bn" ? s.bn : s.en}</span>
            </li>
          );
        })}
      </ol>
      {t.rider && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-sm">
          <Bike className="w-4 h-4 text-green-600" />
          <span className="flex-1">{lang === "bn" ? `রাইডার: ${t.rider.name}` : `Rider: ${t.rider.name}`}</span>
          {t.rider.phone && <a href={`tel:${t.rider.phone}`} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-medium"><Phone className="w-3.5 h-3.5" /> {lang === "bn" ? "কল করুন" : "Call"}</a>}
          {t.rider.lat != null && t.rider.lng != null && (
            <a href={`https://www.google.com/maps?q=${t.rider.lat},${t.rider.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-medium"><MapPin className="w-3.5 h-3.5" /> {lang === "bn" ? "ম্যাপে দেখুন" : "Map"}</a>
          )}
        </div>
      )}
    </div>
  );
}
