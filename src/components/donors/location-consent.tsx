"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Loader2, Check, X } from "lucide-react";
import { donorApi } from "@/app/(site)/donors/ui";

interface Me {
  id: string;
  lat: number | null;
  lng: number | null;
  location_prompt_seen: boolean;
}

/**
 * One-time GPS ask shown after a donor's first login. Without coordinates a
 * donor can't be matched to nearby urgent requests, so we explain that and
 * ask — but only once. Declining sets the same seen flag, so we never nag.
 */
export function LocationConsent() {
  const [me, setMe] = useState<Me | null>(null);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await donorApi("/api/donors/auth/me", "GET");
    const donor: Me | null = r.data?.donor ?? null;
    setMe(donor);
    // Only for logged-in donors who have no location and haven't been asked.
    setShow(!!donor && !donor.location_prompt_seen && (donor.lat == null || donor.lng == null));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function allow() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Your browser can't share location.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await donorApi("/api/donors/auth/location-consent", "POST", {
          lat: pos.coords.latitude, lng: pos.coords.longitude,
        });
        setBusy(false);
        setShow(false);
      },
      () => {
        setBusy(false);
        setError("Couldn't read your location — check the browser permission and try again.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function decline() {
    setBusy(true);
    await donorApi("/api/donors/auth/location-consent", "POST", {});
    setBusy(false);
    setShow(false);
  }

  if (!show || !me) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-bold text-red-800">
              Allow location to get urgent blood requests near you
            </p>
            <p className="mt-0.5 text-xs text-red-700">
              We only match donors to requests within about 25 km. Without your
              location we can&apos;t tell you when someone nearby needs your blood
              group. Allow it at least this once.
            </p>
          </div>
        </div>

        {error && <p className="text-xs font-medium text-red-700">{error}</p>}

        <div className="flex gap-2">
          <button onClick={allow} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Yes, allow location
          </button>
          <button onClick={decline} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
            <X className="h-4 w-4" /> No, don&apos;t ask again
          </button>
        </div>
      </div>
    </div>
  );
}
