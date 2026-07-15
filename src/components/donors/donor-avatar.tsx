"use client";

import { Droplet } from "lucide-react";

/** Donor profile photo with a blood-drop placeholder fallback. */
export function DonorAvatar({ photoUrl, name, size = 44 }: {
  photoUrl?: string | null; name?: string; size?: number;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name ?? "Donor"}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0 bg-red-100"
      style={{ width: size, height: size }}
      aria-label={name ?? "Donor"}
    >
      <Droplet className="text-red-500" style={{ width: size * 0.45, height: size * 0.45 }} fill="currentColor" />
    </span>
  );
}
