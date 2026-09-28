"use client";
import { useState } from "react";
import Image from "@/components/ui/smart-image";
import { ExternalLink, Globe } from "lucide-react";

const CLIENTS = [
  {
    domain: "dreamarabiasa.com",
    name: "Dream Arabia",
    category: "Real Estate",
    flag: "UAE",
  },
  {
    domain: "emiratescurtain.com",
    name: "Emirates Curtain",
    category: "Interior Fit-out",
    flag: "UAE",
  },
  {
    domain: "everydayrenovations.com",
    name: "Everyday Renovations",
    category: "Renovation",
    flag: "UAE",
  },
  {
    domain: "dubaideepcleaning.ae",
    name: "Dubai Deep Cleaning",
    category: "Cleaning Services",
    flag: "UAE",
  },
  {
    domain: "sbfitout.com",
    name: "SB Fit-out",
    category: "Fit-out & Design",
    flag: "UAE",
  },
  {
    domain: "anamikaglobal.com",
    name: "Anamika Global",
    category: "Business Services",
    flag: "India",
  },
  {
    domain: "eleganthome.my",
    name: "Elegant Home",
    category: "Interior Design",
    flag: "Malaysia",
  },
  {
    domain: "advanceconstructionsg.com",
    name: "Advance Construction",
    category: "Construction",
    flag: "Singapore",
  },
  {
    domain: "airconinteriorservicesg.com",
    name: "Aircon Interior Service",
    category: "HVAC & Interior",
    flag: "Singapore",
  },
  {
    domain: "skrarif.com",
    name: "SKR Arif",
    category: "Professional Services",
    flag: "Bangladesh",
  },
  {
    domain: "zayfa.qa",
    name: "Zayfa",
    category: "Services",
    flag: "Qatar",
  },
  {
    domain: "hasanflooringkl.com",
    name: "Hasan Flooring KL",
    category: "Flooring",
    flag: "Malaysia",
  },
  {
    domain: "almadhharpaints.com",
    name: "Al Madhhar Paints",
    category: "Paints & Coatings",
    flag: "Saudi Arabia",
  },
  {
    domain: "saudiarabiahvacservice.com",
    name: "Saudi Arabia HVAC",
    category: "HVAC Services",
    flag: "Saudi Arabia",
  },
  {
    domain: "hvactechnicianksa.com",
    name: "HVAC Technician KSA",
    category: "HVAC Services",
    flag: "Saudi Arabia",
  },
  {
    domain: "inspireshutter.com",
    name: "Inspire Shutter",
    category: "Photography",
    flag: "International",
  },
  {
    domain: "hackingdismantlesg.com",
    name: "Hacking Dismantle SG",
    category: "Demolition",
    flag: "Singapore",
  },
];


// Sites that were down or behind a bot check when the screenshots were taken
// (2026-09-28) stay out of the showcase: a dead link undoes the proof.
const HIDDEN = new Set(["eleganthome.my", "hvactechnicianksa.com", "almadhharpaints.com"]);
const SHOWN = CLIENTS.filter((c) => !HIDDEN.has(c.domain));
const COUNTRIES = ["All", ...Array.from(new Set(SHOWN.map((c) => c.flag)))];

export default function ClientsSection() {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? SHOWN : SHOWN.filter((c) => c.flag === filter);

  return (
    <section id="clients" className="py-24 bg-[#05060a] border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-white/[0.06] text-orange-300 text-xs font-semibold px-4 py-2 rounded-full mb-4 border border-white/[0.08]">
            <Globe className="w-3.5 h-3.5" /> Real client websites
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Real businesses. Real websites.{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Live right now.</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Every site below was built and is run on Passive Coder. Click any of them and see for yourself.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {COUNTRIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === c
                  ? "bg-white text-slate-950"
                  : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((client) => (
            <a
              key={client.domain}
              href={`https://${client.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.02] hover:border-orange-400/40 transition-colors"
            >
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border-b border-white/[0.06]">
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="ml-2 flex-1 truncate text-[11px] text-slate-500 font-mono">{client.domain}</span>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden bg-white">
                <Image
                  src={`/images/clients/${client.domain}.jpg`}
                  alt={`${client.name} website`}
                  fill
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate group-hover:text-orange-300 transition-colors">{client.name}</h3>
                  <p className="text-xs text-slate-500">{client.category} · {client.flag}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-orange-400 transition-colors shrink-0" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
