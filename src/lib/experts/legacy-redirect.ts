/** Open edition: no Experts directory, so no legacy hosts to redirect. */
export const LEGACY_HOSTS = new Set<string>();
export const EXPERTS_ORIGIN = "";

export function legacyExpertsPath(pathname: string): string {
  return pathname;
}
