"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Link2, Smartphone, Globe2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Row {
  day: string;
  path: string;
  referrer_domain: string | null;
  device_type: string;
  country: string | null;
  views: number;
}

interface Bucket { key: string; views: number }
interface ApiResult {
  range: number;
  total: number;
  series: { day: string; views: number }[];
  topPaths: Bucket[];
  topReferrers: Bucket[];
  devices: Bucket[];
  topCountries: Bucket[];
}

function aggregate(rows: Row[], range: number): ApiResult {
  const byDay = new Map<string, number>();
  const byPath = new Map<string, number>();
  const byReferrer = new Map<string, number>();
  const byDevice = new Map<string, number>();
  const byCountry = new Map<string, number>();
  let total = 0;
  for (const r of rows) {
    total += r.views;
    byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.views);
    byPath.set(r.path, (byPath.get(r.path) ?? 0) + r.views);
    byDevice.set(r.device_type, (byDevice.get(r.device_type) ?? 0) + r.views);
    if (r.referrer_domain) byReferrer.set(r.referrer_domain, (byReferrer.get(r.referrer_domain) ?? 0) + r.views);
    if (r.country) byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + r.views);
  }
  const topN = (m: Map<string, number>, n: number): Bucket[] =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, views]) => ({ key, views }));
  const series: { day: string; views: number }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push({ day: key, views: byDay.get(key) ?? 0 });
  }
  return {
    range, total, series,
    topPaths: topN(byPath, 10),
    topReferrers: topN(byReferrer, 10),
    devices: topN(byDevice, 4),
    topCountries: topN(byCountry, 10),
  };
}

const RANGES = [7, 30, 90] as const;

export function AnalyticsClient({
  initialRows, initialRange, gaConnected,
}: {
  initialRows: Row[];
  initialRange: number;
  gaConnected: boolean;
}) {
  const [range, setRange] = useState<number>(initialRange);
  const [data, setData] = useState<ApiResult>(() => aggregate(initialRows, initialRange));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (range === initialRange) { setData(aggregate(initialRows, initialRange)); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/analytics?range=${range}`)
      .then(r => r.json())
      .then((d: ApiResult) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range, initialRange, initialRows]);

  const prevTotal = useMemo(() => {
    // Trend reference: first half of the range vs second half, of the SAME
    // fetched window — not a second query. Rough on purpose; this is a
    // "heading up or down lately" signal, not a report.
    const mid = Math.floor(data.series.length / 2);
    const first = data.series.slice(0, mid).reduce((s, p) => s + p.views, 0);
    const second = data.series.slice(mid).reduce((s, p) => s + p.views, 0);
    if (first === 0) return null;
    return Math.round(((second - first) / first) * 100);
  }, [data.series]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Visits to your site, tracked automatically — no setup needed.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="inline-flex p-2 rounded-lg bg-primary/10 mb-3">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{data.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visits, last {range} days
              {prevTotal !== null && (
                <span className={prevTotal >= 0 ? "text-green-600 ml-1.5" : "text-red-600 ml-1.5"}>
                  {prevTotal >= 0 ? "+" : ""}{prevTotal}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="inline-flex p-2 rounded-lg bg-primary/10 mb-3">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{data.topPaths.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pages with traffic</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="inline-flex p-2 rounded-lg bg-primary/10 mb-3">
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{data.topReferrers.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Referring sites</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Visits over time</CardTitle></CardHeader>
        <CardContent>
          <TrendChart series={data.series} loading={loading} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RankedList title="Top pages" icon={FileText} items={data.topPaths} formatKey={(k) => k} />
        <RankedList
          title="Top referrers"
          icon={ExternalLink}
          items={data.topReferrers}
          formatKey={(k) => k}
          empty="No referring sites yet — visits are arriving directly or from search."
        />
        <RankedList title="Devices" icon={Smartphone} items={data.devices} formatKey={(k) => k[0].toUpperCase() + k.slice(1)} />
        <RankedList title="Top countries" icon={Globe2} items={data.topCountries} formatKey={(k) => k} empty="No location data yet." />
      </div>

      <GoogleAnalyticsCard connected={gaConnected} />
    </div>
  );
}

function TrendChart({ series, loading }: { series: { day: string; views: number }[]; loading: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 800, H = 220, PAD = 32;
  const max = Math.max(1, ...series.map(p => p.views));
  const x = (i: number) => PAD + (i / Math.max(1, series.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);

  const path = series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.views).toFixed(1)}`).join(" ");
  const area = `${path} L ${x(series.length - 1).toFixed(1)} ${H - PAD} L ${x(0).toFixed(1)} ${H - PAD} Z`;

  return (
    <div className="relative" style={{ opacity: loading ? 0.5 : 1, transition: "opacity 150ms" }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px]" preserveAspectRatio="none">
        {/* Recessive baseline grid — three lines, no axis labels cluttering the plot */}
        {[0, 0.5, 1].map(f => (
          <line key={f} x1={PAD} x2={W - PAD} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)}
            stroke="hsl(var(--border))" strokeWidth={1} />
        ))}
        <path d={area} fill="hsl(var(--primary) / 0.08)" />
        <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={PAD} y2={H - PAD} stroke="hsl(var(--border))" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(series[hover].views)} r={4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
          </>
        )}
        {/* Invisible hit strip per point — hover target much bigger than the mark */}
        {series.map((p, i) => (
          <rect key={i} x={x(i) - (W / series.length) / 2} y={0} width={W / series.length} height={H}
            fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="absolute pointer-events-none rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md -translate-x-1/2 -translate-y-full"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(series[hover].views) / H) * 100}%` }}
        >
          <p className="font-medium tabular-nums">{series[hover].views.toLocaleString()} visits</p>
          <p className="text-muted-foreground">{new Date(series[hover].day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
        </div>
      )}
      {series.every(p => p.views === 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">No visits recorded yet in this range.</p>
        </div>
      )}
    </div>
  );
}

function RankedList({
  title, icon: Icon, items, formatKey, empty,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Bucket[];
  formatKey: (k: string) => string;
  empty?: string;
}) {
  const max = Math.max(1, ...items.map(i => i.views));
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Icon className="w-4 h-4 text-muted-foreground" /> {title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground py-4 text-center">{empty ?? "No data yet."}</p>
        )}
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-3 text-xs">
            <span className="flex-1 min-w-0 truncate font-mono">{formatKey(item.key)}</span>
            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
              <div className="h-full bg-primary rounded-full" style={{ width: `${(item.views / max) * 100}%` }} />
            </div>
            <span className="w-10 text-right tabular-nums text-muted-foreground shrink-0">{item.views}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function GoogleAnalyticsCard({ connected }: { connected: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Google Analytics</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-muted-foreground max-w-md">
          {connected
            ? "Connected — your site sends visit data to your own Google Analytics account too. View the full report at analytics.google.com."
            : "The panel above is your own data — nothing to set up. If you already use Google Analytics, connect your Measurement ID and we'll add it to your site alongside this."}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/settings/general#analytics">
            {connected ? "Manage connection" : "Connect Google Analytics"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
