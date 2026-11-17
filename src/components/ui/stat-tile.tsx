import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** One number with a label: dashboards and overviews. Colours come from the world's palette. */
export function StatTile({ label, value, icon: Icon, href, hint, className }: {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
  hint?: React.ReactNode;
  className?: string;
}) {
  const body = (
    <div className={cn(
      "flex h-full flex-col gap-2 rounded-xl border bg-card p-4 text-card-foreground transition-colors",
      href && "hover:border-primary/40 hover:bg-accent/40",
      className,
    )}>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-[13px] font-medium leading-5 text-muted-foreground">{label}</span>
        {Icon && (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="stat-value text-2xl font-semibold leading-8 tracking-tight tabular-nums">{value}</div>
      {hint && <div className="text-xs leading-4 text-muted-foreground">{hint}</div>}
    </div>
  );
  return href ? <Link prefetch={false} href={href} className="block h-full rounded-xl">{body}</Link> : body;
}
