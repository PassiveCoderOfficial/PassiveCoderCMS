/**
 * A map location as the "Map location" control saves it (Contact block,
 * Visit + Map banner, Dashboard > Contact details). Pure data, shared by
 * server and client code.
 *
 * The block keeps writing a working embed URL next to it (mapEmbedUrl /
 * maps_embed_url), and that URL is what renders: this object only remembers
 * what the editor picked, so the control can say what the map shows.
 */
export type MapLocationSource = "search" | "link" | "address" | "pin" | "coords";

export type MapLocation = {
  /** Pin position. Missing when the place is only known by name (a share
   *  link from the Google Maps phone app) or when nothing could geocode it. */
  lat?: number;
  lng?: number;
  /** What the map shows, in words: the place name, address or searched text. */
  label?: string;
  /** Google zoom level, 3 (world) to 21 (building). */
  zoom?: number;
  /** Google Maps place id (the "cid" number) from a pasted link: the map
   *  shows that business with its name card. */
  cid?: string;
  /** How it was set. */
  source?: MapLocationSource;
};

/** Zoom presets for the control's slider. */
export const MAP_ZOOM = { min: 10, max: 20, city: 12, street: 15, building: 18, pin: 16, address: 15 } as const;

/** Height choices (px) where a block lets the editor size its map. */
export const MAP_HEIGHTS = [240, 320, 400, 480] as const;

export const hasCoords = (l: { lat?: number | null; lng?: number | null } | null | undefined): l is { lat: number; lng: number } =>
  !!l && typeof l.lat === "number" && typeof l.lng === "number" && Number.isFinite(l.lat) && Number.isFinite(l.lng);
