import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** "Nothing here yet" for lists: an icon, one line of why, and the next step. */
export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center", className)}>
      {Icon && (
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <h3 className="text-base font-semibold leading-6">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm leading-5 text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
