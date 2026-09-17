"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, Link2, Smartphone, Globe2, ExternalLink, ShoppingBag, Package,
  TrendingUp, AlertCircle, CheckCircle2, Loader2, ChefHat, Clock3, Receipt,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { AiSiteBanner } from "@/components/admin/ai-site-banner";
import { BusinessProfilePrompt } from "@/components/admin/business-profile-prompt";
import { useT } from "@/lib/i18n/language-provider";

interface Order {
  id: string; order_number: string; customer_name: string; total: number; status: string;
}
interface Transaction {
  id: string; description: string; type: string; date: string; amount: number; currency?: string;
}
interface DashboardStats {
  pageCount: number; postCount: number; orderCount: number; productCount: number; userCount: number;
}

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
    // Same 'direct' / 'unknown' sentinels as the server aggregation in
    // /api/analytics — excluded here for the identical reason.
    if (r.referrer_domain && r.referrer_domain !== "direct") byReferrer.set(r.referrer_domain, (byReferrer.get(r.referrer_domain) ?? 0) + r.views);
    if (r.country && r.country !== "unknown") byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + r.views);
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
  tenantId, initialRows, initialRange, gaConnected, gaMeasurementId, gaOAuthEmail, gaPropertyId,
  showProSiteBanner, dashboardStats, recentOrders, recentTransactions, hasRestaurantBranches,
}: {
  tenantId: string;
  initialRows: Row[];
  initialRange: number;
  gaConnected: boolean;
  gaMeasurementId: string | null;
  gaOAuthEmail: string | null;
  gaPropertyId: string | null;
  showProSiteBanner: boolean;
  dashboardStats: DashboardStats;
  recentOrders: Order[];
  recentTransactions: Transaction[];
  hasRestaurantBranches: boolean;
}) {
  const t = useT();
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
      <AiSiteBanner tenantId={tenantId} />

      <BusinessProfilePrompt />

      {showProSiteBanner && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-700 dark:text-red-400">Your Pro site is not set up yet</p>
            <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">
              You have an active Pro subscription from ExpertNear.Me. Complete your site setup to go live — choose a site name, subdomain, and template.
            </p>
          </div>
          <Link href="/onboarding">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white border-0 shrink-0 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Create Your Pro Site
            </Button>
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("dashboard.welcome")}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/pages/new">{t("dashboard.newPage")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/posts/new">{t("dashboard.newPost")}</Link>
          </Button>
        </div>
      </div>

      {/* Site summary — moved here from the old standalone /dashboard page */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: t("dashboard.totalPages"), value: dashboardStats.pageCount, icon: FileText, href: "/dashboard/pages", color: "text-blue-600" },
          { label: t("dashboard.blogPosts"), value: dashboardStats.postCount, icon: FileText, href: "/dashboard/posts", color: "text-purple-600" },
          { label: t("dashboard.products"), value: dashboardStats.productCount, icon: Package, href: "/dashboard/ecommerce/products", color: "text-orange-600" },
          { label: t("dashboard.orders"), value: dashboardStats.orderCount, icon: ShoppingBag, href: "/dashboard/ecommerce/orders", color: "text-green-600" },
          { label: t("dashboard.users"), value: dashboardStats.userCount, icon: Users, href: "/dashboard/users", color: "text-pink-600" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{t("dashboard.recentOrders")}</CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/dashboard/ecommerce/orders">{t("dashboard.viewAll")}</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!recentOrders?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("dashboard.noOrdersYet")}</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">#{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        order.status === "completed" ? "bg-green-100 text-green-700" :
                        order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{t("dashboard.recentTransactions")}</CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/dashboard/accounting/transactions">{t("dashboard.viewAll")}</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!recentTransactions?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("dashboard.noTransactionsYet")}</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.type} · {tx.date}</p>
                    </div>
                    <p className={`font-semibold ${tx.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                      {tx.type === "expense" ? "-" : "+"}{formatCurrency(tx.amount, tx.currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{t("dashboard.quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { label: t("dashboard.newPage"), href: "/dashboard/pages/new" },
              { label: t("dashboard.newPost"), href: "/dashboard/posts/new" },
              { label: t("dashboard.addProduct"), href: "/dashboard/ecommerce/products/new" },
              { label: t("dashboard.uploadMedia"), href: "/dashboard/media" },
              { label: t("dashboard.manageThemes"), href: "/dashboard/themes" },
              { label: t("dashboard.manageModules"), href: "/dashboard/modules" },
              { label: t("dashboard.siteSettings"), href: "/dashboard/settings" },
            ].map((action) => (
              <Button key={action.href} asChild variant="outline" size="sm">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Traffic — own-data panel, previously the whole of this page */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div>
          <h2 className="text-xl font-bold">{t("dashboard.traffic")}</h2>
          <p className="text-sm text-muted-foreground">{t("dashboard.trafficSubtitle")}</p>
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
              {t("dashboard.visitsLast", { range })}
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
            <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.pagesWithTraffic")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="inline-flex p-2 rounded-lg bg-primary/10 mb-3">
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{data.topReferrers.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.referringSites")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">{t("dashboard.visitsOverTime")}</CardTitle></CardHeader>
        <CardContent>
          <TrendChart series={data.series} loading={loading} noVisitsLabel={t("dashboard.noVisitsInRange")} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RankedList title={t("dashboard.topPages")} icon={FileText} items={data.topPaths} formatKey={(k) => k} empty={t("dashboard.noDataYet")} />
        <RankedList
          title={t("dashboard.topReferrers")}
          icon={ExternalLink}
          items={data.topReferrers}
          formatKey={(k) => k}
          empty={t("dashboard.noReferrersYet")}
        />
        <RankedList title={t("dashboard.devices")} icon={Smartphone} items={data.devices} formatKey={(k) => k[0].toUpperCase() + k.slice(1)} empty={t("dashboard.noDataYet")} />
        <RankedList title={t("dashboard.topCountries")} icon={Globe2} items={data.topCountries} formatKey={(k) => k} empty={t("dashboard.noLocationYet")} />
      </div>

      {hasRestaurantBranches && <RestaurantSalesCard />}

      <GoogleAnalyticsCard
        measurementIdSet={gaConnected}
        initialMeasurementId={gaMeasurementId}
        initialOAuthEmail={gaOAuthEmail}
        initialPropertyId={gaPropertyId}
      />
    </div>
  );
}

function TrendChart({ series, loading, noVisitsLabel }: { series: { day: string; views: number }[]; loading: boolean; noVisitsLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 800, H = 220, PAD = 32;
  const isEmpty = series.every(p => p.views === 0);
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
        {/* All-zero data collapses the line onto the baseline, which reads as
            a broken chart rather than an empty one — draw nothing but the
            grid in that case, and say so in words instead. */}
        {!isEmpty && (
          <>
            <path d={area} fill="hsl(var(--primary) / 0.08)" />
            <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          </>
        )}
        {hover !== null && !isEmpty && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={PAD} y2={H - PAD} stroke="hsl(var(--border))" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(series[hover].views)} r={4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
          </>
        )}
        {/* Invisible hit strip per point — hover target much bigger than the mark */}
        {!isEmpty && series.map((p, i) => (
          <rect key={i} x={x(i) - (W / series.length) / 2} y={0} width={W / series.length} height={H}
            fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
      </svg>
      {hover !== null && !isEmpty && (
        <div
          className="absolute pointer-events-none rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md -translate-x-1/2 -translate-y-full"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(series[hover].views) / H) * 100}%` }}
        >
          <p className="font-medium tabular-nums">{series[hover].views.toLocaleString()} visits</p>
          <p className="text-muted-foreground">{new Date(series[hover].day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
        </div>
      )}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">{noVisitsLabel}</p>
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

interface GaProperty { id: string; displayName: string }
interface GaStatus {
  connected: boolean;
  tokenValid?: boolean;
  email?: string | null;
  propertyId?: string | null;
  properties?: GaProperty[];
}

interface SalesAnalytics {
  range: number; orderCount: number; totalRevenue: number; avgTicket: number;
  bestSellers: { name: string; quantity: number; revenue: number }[];
  peakHours: { hour: number; count: number }[];
  fulfillmentSplit: { type: string; count: number }[];
}

const SALES_RANGES = [7, 30, 90] as const;

function hourLabel(h: number): string {
  const period = h < 12 ? "am" : "pm";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${period}`;
}

/**
 * Restaurant sales analytics (Tier 2, docs/business/06-restaurant-vertical.md)
 * — best sellers, peak hours, average ticket. Only rendered for a tenant
 * with active branches (hasRestaurantBranches, set server-side in page.tsx).
 */
function RestaurantSalesCard() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/restaurant/sales-analytics?range=${range}`)
      .then(r => r.json())
      .then((d: SalesAnalytics) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range]);

  const maxHourCount = Math.max(1, ...(data?.peakHours.map(h => h.count) ?? [1]));
  const maxBestSeller = Math.max(1, ...(data?.bestSellers.map(b => b.quantity) ?? [1]));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-sm flex items-center gap-2"><ChefHat className="w-4 h-4 text-muted-foreground" /> Restaurant sales</CardTitle>
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {SALES_RANGES.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}>
                {r}d
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5" style={{ opacity: loading ? 0.6 : 1 }}>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xl font-bold tabular-nums">{data?.orderCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Orders</p>
          </div>
          <div>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(data?.totalRevenue ?? 0)}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
          <div className="flex items-start gap-1.5">
            <Receipt className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xl font-bold tabular-nums">{formatCurrency(data?.avgTicket ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Avg ticket</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Best sellers</p>
          {!data?.bestSellers.length ? (
            <p className="text-xs text-muted-foreground py-2">No orders in this range yet.</p>
          ) : (
            <div className="space-y-1.5">
              {data.bestSellers.map(b => (
                <div key={b.name} className="flex items-center gap-3 text-xs">
                  <span className="flex-1 min-w-0 truncate">{b.name}</span>
                  <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(b.quantity / maxBestSeller) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right tabular-nums text-muted-foreground shrink-0">{b.quantity}×</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Clock3 className="w-3.5 h-3.5" /> Peak hours</p>
          <div className="flex items-end gap-0.5 h-16">
            {(data?.peakHours ?? []).map(h => (
              <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="w-full bg-primary/70 rounded-t-sm" style={{ height: `${(h.count / maxHourCount) * 100}%`, minHeight: h.count > 0 ? "2px" : "0" }} />
                <span className="hidden group-hover:block absolute -top-5 text-[10px] bg-popover border rounded px-1 whitespace-nowrap">
                  {hourLabel(h.hour)}: {h.count}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>12am</span><span>12pm</span><span>11pm</span>
          </div>
        </div>

        {!!data?.fulfillmentSplit.length && (
          <div className="flex flex-wrap gap-2">
            {data.fulfillmentSplit.map(f => (
              <span key={f.type} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {f.type.replace("_", " ")}: {f.count}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Real Google OAuth connect (2026-09-14, per Wali — supersedes the old
 * paste-your-Measurement-ID-only card). "Connect Google Analytics" sends the
 * browser through Google's consent screen (api/analytics/google/connect);
 * once back, this polls /api/analytics/google/status for the account +
 * property list and lets the tenant pick which GA4 property feeds a live
 * report — see report/route.ts. Picking a property ALSO auto-fills
 * ga_measurement_id from that property's own web data stream
 * (property/route.ts) and the site's own gtag injection ((site)/layout.tsx,
 * (marketing)/layout.tsx) picks it up automatically — a DIY client never
 * needs to know what a Measurement ID even is, let alone copy-paste one.
 */
function GoogleAnalyticsCard({
  measurementIdSet, initialMeasurementId, initialOAuthEmail, initialPropertyId,
}: {
  measurementIdSet: boolean;
  initialMeasurementId: string | null;
  initialOAuthEmail: string | null;
  initialPropertyId: string | null;
}) {
  const [status, setStatus] = useState<GaStatus>({
    connected: !!initialOAuthEmail, email: initialOAuthEmail, propertyId: initialPropertyId, properties: [],
  });
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [autoTagged, setAutoTagged] = useState(measurementIdSet);
  // Manual Measurement ID field — moved here from Settings -> Appearance
  // (2026-09-14, per Wali) so the whole GA setup lives in one place.
  // Independent of the OAuth flow above: a tenant can paste an id here
  // without ever connecting, or override what auto-tag picked.
  const [measurementId, setMeasurementId] = useState(initialMeasurementId ?? "");
  const [savingMeasurementId, setSavingMeasurementId] = useState(false);

  function refreshStatus() {
    setLoadingStatus(true);
    fetch("/api/analytics/google/status")
      .then(r => r.json())
      .then((d: GaStatus) => setStatus(d))
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }

  useEffect(() => {
    // Re-check status after bouncing back from Google (ga_connected=1 /
    // ga_error=... in the URL) or on a normal load if we already had a
    // connected email from the server render — properties weren't sent down
    // with the initial page load, only fetched here.
    const params = new URLSearchParams(window.location.search);
    if (params.get("ga_connected") || params.get("ga_error") || initialOAuthEmail) {
      refreshStatus();
    }
    if (params.get("ga_error") === "not_configured") setNotConfigured(true);
    if (params.has("ga_connected") || params.has("ga_error")) {
      // Clean the URL so a refresh doesn't re-trigger the same message.
      params.delete("ga_connected");
      params.delete("ga_error");
      const clean = params.toString();
      window.history.replaceState(null, "", clean ? `?${clean}` : window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectProperty(propertyId: string) {
    setSavingProperty(true);
    const res = await fetch("/api/analytics/google/property", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property_id: propertyId }),
    });
    const json = await res.json().catch(() => ({}));
    setSavingProperty(false);
    if (res.ok) {
      setStatus(s => ({ ...s, propertyId }));
      // The site is auto-tagged with this property's own Measurement ID
      // (property/route.ts) — no manual copy-paste needed. A missing one
      // just means this GA4 property has no web data stream (an app-only
      // property, say); the report pull above still works either way.
      setAutoTagged(!!json.measurementId);
      if (json.measurementId) setMeasurementId(json.measurementId);
    }
  }

  async function saveMeasurementId() {
    setSavingMeasurementId(true);
    const res = await fetch("/api/analytics/google/measurement-id", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ measurement_id: measurementId }),
    });
    const json = await res.json().catch(() => ({}));
    setSavingMeasurementId(false);
    if (res.ok) {
      setAutoTagged(!!measurementId.trim());
      toast.success(measurementId.trim() ? "Measurement ID saved" : "Measurement ID cleared");
    } else {
      toast.error(json.error ?? "Failed to save Measurement ID");
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    const res = await fetch("/api/analytics/google/disconnect", { method: "POST" });
    setDisconnecting(false);
    if (res.ok) setStatus({ connected: false, properties: [] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Google Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status.connected ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground max-w-md">
              The panel above is your own data — nothing to set up. Connect a Google account to also
              pull a live report straight from your GA4 property, right here on this page.
              {measurementIdSet && " (Your site is also already sending its own visit data out to GA.)"}
            </p>
            <Button asChild size="sm" variant="outline">
              <a href="/api/analytics/google/connect">Connect Google Analytics</a>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs">
                {status.tokenValid === false ? (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                )}
                <span className="text-muted-foreground">
                  {status.tokenValid === false
                    ? "Connection needs to be renewed"
                    : "Connected"}
                  {status.email && <> as <span className="font-medium text-foreground">{status.email}</span></>}
                </span>
                {loadingStatus && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
              </div>
              <div className="flex gap-2">
                {status.tokenValid === false && (
                  <Button asChild size="sm" variant="outline">
                    <a href="/api/analytics/google/connect">Reconnect</a>
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={disconnect} disabled={disconnecting}>
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </Button>
              </div>
            </div>

            {status.tokenValid !== false && (
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-muted-foreground shrink-0">GA4 property:</label>
                {status.properties && status.properties.length > 0 ? (
                  <select
                    value={status.propertyId ?? ""}
                    disabled={savingProperty}
                    onChange={(e) => e.target.value && selectProperty(e.target.value)}
                    className="text-xs h-8 rounded-md border border-input bg-transparent px-2"
                  >
                    <option value="" disabled>Choose a property…</option>
                    {status.properties.map(p => (
                      <option key={p.id} value={p.id}>{p.displayName}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {loadingStatus ? "Loading properties…" : "No GA4 properties found on this account."}
                  </span>
                )}
              </div>
            )}

            {status.propertyId && status.tokenValid !== false && (
              autoTagged ? (
                <p className="text-xs text-green-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Your site is tagged and sending visits to this property — nothing else to set up.
                </p>
              ) : (
                <p className="text-xs text-amber-600">
                  This property has no web data stream, so we can&apos;t auto-tag your site from it — add one in Google Analytics
                  (Admin → Data Streams → Add stream → Web), or paste a Measurement ID below.
                </p>
              )
            )}
          </>
        )}
        {notConfigured && (
          <p className="text-xs text-amber-600">
            Google OAuth isn't set up on this deployment yet (missing GOOGLE_CLIENT_ID/SECRET) — ask an admin to add them.
          </p>
        )}

        {/* Manual Measurement ID — independent of the OAuth flow above.
            Moved here from Settings -> Appearance (2026-09-14) so the whole
            GA setup lives in one place. Connecting + picking a property
            already fills this in automatically; this is the fallback for a
            property with no web stream, or a tenant who'd rather paste an
            id directly without connecting OAuth at all. */}
        <div className="pt-3 border-t space-y-1.5">
          <label className="text-xs text-muted-foreground">
            {status.connected ? "Or set a Measurement ID manually" : "Or just paste your GA4 Measurement ID"}
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={measurementId}
              onChange={(e) => setMeasurementId(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="flex h-8 w-48 rounded-md border border-input bg-transparent px-2 text-xs font-mono shadow-sm"
            />
            <Button size="sm" variant="outline" onClick={saveMeasurementId} disabled={savingMeasurementId}>
              {savingMeasurementId ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
