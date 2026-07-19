"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

// Bottom sheet built on Radix Dialog — slides up from the bottom, rounded top,
// grab handle, backdrop tap-to-close, internal scroll. Used by the mobile
// page-builder shell for the Add / Layers / Settings panels (one at a time).

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Tailwind max-height for the sheet body area. Default ~85vh. */
  heightClass?: string;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, title, heightClass = "max-h-[85vh]", children }: SheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[60] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-[60] flex flex-col rounded-t-2xl border-t bg-background shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-200",
            heightClass,
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Grab handle — tapping it closes, matching the drag-down expectation */}
          <button
            onClick={() => onOpenChange(false)}
            className="mx-auto mt-2 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30"
            aria-label="Close"
          />
          {title && (
            <DialogPrimitive.Title className="px-4 pb-2 text-sm font-semibold text-foreground shrink-0">
              {title}
            </DialogPrimitive.Title>
          )}
          {!title && <DialogPrimitive.Title className="sr-only">Panel</DialogPrimitive.Title>}
          <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
