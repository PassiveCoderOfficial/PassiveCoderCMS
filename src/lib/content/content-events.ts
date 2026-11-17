"use client";

import { useEffect, useState } from "react";

const EVENT = "content-changed";

/** Tell anything showing this content source on the page that it was saved. */
export function emitContentChanged(source: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: source }));
}

/** A number that goes up whenever this source is saved; put it in an effect's deps to refetch. */
export function useContentVersion(source: string | undefined): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const on = (e: Event) => { if ((e as CustomEvent).detail === source) setVersion((v) => v + 1); };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [source]);
  return version;
}
