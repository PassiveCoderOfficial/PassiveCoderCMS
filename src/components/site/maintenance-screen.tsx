import React from "react";

interface MaintenanceScreenProps {
  title?: string;
  description?: string;
  logoUrl?: string | null;
  siteName?: string;
}

/**
 * Full-screen "under construction" maintenance page shown sitewide when
 * site_settings.maintenance_mode is on. Orange theme + construction illustration.
 */
export function MaintenanceScreen({
  title = "We'll be back soon!",
  description = "Our site is currently undergoing scheduled maintenance. We're working hard to improve your experience and will be back online shortly. Thank you for your patience.",
  logoUrl,
  siteName,
}: MaintenanceScreenProps) {
  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-12 text-center"
      style={{
        background: "linear-gradient(160deg, #fb923c 0%, #f97316 45%, #ea580c 100%)",
      }}
    >
      <div className="max-w-lg w-full flex flex-col items-center">
        {/* Logo or site name */}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={siteName ?? "Logo"} className="h-12 w-auto object-contain mb-8 drop-shadow" />
        ) : siteName ? (
          <p className="text-white/90 font-bold text-xl tracking-tight mb-8">{siteName}</p>
        ) : null}

        {/* Construction illustration */}
        <svg
          viewBox="0 0 200 200"
          className="w-44 h-44 mb-8 drop-shadow-lg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Hard hat */}
          <ellipse cx="100" cy="150" rx="70" ry="10" fill="#000000" opacity="0.12" />
          <path d="M55 120 a45 45 0 0 1 90 0 z" fill="#FFFFFF" />
          <path d="M92 78 h16 v20 a8 8 0 0 1 -16 0 z" fill="#FFFFFF" />
          <rect x="45" y="118" width="110" height="12" rx="6" fill="#FFFFFF" />
          <rect x="94" y="62" width="12" height="20" rx="4" fill="#FFFFFF" />
          {/* Gear */}
          <g transform="translate(140 50)">
            <circle cx="0" cy="0" r="16" fill="#FFFFFF" />
            <circle cx="0" cy="0" r="7" fill="#f97316" />
            {Array.from({ length: 8 }).map((_, i) => (
              <rect
                key={i}
                x="-3"
                y="-22"
                width="6"
                height="8"
                rx="2"
                fill="#FFFFFF"
                transform={`rotate(${i * 45})`}
              />
            ))}
          </g>
          {/* Small gear */}
          <g transform="translate(54 56)">
            <circle cx="0" cy="0" r="11" fill="#FFFFFF" />
            <circle cx="0" cy="0" r="5" fill="#f97316" />
            {Array.from({ length: 6 }).map((_, i) => (
              <rect
                key={i}
                x="-2.5"
                y="-15"
                width="5"
                height="6"
                rx="2"
                fill="#FFFFFF"
                transform={`rotate(${i * 60})`}
              />
            ))}
          </g>
        </svg>

        {/* Caution stripe */}
        <div
          className="w-full max-w-xs h-2.5 rounded-full mb-8"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #1f2937 0 12px, #fbbf24 12px 24px)",
          }}
        />

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
          {title}
        </h1>
        <p className="text-white/90 text-sm sm:text-base leading-relaxed">
          {description}
        </p>
      </div>

      <p className="text-white/70 text-xs mt-12">
        © {new Date().getFullYear()} {siteName ?? "All rights reserved."}
      </p>
    </main>
  );
}
