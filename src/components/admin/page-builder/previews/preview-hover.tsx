"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Block } from "@/types/cms";
import { BlockPreview } from "./block-preview";

/**
 * A larger live preview of the hovered (or keyboard-focused) option, floated
 * beside the panel over the canvas so a layout can be judged at a readable
 * size before it is picked. Skipped on touch screens, where hover means tap.
 */
export type HoverPreviewPayload = {
  /** Block to render; null shows the title and description only. */
  block: Block | null;
  sig: string;
  title: string;
  description?: string;
  fallback?: React.ReactNode;
};

type Placed = { payload: HoverPreviewPayload; x: number; y: number; w: number };

const ASPECT = 0.75; // 4:3, taller than the tiles so more of the block shows
const WANTED = 560;
const GAP = 12;
const MARGIN = 8;
const TEXT_H = 64;

function place(anchor: HTMLElement, payload: HoverPreviewPayload): Placed | null {
  // Float beside the whole list (not just the hovered tile), so the card never
  // covers its neighbours.
  const scope = anchor.closest("[data-preview-scope]") as HTMLElement | null;
  const box = (scope ?? anchor).getBoundingClientRect();
  const tile = anchor.getBoundingClientRect();
  const roomRight = window.innerWidth - box.right - GAP - MARGIN;
  const roomLeft = box.left - GAP - MARGIN;
  const w = Math.min(WANTED, Math.max(roomRight, roomLeft));
  if (w < 280) return null;
  const x = roomRight >= w ? box.right + GAP : box.left - GAP - w;
  const h = (payload.block ? w * ASPECT : 0) + TEXT_H;
  const y = Math.min(Math.max(tile.top + tile.height / 2 - h / 2, MARGIN), Math.max(MARGIN, window.innerHeight - h - MARGIN));
  return { payload, x, y, w };
}

export function usePreviewHover() {
  const [placed, setPlaced] = useState<Placed | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRef = useRef(false);
  openRef.current = !!placed;
  const [canHover] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches);

  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };

  /** Show for this element; immediate when a card is already open (moving between options). */
  const show = useCallback((el: HTMLElement, payload: HoverPreviewPayload) => {
    clear();
    const go = () => setPlaced(place(el, payload));
    if (openRef.current) go();
    else timer.current = setTimeout(go, 350);
  }, []);

  /** Keyboard focus shows the card too, but only for keyboard users. */
  const showFocus = useCallback((el: HTMLElement, payload: HoverPreviewPayload) => {
    if (el.matches(":focus-visible")) show(el, payload);
  }, [show]);

  const hide = useCallback(() => {
    clear();
    setPlaced(null);
  }, []);

  /** Pointer left an option: close unless it lands on another one first. */
  const leave = useCallback(() => {
    clear();
    timer.current = setTimeout(() => setPlaced(null), 120);
  }, []);

  useEffect(() => clear, []);
  useEffect(() => {
    if (!placed) return;
    // The anchor moved: drop the card rather than leave it pointing at nothing.
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => { window.removeEventListener("scroll", hide, true); window.removeEventListener("resize", hide); };
  }, [placed, hide]);

  const card = placed && typeof document !== "undefined"
    ? createPortal(<HoverCard {...placed} />, document.body)
    : null;

  return { show: canHover ? show : noop, showFocus: canHover ? showFocus : noop, leave, hide, card, canHover };
}

const noop = () => {};

function HoverCard({ payload, x, y, w }: Placed) {
  return (
    <div
      role="presentation"
      className="fixed z-[60] pointer-events-none rounded-xl border bg-popover text-popover-foreground shadow-2xl p-2"
      style={{ left: x, top: y, width: w }}
    >
      {payload.block && (
        <BlockPreview block={payload.block} sig={payload.sig} aspect={ASPECT} eager fallback={payload.fallback} />
      )}
      <div className="px-1 pt-2 pb-0.5">
        <p className="text-xs font-semibold leading-tight">{payload.title}</p>
        {payload.description && <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{payload.description}</p>}
      </div>
    </div>
  );
}
