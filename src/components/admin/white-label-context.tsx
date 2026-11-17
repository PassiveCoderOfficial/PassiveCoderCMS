"use client";

import { createContext, useContext } from "react";

/**
 * True in the dashboard of a white-label reseller's client (lib/partners/
 * brand.ts). Anything that names Passive Coder or our other products
 * (Experts) checks this and stays hidden.
 */
const WhiteLabelContext = createContext(false);

export function WhiteLabelProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <WhiteLabelContext.Provider value={value}>{children}</WhiteLabelContext.Provider>;
}

export const useWhiteLabel = () => useContext(WhiteLabelContext);
