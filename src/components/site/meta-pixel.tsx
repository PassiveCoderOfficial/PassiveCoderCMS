"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Meta (Facebook) Pixel for a tenant site (site_settings.meta_pixel_id, set in
// Dashboard -> Analytics). Shared by the (site) and (marketing) layouts.
import { META_PIXEL_RE } from "@/lib/analytics/meta-pixel-id";

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

export function MetaPixel({ id }: { id: string | null | undefined }) {
  const pathname = usePathname();
  const first = useRef(true);

  // The init snippet tracks the first PageView; client-side navigations don't
  // reload the page, so track each later route change here.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  // Validated on save, re-checked here because the id is interpolated into a script.
  if (!id || !META_PIXEL_RE.test(id)) return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  );
}

/** Fire a standard Meta event (e.g. "Lead") if the site has a pixel. Safe to call anywhere. */
export function trackMeta(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined") window.fbq?.("track", event, params);
}
