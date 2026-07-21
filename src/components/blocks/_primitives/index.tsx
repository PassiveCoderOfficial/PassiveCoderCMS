"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared design primitives consumed by every block. Built once here so the
 * whole site stays visually consistent and centrally fixable — change a
 * primitive, every block updates. All read brand tokens (primary, accent,
 * surfaces, shadows) rather than hardcoding colors, so they adapt to the
 * active template automatically.
 */

/* ── Eyebrow: the small uppercase label above a section heading ─────────── */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary", className)}>
      {children}
    </span>
  );
}

/* ── SectionHeading: eyebrow + title + subtitle, centered or left ────────── */
export function SectionHeading({
  eyebrow, title, subtitle, align = "center", className, titleClassName,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
  titleClassName?: string;
}) {
  if (!eyebrow && !title && !subtitle) return null;
  return (
    <div
      data-reveal
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        "mb-12",
        className,
      )}
    >
      {eyebrow && <div className="mb-3"><Eyebrow>{eyebrow}</Eyebrow></div>}
      {title && (
        <h2 className={cn("text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance", titleClassName)}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed text-pretty">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ── Pill / Badge ────────────────────────────────────────────────────────── */
export function Pill({
  children, tone = "muted", className, icon,
}: {
  children: React.ReactNode;
  tone?: "primary" | "accent" | "muted" | "success";
  className?: string;
  icon?: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-foreground",
    muted: "bg-muted text-muted-foreground",
    success: "bg-green-50 text-green-700",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

/* ── Avatar with initial fallback ────────────────────────────────────────── */
export function Avatar({
  src, name, size = 40, className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? ""} width={size} height={size} className={cn("rounded-full object-cover shrink-0", className)} style={{ width: size, height: size }} />;
  }
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full bg-primary-soft text-primary font-semibold shrink-0", className)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

/* ── Star rating ─────────────────────────────────────────────────────────── */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 20 20" fill={i < rating ? "currentColor" : "none"}
          className={i < rating ? "text-amber-400" : "text-muted-foreground/30"} stroke="currentColor" strokeWidth="1.5">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 15l-5.3 2.6 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

/* ── CountUp: animates a number from 0 to target when scrolled into view ─── */
export function CountUp({
  value, prefix = "", suffix = "", duration = 1600, className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setDisplay(value); return; }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setDisplay(value); return; }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(eased * value));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return <span ref={ref} className={className}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ── Skeleton block ──────────────────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("pc-skeleton rounded-lg", className)} />;
}
