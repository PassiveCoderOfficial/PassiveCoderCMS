import React from "react";

/**
 * Coded SVG logo — a simple geometric mark (house roofline + a service
 * "check" tick, reading as "verified home services") paired with a bold
 * wordmark. Built as a component (not an image file) so it's crisp at any
 * size, themeable via props, and needs no asset pipeline. Used in the nav
 * and can back the favicon/OG image generation later.
 */
export function BrandLogo({
  size = 34,
  color = "#2563EB",
  textColor = "#0B1F3A",
  showText = true,
  text = "My Service SG",
  className,
}: {
  size?: number;
  color?: string;
  textColor?: string;
  showText?: boolean;
  text?: string;
  className?: string;
}) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: size * 0.28 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill={color} />
        {/* Roofline (home) */}
        <path d="M20 8L31 17.5V19.5L20 11L9 19.5V17.5L20 8Z" fill="white" />
        {/* House body */}
        <path d="M12 18V29C12 29.5523 12.4477 30 13 30H27C27.5523 30 28 29.5523 28 29V18L20 12L12 18Z" fill="white" fillOpacity="0.92" />
        {/* Service check-tick, offset like a badge */}
        <circle cx="27" cy="27" r="7" fill="#F59E0B" stroke={color} strokeWidth="1.5" />
        <path d="M24 27L26.2 29.2L30.2 24.8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showText && (
        <span style={{ fontWeight: 800, fontSize: size * 0.5, letterSpacing: "-0.02em", color: textColor, whiteSpace: "nowrap" }}>
          {text}
        </span>
      )}
    </span>
  );
}
