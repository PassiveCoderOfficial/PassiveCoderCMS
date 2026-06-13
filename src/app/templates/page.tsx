import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TemplatesShowcase from "@/components/marketing/templates-showcase";

export const metadata: Metadata = {
  title: "Website Templates — Passive Coder",
  description: "Browse 15+ professional website templates for local service businesses. Pick a template and go live today.",
};

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Minimal top nav */}
      <div className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-gray-900">Passive Coder</span>
          </Link>
          <Link
            href="/onboarding"
            className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-bold px-5 py-2 rounded-xl hover:from-orange-600 hover:to-rose-600 transition-all shadow-sm"
          >
            Get Started Free
          </Link>
        </div>
      </div>

      {/* Reuse the exact same component used on the homepage #templates section */}
      <TemplatesShowcase />

      {/* Footer strip */}
      <div className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Passive Coder ·{" "}
        <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
        {" · "}
        <Link href="/contact" className="hover:text-gray-600 transition-colors">Contact</Link>
      </div>
    </div>
  );
}
