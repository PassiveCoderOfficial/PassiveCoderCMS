import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { countryName, flagUrl } from "@/lib/countries";
import type { HeroBlockProps } from "@/types/cms";

type D = HeroBlockProps["data"];

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className={cn("relative inline-block", size)}>
            <Star className={cn("absolute inset-0 text-amber-400/30", size)} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn("text-amber-400", size)} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function Rating({ r, onDark }: { r: NonNullable<D["rating"]>; onDark?: boolean }) {
  const value = Number(r.value) || 5;
  const muted = onDark ? "text-white/70" : "text-muted-foreground";
  const text = r.label || (r.count ? `${r.count} reviews` : "");
  switch (r.style) {
    case "pill":
      return (
        <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm", onDark ? "border-white/15 bg-white/5" : "bg-muted/50")}>
          <Stars value={value} size="h-3.5 w-3.5" />
          <b className="font-semibold">{value.toFixed(1)}</b>
          {text && <span className={muted}>{text}</span>}
        </span>
      );
    case "google":
      return (
        <span className="inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
            <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="flex items-center gap-1.5"><b className="text-sm font-semibold">{value.toFixed(1)}</b><Stars value={value} size="h-3.5 w-3.5" /></span>
            <span className={cn("text-xs", muted)}>{text || "Google reviews"}</span>
          </span>
        </span>
      );
    case "big":
      return (
        <span className="inline-flex items-center gap-3">
          <b className="text-3xl font-extrabold leading-none">{value.toFixed(1)}</b>
          <span className="flex flex-col gap-1">
            <Stars value={value} />
            {text && <span className={cn("text-xs", muted)}>{text}</span>}
          </span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-2 text-sm">
          <Stars value={value} />
          <b className="font-semibold">{value.toFixed(1)}</b>
          {text && <span className={muted}>{text}</span>}
        </span>
      );
  }
}

/** Trust row under the hero buttons: rating, partner/certification logos and
 *  countries served. Each part has its own toggle; all off by default.
 *  Shared by every hero style. */
export function HeroTrust({ data, centered, right, onDark }: { data: D; centered?: boolean; right?: boolean; onDark?: boolean }) {
  const showRating = data.showRating && data.rating;
  const logos = data.showTrustLogos ? (data.trustLogos ?? []).filter((l) => l.url) : [];
  const countries = data.showCountries ? data.countries ?? [] : [];
  if (!showRating && !logos.length && !countries.length) return null;
  const justify = centered ? "justify-center" : right ? "justify-end" : "";
  const label = cn("text-xs font-medium uppercase tracking-widest", onDark ? "text-white/60" : "text-muted-foreground");

  return (
    <div className={cn("flex flex-col gap-4 pt-2", centered && "items-center", right && "items-end")}>
      {showRating && <div className={cn("flex", justify)}><Rating r={data.rating!} onDark={onDark} /></div>}
      {logos.length > 0 && (
        <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-3", justify)}>
          {data.trustLogosLabel && <span className={label}>{data.trustLogosLabel}</span>}
          {logos.map((l, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={l.url} alt={l.alt ?? ""} title={l.alt} loading="lazy"
              className={cn("h-9 w-auto max-w-[120px] object-contain", onDark ? "opacity-90" : "opacity-80 hover:opacity-100")} />
          ))}
        </div>
      )}
      {countries.length > 0 && (
        <div className={cn("flex flex-wrap items-center gap-3", justify)}>
          {data.countriesLabel && <span className={label}>{data.countriesLabel}</span>}
          <div className="flex flex-wrap items-center gap-2">
            {countries.map((c) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={c} src={flagUrl(c)} alt={countryName(c)} title={countryName(c)} loading="lazy"
                className="h-6 w-9 rounded-[4px] object-cover ring-1 ring-black/10 shadow-sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
