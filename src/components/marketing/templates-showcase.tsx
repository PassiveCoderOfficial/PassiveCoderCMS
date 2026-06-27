"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Zap, ChevronRight, Sparkles, Star, CheckCircle2 } from "lucide-react";
import { TEMPLATES, TEMPLATE_CATEGORIES, type Template } from "@/lib/templates/templates-data";

const TEMPLATE_SERVICES: Record<string, string[]> = {
  "build-right":     ["Renovation", "New Build", "Fit-Out"],
  "colour-craft":    ["Interior Paint", "Exterior", "Colour Consult"],
  "glass-line":      ["Glass Partitions", "Shopfronts", "Aluminium"],
  "curtain-studio":  ["Curtains", "Blinds", "Home Measuring"],
  "pest-shield":     ["Pest Control", "Termite Treatment", "Eco-Safe"],
  "fresh-wash":      ["Dry Cleaning", "Laundry", "Home Pickup"],
  "uniform-pro":     ["Uniforms", "Workwear", "Bulk Orders"],
  "cool-breeze":     ["AC Installation", "Servicing", "24/7 Repair"],
  "sparky-pro":      ["Electrical", "Plumbing", "Emergency Call"],
  "trade-supply":    ["Wholesale", "Bulk Supply", "Import/Export"],
  "shield-guard":    ["Guard Services", "CCTV", "Patrol"],
  "shine-auto":      ["Car Wash", "Detailing", "Ceramic Coat"],
  "feast-events":    ["Catering", "Corporate Events", "Weddings"],
  "medplus-clinic":  ["GP Consult", "Specialist", "Walk-In"],
  "drive-academy":   ["Driving Lessons", "Theory Test", "License"],
  // Batch 2
  "handyfix-pro":          ["General Repairs", "Furniture Assembly", "Odd Jobs"],
  "buildguard":            ["Preventive Maintenance", "Facility Management", "Emergency Repairs"],
  "apex-construct":        ["New Builds", "Renovations", "Project Management"],
  "sparkle-home":          ["Regular Cleans", "Deep Clean", "End-of-Lease"],
  "cleancore-commercial":  ["Office Cleaning", "Industrial Clean", "Strip & Seal"],
  "fibrefresh":            ["Carpet Steam Clean", "Upholstery Clean", "Rug Restoration"],
  "flowmaster-plumbing":   ["Emergency Plumbing", "Drain Clearing", "Pipe Repairs"],
  "heatwave-hvac":         ["Boiler Installation", "Gas Servicing", "Central Heating"],
  "totalbuilds-services":  ["Plumbing", "Electrical", "HVAC"],
  "torque-auto":           ["Log Book Service", "Brake & Tyres", "Engine Diagnostics"],
  "gripzone-tyres":        ["Tyre Fitting", "Wheel Alignment", "Puncture Repair"],
  "panelcraft":            ["Smash Repairs", "Paint Correction", "Insurance Claims"],
  "threadline":            ["Women's Fashion", "Men's Wear", "New Arrivals"],
  "stride-active":         ["Gym Wear", "Running Gear", "Sports Equipment"],
  "worksafe-gear":         ["Hi-Vis Clothing", "Safety Boots", "PPE Supplies"],
  "wanderway":             ["Holiday Packages", "Flight Booking", "Hotel & Tours"],
  "trailblaze-tours":      ["Guided Tours", "Adventure Trips", "Group Travel"],
  "visabridge":            ["Skilled Visas", "Student Visas", "Family Migration"],
  "tablefare":             ["Dine-In", "Private Bookings", "Takeaway"],
  "beancraft-cafe":        ["Specialty Coffee", "All-Day Brunch", "Catering"],
  "streetbite":            ["Online Ordering", "Food Truck", "Catering Events"],
  "lumiere-salon":         ["Hair Styling", "Nail Art", "Beauty Treatments"],
  "fade-barbershop":       ["Haircuts", "Beard Grooming", "Hot Towel Shave"],
  "smilestudio-dental":    ["General Dentistry", "Teeth Whitening", "Orthodontics"],
  "ironforge-gym":         ["Gym Membership", "Group Classes", "Personal Training"],
  "peak-pt":               ["1-on-1 Training", "Online Coaching", "Nutrition Plans"],
  "swiftdrop-courier":     ["Same-Day Delivery", "Express Parcels", "Business Accounts"],
  "vaultstore":            ["Self Storage", "Home Removals", "Packing Services"],
  "pressmark-print":       ["Business Cards", "Banners & Signage", "Custom Branding"],
  "brightminds-tutor":     ["Maths Tutoring", "English & Writing", "Exam Prep"],
  "skillforge-training":   ["Trade Certificates", "Safety Courses", "Online Learning"],
  "lexbridge-law":         ["Family Law", "Commercial Law", "Property Conveyancing"],
  "cleartax-accounting":   ["Tax Returns", "Bookkeeping", "Business Advisory"],
  "lenscroft-studio":      ["Portrait Sessions", "Wedding Photography", "Commercial Shoots"],
  "forever-events":        ["Full Planning", "Day Coordination", "Vendor Management"],
  "prime-property":        ["Buyer's Agent", "Property Sales", "Market Appraisal"],
  "propertyvault-mgmt":    ["Tenant Sourcing", "Rent Collection", "Maintenance Coordination"],
  "netsupport-it":         ["Helpdesk Support", "Network Setup", "Cyber Security"],
  "growthlab-agency":      ["SEO & Content", "Paid Ads", "Social Media"],
};

