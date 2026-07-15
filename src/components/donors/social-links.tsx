"use client";

import { SOCIAL_PLATFORMS } from "@/lib/donors/socials";

function Icon({ svg, className }: { svg: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor"
      dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

/** Row of colored brand-icon links on a donor profile. Opens in new tab. */
export function SocialLinks({ socials }: { socials: Record<string, string> }) {
  const items = SOCIAL_PLATFORMS.filter((p) => socials[p.key]);
  if (items.length === 0) return null;
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {items.map((p) => (
        <a key={p.key} href={socials[p.key]} target="_blank" rel="noopener noreferrer"
          title={p.label} aria-label={p.label}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
          style={{ backgroundColor: p.color }}>
          <Icon svg={p.svg} className="w-5 h-5" />
        </a>
      ))}
    </div>
  );
}

/** Editable list of social URLs for the add/edit forms. */
export function SocialLinksEditor({ socials, onChange }: {
  socials: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-2">
      {SOCIAL_PLATFORMS.map((p) => (
        <div key={p.key} className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: p.color }}>
            <Icon svg={p.svg} className="w-4 h-4" />
          </span>
          <input
            className="flex-1 border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
            placeholder={p.placeholder}
            value={socials[p.key] ?? ""}
            onChange={(e) => onChange({ ...socials, [p.key]: e.target.value })}
          />
        </div>
      ))}
      <p className="text-[11px] text-gray-400">Leave blank to hide. Links open in a new tab.</p>
    </div>
  );
}
