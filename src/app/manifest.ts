import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Passive Coder",
    short_name: "PassiveCoder",
    description: "Your website, CRM, bookings, invoices and sales — in one dashboard.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#4f46e5",
    icons: [
      { src: "/pwa-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-180.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
