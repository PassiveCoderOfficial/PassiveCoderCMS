import {
  Globe, ShoppingBag, Image, BarChart3, Shield, Zap,
  Smartphone, Mail, Archive, Palette, FormInput, HeadphonesIcon, Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: Palette,
    title: "Visual Page Builder",
    desc: "Drag-and-drop editor. See your changes live as you make them. No code, no confusion — just click and publish.",
    highlight: true,
  },
  {
    icon: Globe,
    title: "Custom Domain Included",
    desc: "Get a free .com, .net, or .org domain with your plan, or connect one you already own. DNS setup handled for you.",
    highlight: false,
  },
  {
    icon: ShoppingBag,
    title: "Built-in Ecommerce",
    desc: "Sell products and services online. Accept payments, manage orders, track inventory — all inside your plan. No add-ons.",
    highlight: false,
  },
  {
    icon: FormInput,
    title: "Lead Capture Forms",
    desc: "Custom contact and booking forms that send leads straight to your inbox or WhatsApp. Never miss an enquiry.",
    highlight: false,
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    desc: "Every template is built for mobile first. Your site looks flawless on any device, screen size, or browser.",
    highlight: false,
  },
  {
    icon: Zap,
    title: "Blazing Fast Performance",
    desc: "Global CDN, auto-optimized images, and A+ PageSpeed scores out of the box. Fast sites rank higher and convert better.",
    highlight: true,
  },
  {
    icon: Archive,
    title: "Daily Backups (7 days)",
    desc: "Automatic daily backups with one-click restore. Your content is always safe — even if you accidentally delete something.",
    highlight: false,
  },
  {
    icon: Shield,
    title: "Free SSL + Security",
    desc: "SSL certificate included. Brute-force protection, HTTPS redirect, and security headers — all enabled automatically.",
    highlight: false,
  },
  {
    icon: Mail,
    title: "Full DNS Management",
    desc: "Manage MX, SPF, DKIM, and all DNS records. Works with any email provider — Google Workspace, Zoho, Outlook.",
    highlight: false,
  },
  {
    icon: BarChart3,
    title: "Analytics Ready",
    desc: "Plug in Google Analytics, Plausible, Hotjar, or any tracking code in one click. Know exactly who visits your site.",
    highlight: false,
  },
  {
    icon: Image,
    title: "Media Manager",
    desc: "Upload, organize, and reuse your photos and files from one place. No external storage or third-party service needed.",
    highlight: false,
  },
  {
    icon: HeadphonesIcon,
    title: "Real Human Support",
    desc: "Talk to developers who actually know your site. Not a chatbot, not a ticket queue — real people who respond fast.",
    highlight: true,
  },
];

const COMPARISON = [
  { feature: "Annual price", us: "$256/year", agency: "$3,000+/year", diy: "$0 (+ your time)" },
  { feature: "Setup time", us: "Hours", agency: "4–8 weeks", diy: "Weeks of learning" },
  { feature: "Ongoing updates", us: "You control it", agency: "$150–500/update", diy: "You build it" },
  { feature: "Mobile-ready", us: "Always", agency: "Sometimes", diy: "You have to build it" },
  { feature: "SSL included", us: "Free", agency: "Extra cost", diy: "Depends on host" },
  { feature: "Support", us: "Real humans", agency: "Project manager", diy: "Stack Overflow" },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-[#05060a] border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 bg-white/[0.06] text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full mb-4 border border-white/[0.08]">
            <Sparkles className="w-3.5 h-3.5" /> Everything included — no plugins, no add-ons, no surprises
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            One platform. Every tool your business needs.
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Most website builders charge extra for ecommerce, forms, or analytics. With Passive Coder, it&apos;s all included from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {FEATURES.map(({ icon: Icon, title, desc, highlight }) => (
            <div
              key={title}
              className={`group p-6 rounded-2xl border transition-all ${
                highlight
                  ? "border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.08] to-violet-500/[0.05] hover:border-indigo-400/30"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03]"
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                highlight ? "bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-950/50" : "bg-white/[0.05] group-hover:bg-white/[0.08]"
              }`}>
                <Icon className={`w-5 h-5 ${highlight ? "text-white" : "text-indigo-300"}`} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-20">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white">How does Passive Coder compare?</h3>
            <p className="text-slate-500 mt-2">Agency quality at a fraction of the cost.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="text-left px-5 py-3.5 text-slate-400 font-semibold">Feature</th>
                  <th className="px-5 py-3.5 text-center font-bold text-indigo-300 bg-indigo-500/[0.06]">Passive Coder</th>
                  <th className="px-5 py-3.5 text-center text-slate-500 font-semibold">Web Agency</th>
                  <th className="px-5 py-3.5 text-center text-slate-500 font-semibold">DIY (WordPress)</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-white/[0.05] ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"}`}>
                    <td className="px-5 py-3.5 font-medium text-slate-300">{row.feature}</td>
                    <td className="px-5 py-3.5 text-center font-semibold text-indigo-300 bg-indigo-500/[0.04]">{row.us}</td>
                    <td className="px-5 py-3.5 text-center text-slate-500">{row.agency}</td>
                    <td className="px-5 py-3.5 text-center text-slate-500">{row.diy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
