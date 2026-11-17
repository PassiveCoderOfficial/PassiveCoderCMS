"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Pencil, UserCircle, LogOut, LayoutDashboard, GripHorizontal, ChevronsUp, ChevronsDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** Floating vertical icon menu shown on the live site to a logged-in admin
 *  of this tenant (or a super admin) — quick jump into the builder for the
 *  page they're currently viewing, without hunting through the dashboard. */
export function AdminEditWidget() {
  const pathname = usePathname();
  const router = useRouter();
  // What the pencil edits: the builder page, or the product on /products/<slug>.
  // Single product page, also under a language prefix (/ar/products/<slug>).
  const productSlug = pathname.match(/^(?:\/[a-z]{2}(?:-[a-zA-Z]{2})?)?\/products\/([^/]+)\/?$/)?.[1] ?? null;
  // The id resolved for a path; ignored once the path changes.
  const [resolved, setResolved] = useState<{ path: string; id: string | null } | null>(null);
  const target = { kind: productSlug ? "product" as const : "page" as const, id: resolved?.path === pathname ? resolved.id : null };
  // Draggable (so it never blocks the page) and collapsible; both remembered.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("pc-edit-widget") ?? "null") as { x?: number; y?: number; collapsed?: boolean } | null;
      /* eslint-disable react-hooks/set-state-in-effect -- restore saved position after mount */
      if (saved?.x != null && saved.y != null) setPos({ x: saved.x, y: saved.y });
      if (saved?.collapsed) setCollapsed(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {}
  }, []);
  const remember = (next: { x?: number; y?: number; collapsed?: boolean }) => {
    try { localStorage.setItem("pc-edit-widget", JSON.stringify({ ...(pos ?? {}), collapsed, ...next })); } catch {}
  };
  const clamp = (x: number, y: number) => {
    const r = box.current?.getBoundingClientRect();
    return { x: Math.min(Math.max(x, 4), window.innerWidth - (r?.width ?? 48) - 4), y: Math.min(Math.max(y, 4), window.innerHeight - (r?.height ?? 48) - 4) };
  };
  function onGripDown(e: React.PointerEvent) {
    const r = box.current!.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onGripMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
  }
  function onGripUp() {
    if (!drag.current) return;
    drag.current = null;
    if (pos) remember(pos);
  }
  const toggle = () => { setCollapsed((c) => { remember({ collapsed: !c }); return !c; }); };

  useEffect(() => {
    // App routes that are never a page-builder page — /table/[qrToken]
    // (restaurant dine-in QR landing) is the first of these, added rather
    // than guessed at generically since new non-page routes are rare and a
    // wrong guess here just costs one 404, not a real bug.
    if (/^\/table\//.test(pathname)) return;
    const slug = pathname === "/" ? "home" : pathname.replace(/^\//, "");
    const query = productSlug ? `product=${encodeURIComponent(decodeURIComponent(productSlug))}` : `slug=${encodeURIComponent(slug)}`;
    let cancelled = false;
    fetch(`/api/site/current-page?${query}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => !cancelled && setResolved({ path: pathname, id: data?.id ?? null }))
      .catch(() => !cancelled && setResolved({ path: pathname, id: null }));
    return () => { cancelled = true; };
  }, [pathname, productSlug]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const actions = [
    target.kind === "product"
      ? {
          icon: Pencil,
          label: "Edit this product",
          href: target.id ? `/dashboard/ecommerce/products/${target.id}` : "/dashboard/ecommerce/products",
        }
      : {
          icon: Pencil,
          label: "Edit this page",
          href: target.id ? `/dashboard/pages/${target.id}` : "/dashboard/pages",
        },
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: UserCircle, label: "Profile", href: "/dashboard/profile" },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div ref={box}
        className={`fixed z-[9999] flex flex-col items-center gap-1 rounded-2xl bg-gray-900/95 backdrop-blur-sm p-1.5 shadow-xl border border-white/10 ${pos ? "" : "left-4 top-1/2 -translate-y-1/2"}`}
        style={pos ? { left: pos.x, top: pos.y } : undefined}>
        <div role="button" aria-label="Drag to move" title="Drag to move"
          onPointerDown={onGripDown} onPointerMove={onGripMove} onPointerUp={onGripUp} onPointerCancel={onGripUp}
          className="flex h-5 w-9 items-center justify-center rounded-md text-gray-500 hover:text-gray-200 cursor-grab active:cursor-grabbing touch-none select-none">
          <GripHorizontal className="h-4 w-4" />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={toggle} aria-label={collapsed ? "Open menu" : "Collapse menu"}
              className="flex h-7 w-9 items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
              {collapsed ? <ChevronsDown className="h-4 w-4" /> : <ChevronsUp className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">{collapsed ? "Open menu" : "Collapse"}</TooltipContent>
        </Tooltip>
        {!collapsed && <>
        {actions.map((action) => (
          <Tooltip key={action.label}>
            <TooltipTrigger asChild>
              <a
                href={action.href}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <action.icon className="h-4 w-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">{action.label}</TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-900/40 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Logout</TooltipContent>
        </Tooltip>
        </>}
      </div>
    </TooltipProvider>
  );
}
