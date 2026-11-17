"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Right-hand side panel built on Radix Dialog. Distinct from ui/sheet.tsx,
// which is the mobile bottom sheet used by the page builder — this one slides
// in from the right and is meant for record editors that need to stay next to
// the list they were opened from (scheduler content editor, brand editor).
// Full-width below `sm` so it stays usable on a phone.

export function SidePanel({
  open, onOpenChange, title, description, footer, widthClass = "sm:max-w-lg", children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Pinned to the bottom, outside the scroll area — actions stay reachable
   *  however long the form gets. */
  footer?: React.ReactNode;
  widthClass?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 right-0 z-[60] flex w-full flex-col border-l bg-background shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-200",
            widthClass,
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex shrink-0 items-start justify-between gap-2 border-b px-4 py-3">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-sm font-semibold">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-0.5 text-xs text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="-m-1 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>

          {footer && (
            <div className="flex shrink-0 flex-row items-center gap-2 border-t px-4 py-3">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
