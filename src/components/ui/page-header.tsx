import { cn } from "@/lib/utils";

/** The title row of an admin page: title, one line under it, actions on the right. */
export function PageHeader({ title, description, actions, className }: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-x-4 gap-y-2", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** A heading inside a page, above a group of cards or a list. */
export function SectionHeader({ title, description, actions, className }: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-4 gap-y-1", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold leading-6 tracking-tight">{title}</h2>
        {description && <p className="text-[13px] leading-5 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
