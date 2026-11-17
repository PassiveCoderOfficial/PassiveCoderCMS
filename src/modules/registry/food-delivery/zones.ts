/** Open edition: no food delivery zones. */
export type LatLng = { lat: number; lng: number };

export type Zone = {
  key: string;
  name: string;
  nameBn: string;
  center: LatLng;
  polygon: [number, number][];
};

export function inZone(_zoneKey: string | null | undefined, _p: LatLng): boolean {
  return false;
}
