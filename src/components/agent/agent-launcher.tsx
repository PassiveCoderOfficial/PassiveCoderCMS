"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AgentModal } from "./agent-modal";

// z-index sits alongside FloatingWhatsApp's z-[9998] (see
// src/components/site/floating-whatsapp.tsx) — admin dashboard and public
// site never render together, but matching the same convention keeps future
// stacking predictable. Left side is free here; bottom-right is the
// convention this codebase already uses for floating action buttons.
export function AgentLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI agent"
        className="fixed bottom-5 right-5 z-[9998] inline-flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-transform"
      >
        <Sparkles className="w-6 h-6" />
      </button>
      <AgentModal open={open} onOpenChange={setOpen} />
    </>
  );
}
