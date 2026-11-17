"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bot, FileText, Languages, SearchCheck, Plug, ImageIcon } from "lucide-react";
import { AgentChat } from "@/components/agent/agent-chat";
import { AiCreditsBar } from "@/components/agent/ai-credits-bar";
import { useAgentContext } from "@/components/agent/agent-context";

const SUGGESTIONS = [
  "Change our phone number everywhere to ",
  "Update our address on the contact page and footer to ",
  "Put a fitting photo in the first section of the homepage",
  "What does my homepage say about our services?",
  "Make the About page headline shorter and stronger",
  "List my pages that are still drafts",
];

/**
 * AiCoder home: one chat that can work on the whole site (any page, the
 * header and footer, business details, photos), plus shortcuts to the
 * bigger AI jobs that have their own screens.
 */
export default function AiCoderPage() {
  // Whole-site scope here, never a single page.
  const { clearEditorContext } = useAgentContext();
  useEffect(() => { clearEditorContext(); }, [clearEditorContext]);

  const shortcuts = [
    { href: "/dashboard/pages", icon: FileText, label: "Build or redesign a page", text: "Open a page, then AiCoder in the editor writes sections or the whole page." },
    { href: "/dashboard/settings/languages", icon: Languages, label: "Translate the site", text: "Pick pages and languages; AI translates them." },
    { href: "/dashboard/settings/seo", icon: SearchCheck, label: "Write SEO for every page", text: "Search titles and descriptions in one go." },
    { href: "/dashboard/media", icon: ImageIcon, label: "Photos", text: "Upload your own; the AI can place them for you." },
    { href: "/dashboard/ai-connect", icon: Plug, label: "Use ChatGPT or Claude", text: "Connect your own AI assistant to run this site." },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="w-6 h-6" /> AiCoder</h1>
          <p className="text-sm text-muted-foreground mt-1">Tell it what to change. It can edit any page, the header and footer, your business details and photos. You confirm every change first.</p>
        </div>
        <AiCreditsBar className="w-64" />
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
        <div className="rounded-xl border bg-card h-[calc(100vh-220px)] min-h-[480px] overflow-hidden">
          <AgentChat tall suggestions={SUGGESTIONS} />
        </div>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <Link key={s.href} href={s.href} className="flex gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
              <s.icon className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span><span className="block text-sm font-medium">{s.label}</span><span className="block text-xs text-muted-foreground">{s.text}</span></span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
