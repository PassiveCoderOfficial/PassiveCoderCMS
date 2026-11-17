"use client";

import { useEffect, useState } from "react";
import type { ShellNavSection } from "@/components/admin-shell/types";

/** Chats waiting for a person (asked, nobody joined), polled for the sidebar's red badge. */
export function useChatWaiting(root = false): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    let stop = false;
    const load = async () => {
      if (document.hidden) return;
      const r = await fetch(`/api/site-chat/inbox?count=1${root ? "&root=1" : ""}`, { cache: "no-store" }).catch(() => null);
      if (!stop && r?.ok) setN(Number((await r.json()).waiting ?? 0));
    };
    load();
    const id = setInterval(load, 15_000);
    return () => { stop = true; clearInterval(id); };
  }, [root]);
  return n;
}

/** Puts the red waiting badge on the nav item linking to `href`. */
export function withChatBadge(sections: ShellNavSection[], href: string, waiting: number): ShellNavSection[] {
  if (!waiting) return sections;
  return sections.map((s) => ({ ...s, items: s.items.map((i) => (i.href === href ? { ...i, badge: String(waiting), badgeTone: "alert" as const } : i)) }));
}
