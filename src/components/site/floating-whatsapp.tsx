"use client";

import { MessageCircle } from "lucide-react";

// Single-vendor site (Tanmoy Enterprise) — direct WhatsApp line, no API,
// just a floating deep-link button. Contact details are hardcoded per this
// tenant's explicit request; if this becomes a reusable pattern for other
// tenants, move to site_identity/site_settings and pass in as a prop.
const WHATSAPP_NUMBER = "6581703401"; // +65 8170 3401
const DEFAULT_MESSAGE = "Hi, I'd like to enquire about your services.";

export function FloatingWhatsApp() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-[9998] inline-flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
      style={{ backgroundColor: "#25D366" }}
    >
      <MessageCircle className="w-7 h-7 text-white" fill="white" strokeWidth={0} />
    </a>
  );
}
