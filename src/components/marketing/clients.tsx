"use client";
import { useState } from "react";
import { ExternalLink, Globe } from "lucide-react";

const CLIENTS = [
  {
    domain: "dreamarabiasa.com",
    name: "Dream Arabia",
    country: "🇦🇪",
    category: "Real Estate",
    flag: "UAE",
  },
  {
    domain: "emiratescurtain.com",
    name: "Emirates Curtain",
    country: "🇦🇪",
    category: "Interior Fit-out",
    flag: "UAE",
  },
  {
    domain: "everydayrenovations.com",
    name: "Everyday Renovations",
    country: "🇦🇪",
    category: "Renovation",
    flag: "UAE",
  },
  {
    domain: "dubaideepcleaning.ae",
    name: "Dubai Deep Cleaning",
    country: "🇦🇪",
    category: "Cleaning Services",
    flag: "UAE",
  },
  {
    domain: "sbfitout.com",
    name: "SB Fit-out",
    country: "🇦🇪",
    category: "Fit-out & Design",
    flag: "UAE",
  },
  {
    domain: "anamikaglobal.com",
    name: "Anamika Global",
    country: "🇮🇳",
    category: "Business Services",
    flag: "India",
  },
  {
    domain: "eleganthome.my",
    name: "Elegant Home",
    country: "🇲🇾",
    category: "Interior Design",
    flag: "Malaysia",
  },
  {
    domain: "advanceconstructionsg.com",
    name: "Advance Construction",
    country: "🇸🇬",
    category: "Construction",
    flag: "Singapore",
  },
  {
    domain: "airconinteriorservicesg.com",
    name: "Aircon Interior Service",
    country: "🇸🇬",
    category: "HVAC & Interior",
    flag: "Singapore",
  },
  {
    domain: "skrarif.com",
    name: "SKR Arif",
    country: "🇧🇩",
    category: "Professional Services",
    flag: "Bangladesh",
  },
  {
    domain: "zayfa.qa",
    name: "Zayfa",
    country: "🇶🇦",
    category: "Services",
    flag: "Qatar",
  },
  {
    domain: "hasanflooringkl.com",
    name: "Hasan Flooring KL",
    country: "🇲🇾",
    category: "Flooring",
    flag: "Malaysia",
  },
  {
    domain: "almadhharpaints.com",
    name: "Al Madhhar Paints",
    country: "🇸🇦",
    category: "Paints & Coatings",
    flag: "Saudi Arabia",
  },
  {
    domain: "saudiarabiahvacservice.com",
    name: "Saudi Arabia HVAC",
    country: "🇸🇦",
    category: "HVAC Services",
    flag: "Saudi Arabia",
  },
  {
    domain: "hvactechnicianksa.com",
    name: "HVAC Technician KSA",
    country: "🇸🇦",
    category: "HVAC Services",
    flag: "Saudi Arabia",
  },
  {
    domain: "inspireshutter.com",
    name: "Inspire Shutter",
    country: "🌐",
    category: "Photography",
    flag: "International",
  },
  {
    domain: "hackingdismantlesg.com",
    name: "Hacking Dismantle SG",
    country: "🇸🇬",
    category: "Demolition",
    flag: "Singapore",
  },
];

const COUNTRIES = ["All", "UAE", "Singapore", "Malaysia", "Saudi Arabia", "Qatar", "Bangladesh", "India", "International"];

export default function ClientsSection() {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? CLIENTS : CLIENTS.filter(c => c.flag === filter);

  return (
    <section id="clients" className="py-24 bg-[#05060a] border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-white/[0.06] text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full mb-4 border border-white/[0.08]">
            <Globe className="w-3.5 h-3.5" /> Real Client Websites
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Trusted by businesses across{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">8 countries</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Every one of these websites was built and is maintained on Passive Coder. Real businesses, real results.
          </p>
        </div>

        {/* Country filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {COUNTRIES.map(c => (
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

        {/* Client grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((client) => (
            <a
              key={client.domain}
              href={`https://${client.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.15] hover:bg-white/[0.04] transition-all"
            >
              {/* Favicon / initial */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-lg flex-shrink-0">
                    {client.country}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors">{client.name}</h3>
                    <p className="text-xs text-slate-500">{client.category}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-1" />
              </div>

              {/* Domain */}
              <div className="flex items-center gap-1.5 mt-2">
                <Globe className="w-3 h-3 text-slate-600" />
                <span className="text-xs text-slate-500 font-mono">{client.domain}</span>
              </div>

              {/* Hover gradient border effect */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-indigo-500/0 group-hover:ring-indigo-500/20 transition-all pointer-events-none" />
            </a>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "17+", label: "Live websites" },
            { value: "8", label: "Countries" },
            { value: "9", label: "Industries" },
            { value: "24/7", label: "Uptime monitoring" },
          ].map(stat => (
            <div key={stat.label} className="text-center p-5 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
