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
    <section id="clients" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Globe className="w-3 h-3" /> Real Client Websites
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Trusted by businesses across{" "}
            <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">8 countries</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
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
                  ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-200"
                  : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
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
              className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-50 transition-all"
            >
              {/* Favicon / initial */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-rose-50 border border-orange-100 flex items-center justify-center text-lg flex-shrink-0">
                    {client.country}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm group-hover:text-orange-600 transition-colors">{client.name}</h3>
                    <p className="text-xs text-gray-400">{client.category}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0 mt-1" />
              </div>

              {/* Domain */}
              <div className="flex items-center gap-1.5 mt-2">
                <Globe className="w-3 h-3 text-gray-300" />
                <span className="text-xs text-gray-400 font-mono">{client.domain}</span>
              </div>

              {/* Hover gradient border effect */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-orange-500/0 group-hover:ring-orange-500/20 transition-all pointer-events-none" />
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
            <div key={stat.label} className="text-center p-5 bg-orange-50 rounded-2xl border border-orange-100">
              <div className="text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
