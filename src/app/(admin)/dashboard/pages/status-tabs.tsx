import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
  { key: "scheduled", label: "Scheduled" },
  { key: "trash", label: "Trash" },
];

// Shared filter-tab strip (build once, reuse everywhere) — used by both
// /dashboard/pages and /dashboard/posts, and any future post-type list.
export function StatusTabs({ basePath, active }: { basePath: string; active: string }) {
  return (
    <div className="flex items-center gap-1 mb-4 border-b overflow-x-auto">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.key === "all" ? basePath : `${basePath}?status=${tab.key}`}
          className={cn(
            "px-3 py-2 text-sm border-b-2 -mb-px whitespace-nowrap transition-colors",
            active === tab.key
              ? "border-primary text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
