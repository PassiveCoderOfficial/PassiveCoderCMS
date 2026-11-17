"use client";

import { useState } from "react";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { PinPickerMap, readBrowserLocation, type LatLng } from "@/components/map/pin-picker-map";
import { inZone } from "@/modules/registry/food-delivery/zones";
import type { FoodCheckout } from "@/modules/registry/food-delivery/routing";

/** Dhaka, when a restaurant without a zone has no pin yet. */
const DHAKA: LatLng = { lat: 23.8103, lng: 90.4125 };

/**
 * Delivery location for a restaurant's checkout (food delivery phase 1).
 * "Use my location" or drag the pin. A food programme restaurant needs the
 * pin inside its zone; the orders route checks the same thing server-side.
 */
export function DeliveryPin({ cfg, value, onChange }: {
  cfg: FoodCheckout;
  value: LatLng | null;
  onChange: (v: LatLng | null) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);
  const zone = cfg.zone;
  const outside = !!(value && zone && !inZone(zone.key, value));

  async function useMyLocation() {
    setLocating(true);
    setDenied(false);
    const pos = await readBrowserLocation();
    setLocating(false);
    if (!pos) { setDenied(true); return; }
    onChange({ lat: pos.lat, lng: pos.lng });
  }

  return (
    <div className="space-y-2" data-delivery-pin>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-primary" />
          Delivery location {cfg.pin === "required" && <span className="text-red-500">*</span>}
        </p>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
          Use my location
        </button>
      </div>
      <PinPickerMap
        value={value}
        onChange={onChange}
        center={zone?.center ?? DHAKA}
        area={zone?.polygon}
        title="Deliver here"
        height={240}
        fallback={value ? <p className="text-xs text-green-700 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2">Location set.</p> : null}
      />
      <p className="text-xs text-muted-foreground">
        {value
          ? "Drag the pin to your exact door if it is not quite right."
          : zone
            ? `Tap "Use my location", or tap the map to drop a pin. We deliver inside the green ${zone.name} area.`
            : "Tap \"Use my location\", or tap the map to drop a pin, so the rider finds you faster."}
      </p>
      {denied && (
        <p className="text-xs text-amber-600">We could not read your location. Allow location for this site, or tap the map to drop the pin.</p>
      )}
      {outside && zone && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
          This pin is outside {zone.name}. This restaurant delivers inside {zone.name} only. Move the pin, or choose Pickup.
        </p>
      )}
    </div>
  );
}
