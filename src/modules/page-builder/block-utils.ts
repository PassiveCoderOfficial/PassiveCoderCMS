import type { BlockBackground } from "@/types/cms";

export function getBlockBackground(bg: BlockBackground): React.CSSProperties {
  if (!bg || bg.type === "none") return {};
  if (bg.type === "color") return { backgroundColor: bg.color };
  if (bg.type === "gradient") return { background: bg.gradient };
  if (bg.type === "image") {
    return {
      backgroundImage: `${bg.imageOverlay ? `linear-gradient(${bg.imageOverlay}${bg.imageOverlayOpacity !== undefined ? Math.round(bg.imageOverlayOpacity * 100) / 100 : ""}), ` : ""}url(${bg.imageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }
  return {};
}

export function getContainerClass(width: string): string {
  const map: Record<string, string> = {
    full: "w-full",
    wide: "max-w-7xl mx-auto px-6",
    normal: "max-w-5xl mx-auto px-6",
    narrow: "max-w-3xl mx-auto px-6",
  };
  return map[width] ?? "w-full";
}
