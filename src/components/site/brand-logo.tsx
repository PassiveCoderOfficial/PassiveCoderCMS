import React from "react";

/**
 * Coded SVG logo for the "Warm & Approachable" brand — a soft rounded-square
 * badge with a simple home glyph and a small heart accent (reads as "cared
 * for home services", warmer than a corporate checkmark) paired with a
 * serif-leaning wordmark. Built as a component (not an image file) so it's
 * crisp at any size, themeable via props, and needs no asset pipeline.
 */
export function BrandLogo({
  size = 34,
  // Neutral defaults — SVG fills need literal colors, and this component is
  // shared across tenants. Callers (e.g. the nav) pass the tenant's own
  // brand colors in; these only apply if nothing is supplied.
  color = "#2563EB",
  accentColor = "#F59E0B",
  textColor = "#111827",
  showText = true,
  text = "My Service SG",
  className,
}: {
  size?: number;
  color?: string;
  accentColor?: string;
  textColor?: string;
  showText?: boolean;
  text?: string;
  className?: string;
}) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: size * 0.28 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* Soft rounded-square badge — friendlier than a sharp rect */}
        <rect width="40" height="40" rx="14" fill={color} />
        {/* Home glyph, simplified & rounded */}
        <path d="M20 9.5L30 17.5V28.5C30 29.3284 29.3284 30 28.5 30H11.5C10.6716 30 10 29.3284 10 28.5V17.5L20 9.5Z" fill="white" fillOpacity="0.95" />
        {/* Doorway cutout for warmth/depth */}
        <rect x="17" y="22" width="6" height="8" rx="2" fill={color} />
        {/* Small heart accent, offset like a badge — "care" not "verification" */}
        <g transform="translate(24.5, 22.5)">
          <path
            d="M5 9C5 9 0 5.7 0 2.6C0 0.9 1.3 0 2.6 0C3.6 0 4.5 0.6 5 1.5C5.5 0.6 6.4 0 7.4 0C8.7 0 10 0.9 10 2.6C10 5.7 5 9 5 9Z"
            fill={accentColor}
            stroke={color}
            strokeWidth="1.2"
          />
        </g>
      </svg>
      {showText && (
        <span style={{ fontWeight: 600, fontSize: size * 0.5, letterSpacing: "-0.01em", color: textColor, whiteSpace: "nowrap", fontFamily: "var(--heading-font, inherit)" }}>
          {text}
        </span>
      )}
    </span>
  );
}
