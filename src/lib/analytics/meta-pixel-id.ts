/**
 * Meta Pixel ids are 10-20 digits. Kept out of components/site/meta-pixel.tsx
 * ("use client"): a server route importing a constant from a client module
 * gets a client reference, not the value.
 */
export const META_PIXEL_RE = /^\d{10,20}$/;