function TemplateThumbnail({ template }: { template: Template }) {
  const services = TEMPLATE_SERVICES[template.slug] ?? ["Service 1", "Service 2", "Service 3"];

  return (
    <div className="w-full aspect-[4/3] rounded-t-xl overflow-hidden relative bg-gray-900">
      {/* Real photo background */}
      <Image
        src={template.slug in TEMPLATE_SERVICES ? `/images/templates/${template.slug}.jpg` : template.heroImage}
        alt={template.name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover object-top"
        loading="lazy"
      />

      {/* Subtle vignette only — screenshot shows through */}
      <div
        className="absolute inset-0"
        style={{
          background: template.slug in TEMPLATE_SERVICES
            ? `linear-gradient(160deg, ${template.thumbFrom}22 0%, ${template.thumbTo}44 100%)`
            : `linear-gradient(160deg, ${template.thumbFrom}99 0%, ${template.thumbTo}bb 100%)`,
        }}
      />

      {/* Browser chrome bar */}
      <div className="absolute inset-x-2.5 top-2.5 bg-black/30 backdrop-blur-md rounded-lg overflow-hidden border border-white/10">
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <div className="flex gap-1 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400/90" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/90" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-400/90" />
          </div>
          <div className="flex-1 bg-white/10 rounded px-2 py-0.5 text-[8px] text-white/70 text-center truncate font-mono">
            {template.slug}.passivecoder.com
          </div>
        </div>
      </div>

      {/* Hero content mock */}
      <div className="absolute inset-x-2.5 top-11 bottom-2.5 flex flex-col justify-between p-2.5">
        {/* Top section */}
        <div>
          <div
            className="inline-block text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full mb-1.5 text-white"
            style={{ background: `${template.accentColorHex}80`, border: `1px solid ${template.accentColorHex}60` }}
          >
            {template.category}
          </div>
          <div className="text-white font-black text-[11px] leading-[1.2] mb-1 drop-shadow-sm line-clamp-2">
            {template.heroHeadline}
          </div>
          <div className="text-white/75 text-[8px] leading-relaxed mb-2 line-clamp-1 drop-shadow-sm">
            {template.heroSubline}
          </div>
          <div className="flex gap-1.5">
            <div
              className="text-[8px] font-bold px-2 py-0.5 rounded text-white shadow-sm"
              style={{ background: template.accentColorHex }}
            >
              Get Started
            </div>
            <div className="text-[8px] font-semibold px-2 py-0.5 rounded border border-white/30 text-white/90 backdrop-blur-sm bg-white/10">
              Learn More
            </div>
          </div>
        </div>

        {/* Bottom: service pills */}
        <div className="flex gap-1 flex-wrap">
          {services.map((svc, i) => (
            <div
              key={i}
              className="flex items-center gap-0.5 bg-white/15 backdrop-blur-sm rounded-md px-1.5 py-0.5 border border-white/20"
            >
              <CheckCircle2 className="w-2 h-2 text-white/80 flex-shrink-0" />
              <span className="text-[7px] text-white/90 font-semibold whitespace-nowrap">{svc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle vignette at bottom for depth */}
      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/30 to-transparent pointer-events-none rounded-b-xl" />
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-200 hover:border-orange-300 hover:shadow-2xl hover:shadow-orange-100/60 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative flex-shrink-0">
        <TemplateThumbnail template={template} />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1 z-10">
          {template.featured && (
            <span className="flex items-center gap-0.5 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
              <Star className="w-2 h-2 fill-current" /> Featured
            </span>
          )}
          {template.badge && (
            <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
              {template.badge}
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-2xl flex items-center justify-center gap-2">
          <Link
            href={`/templates/${template.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors shadow-xl"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </Link>
          <Link
            href={`/onboarding?template=${template.slug}`}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl hover:from-orange-600 hover:to-rose-600 transition-colors shadow-xl"
          >
            <Zap className="w-3.5 h-3.5" /> Use Template
          </Link>
        </div>
      </div>

      {/* Card info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm truncate">{template.name}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{template.category}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${template.accentColorHex}18`, color: template.accentColorHex }}
            >
              {template.pages}p
            </span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed flex-1">{template.description}</p>

        <div className="flex flex-wrap gap-1 mt-3">
          {template.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">{tag}</span>
          ))}
          {template.hasDemo && (
            <span className="text-[10px] bg-green-50 text-green-600 font-medium px-1.5 py-0.5 rounded-md">Demo</span>
          )}
        </div>

        {/* Action row */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/templates/${template.slug}`}
            target="_blank"
            className="flex-none flex items-center justify-center gap-1 border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 text-xs font-medium px-3 py-2 rounded-xl transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/onboarding?template=${template.slug}`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-bold py-2 rounded-xl hover:from-orange-600 hover:to-rose-600 transition-all shadow-sm hover:shadow-orange-200"
          >
            <Zap className="w-3.5 h-3.5" /> Use Template
          </Link>
        </div>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 12;

export default function TemplatesShowcase() {
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchCat = category === "All" || t.category === category;
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [category, search]);

  const displayed = showAll ? filtered : filtered.slice(0, ITEMS_PER_PAGE);
  const hasMore = filtered.length > ITEMS_PER_PAGE && !showAll;

  return (
    <section id="templates" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3 h-3" /> {TEMPLATES.length} Industry Templates
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Pick a template. Launch in minutes.
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Every template ships with real demo content, full mobile optimization, and a contact form — ready to go live the same day.
          </p>
        </div>

        {/* Search + filter row */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowAll(false); }}
            placeholder="Search by industry, style or feature…"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 bg-white shadow-sm"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TEMPLATE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setShowAll(false); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                category === cat
                  ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-200"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600 hover:shadow-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs text-gray-400 text-center mb-6">
          {filtered.length} template{filtered.length !== 1 ? "s" : ""}
          {category !== "All" && ` in ${category}`}
          {search && ` matching "${search}"`}
        </p>

        {/* Grid */}
        {displayed.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">No templates found for &quot;{search}&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayed.map(t => <TemplateCard key={t.id} template={t} />)}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="text-center mt-12">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-600 font-semibold px-8 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              Show all {filtered.length} templates
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom note */}
        <div className="text-center mt-12 text-sm text-gray-400">
          Don&apos;t see your industry?{" "}
          <Link href="/contact" className="text-orange-500 hover:text-orange-600 font-semibold">
            Request a custom template →
          </Link>
        </div>
      </div>
    </section>
  );
}
