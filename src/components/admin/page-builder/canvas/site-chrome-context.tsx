"use client";

import { createContext, useContext } from "react";

/**
 * Lets a block deep in the canvas open the header/footer builder.
 *
 * A context rather than a prop chain: the handler has to save the page and
 * build a return URL, which only the page editor knows how to do, and the
 * consumers are four layers down (canvas -> wrapper -> toolbar/context menu ->
 * actions hook). Threading a callback through every one of those — including
 * the header builder's own canvas, which must NOT offer it — would add a prop
 * to components that otherwise have no interest in it.
 *
 * Undefined by default, so the header builder's canvas gets no provider and
 * the action simply doesn't appear there.
 */
export type EditSiteChrome = (target: "header" | "footer") => void;

const SiteChromeContext = createContext<EditSiteChrome | undefined>(undefined);

export const SiteChromeProvider = SiteChromeContext.Provider;

export function useEditSiteChrome(): EditSiteChrome | undefined {
  return useContext(SiteChromeContext);
}
