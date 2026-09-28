import Link from "next/link";
import Image from "@/components/ui/smart-image";
import { ArrowUpRight } from "lucide-react";

// Royalty-free photos (Unsplash licence). Each tile leads to the template
// gallery, so a visitor goes from "that's my business" to a ready-made
// design in one click.
const U = (id: string) => `https://images.unsplash.com/${id}?w=700&q=70&auto=format&fit=crop`;
const INDUSTRIES = [
  { label: "Restaurants & cafes", photo: U("photo-1555396273-367ea4eb4db5") },
  { label: "Construction & renovation", photo: U("photo-1504307651254-35680f356dfd") },
  { label: "Cleaning services", photo: U("photo-1581578731548-c64695cc6952") },
  { label: "Electrical, AC & plumbing", photo: U("photo-1621905251189-08b45d6a269e") },
  { label: "Clinics & health", photo: U("photo-1576091160399-112ba8d25d1d") },
  { label: "Salons & spas", photo: U("photo-1560066984-138dadb4c035") },
  { label: "Shops & retail", photo: U("photo-1441986300917-64674bd600d8") },
  { label: "Real estate", photo: U("photo-1600585154340-be6161a56a0c") },
];

export default function IndustriesSection() {
  return (
    <section className="bg-[#05060a] py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Built for businesses like yours</h2>
          <p className="mt-4 text-lg text-slate-400">
            Pick your trade and start from a design made for it: the right pages, the right photos, and buttons that bring in enquiries.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {INDUSTRIES.map((it) => (
            <Link
              key={it.label}
              href="/templates"
              className="group relative aspect-[4/5] sm:aspect-[4/4.4] rounded-2xl overflow-hidden ring-1 ring-white/10"
            >
              <Image src={it.photo} alt={it.label} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-2">
                <span className="text-white font-semibold leading-tight">{it.label}</span>
                <ArrowUpRight className="w-5 h-5 text-white/80 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
