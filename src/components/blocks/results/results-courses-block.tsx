"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Clock, GraduationCap } from "lucide-react";
import type { ResultsCoursesBlockProps } from "@/types/cms";

interface Course { id: string; name: string; slug: string; code: string | null; level: string | null; duration: string | null; summary: string | null; image_url: string | null; page_url: string | null }

/** Courses from Dashboard → Results → Courses, as photo cards or a compact
 *  list. Each course links to its page on the site when one is set. */
export function ResultsCoursesBlock({ block }: { block: ResultsCoursesBlockProps }) {
  const { data } = block;
  const accent = data.accentColor || "hsl(var(--primary))";
  const [courses, setCourses] = useState<Course[] | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (data.featuredOnly) qs.set("featured", "1");
    if (data.limit) qs.set("limit", String(data.limit));
    fetch(`/api/results/courses-public?${qs}`).then((r) => r.json()).then((d) => setCourses(Array.isArray(d) ? d : [])).catch(() => setCourses([]));
  }, [data.featuredOnly, data.limit]);

  const cols = { 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[data.columns ?? 3];
  const linkLabel = data.linkLabel || "View course";

  return (
    <section className="px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {(data.title || data.subtitle || data.eyebrow) && (
          <div className="text-center max-w-2xl mx-auto mb-12">
            {data.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>{data.eyebrow}</p>}
            {data.title && <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{data.title}</h2>}
            {data.subtitle && <p className="mt-3 text-muted-foreground">{data.subtitle}</p>}
          </div>
        )}

        {courses === null ? (
          <div className={`grid gap-6 ${cols}`}>{[0, 1, 2].map((i) => <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : courses.length === 0 ? (
          <p className="text-center text-muted-foreground">Courses will appear here once added in Dashboard → Results → Courses.</p>
        ) : data.style === "list" ? (
          <div className="max-w-4xl mx-auto divide-y divide-border border border-border rounded-2xl bg-card overflow-hidden">
            {courses.map((c) => {
              const Row = c.page_url ? "a" : "div";
              return (
                <Row key={c.id} {...(c.page_url ? { href: c.page_url } : {})} className="flex items-center gap-4 p-5 hover:bg-muted/60 transition-colors">
                  <span className="w-11 h-11 shrink-0 rounded-xl grid place-items-center text-white" style={{ background: accent }}><GraduationCap className="w-5 h-5" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-card-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{[c.level, c.code].filter(Boolean).join(" · ")}</p>
                  </div>
                  {c.duration && <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" />{c.duration}</span>}
                  {c.page_url && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                </Row>
              );
            })}
          </div>
        ) : (
          <div className={`grid gap-6 ${cols}`}>
            {courses.map((c) => (
              <article key={c.id} className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.image_url && <img src={c.image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  {c.level && <span className="absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-semibold text-white" style={{ background: accent }}>{c.level}</span>}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-lg leading-snug text-card-foreground">{c.name}</h3>
                  {c.duration && <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5" />{c.duration}</p>}
                  {c.summary && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{c.summary}</p>}
                  {c.page_url && (
                    <a href={c.page_url} className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold after:absolute after:inset-0" style={{ color: accent }}>
                      {linkLabel} <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
