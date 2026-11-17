"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { scriptJson } from "@/lib/security/style-text";
import { fmtDate, fmtDateTime, fmtTime } from "@/lib/time/panel-tz";

/**
 * Panel time zone for client components (see lib/time/panel-tz.ts). The
 * Super Admin, Staff Portal and root-site layouts wrap their tree in this
 * provider with the zone read on the server, so SSR and the browser format
 * with the same zone. Outside them the zone is undefined and formatting
 * keeps the runtime's own zone (tenant dashboards and sites, unchanged).
 */
const PanelTimeZoneContext = createContext<string | undefined>(undefined);

/**
 * Default zone for every date in the page (2026-11-07). Many components
 * format with plain toLocaleString()/toLocaleDateString()/toLocaleTimeString(),
 * which use the browser's zone. This makes the configured zone their default
 * whenever no timeZone option is passed (an explicit timeZone still wins).
 * Runs as an inline script before hydration, and again on client navigation.
 */
const DEFAULT_TZ_JS = `function(z){try{new Intl.DateTimeFormat("en",{timeZone:z})}catch(e){return}var P=Date.prototype;P.__pcTz=z;if(P.__pcTzPatched)return;P.__pcTzPatched=1;["toLocaleString","toLocaleDateString","toLocaleTimeString"].forEach(function(k){var f=P[k];P[k]=function(l,o){if(!P.__pcTz||(o&&o.timeZone))return f.call(this,l,o);var n={};if(o)for(var x in o)n[x]=o[x];n.timeZone=P.__pcTz;return f.call(this,l,n)}})}`;

function setDefaultTimeZone(tz: string) {
  // eslint-disable-next-line no-new-func
  new Function("z", `(${DEFAULT_TZ_JS})(z)`)(tz);
}

export function PanelTimeZoneProvider({ tz, children }: { tz: string; children: React.ReactNode }) {
  useEffect(() => { setDefaultTimeZone(tz); }, [tz]);
  return (
    <PanelTimeZoneContext.Provider value={tz}>
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `(${DEFAULT_TZ_JS})(${scriptJson(tz)})` }} />
      {children}
    </PanelTimeZoneContext.Provider>
  );
}

export function usePanelTimeZone(): string | undefined {
  return useContext(PanelTimeZoneContext);
}

/** Formatters bound to the panel zone (or the runtime zone outside panels). */
export function usePanelDates() {
  const tz = usePanelTimeZone();
  return useMemo(() => ({
    tz,
    date: (d: Parameters<typeof fmtDate>[0], opts?: Intl.DateTimeFormatOptions, locale?: string | string[]) => fmtDate(d, tz, opts, locale),
    dateTime: (d: Parameters<typeof fmtDateTime>[0], opts?: Intl.DateTimeFormatOptions, locale?: string | string[]) => fmtDateTime(d, tz, opts, locale),
    time: (d: Parameters<typeof fmtTime>[0], opts?: Intl.DateTimeFormatOptions, locale?: string | string[]) => fmtTime(d, tz, opts, locale),
  }), [tz]);
}
