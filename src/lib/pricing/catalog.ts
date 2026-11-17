/**
 * Open edition: Passive Coder's own price list is hosted only. Only the
 * currency helpers the country code needs are here.
 */
export type Currency = "USD" | "BDT" | "AED" | "SAR" | "QAR" | "OMR" | "SGD" | "MYR";
export const CURRENCIES: Currency[] = ["USD", "BDT", "AED", "SAR", "QAR", "OMR", "SGD", "MYR"];
export const isCurrency = (c: unknown): c is Currency => typeof c === "string" && (CURRENCIES as string[]).includes(c);
