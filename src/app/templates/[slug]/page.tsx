import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Eye, Zap, Star, Check, Layout, Sparkles,
  Phone, Mail, MapPin, ChevronRight, Quote,
} from "lucide-react";
import { TEMPLATES } from "@/lib/templates/templates-data";
import { getTemplateContent } from "@/lib/templates/template-content";

export async function generateStaticParams() {
  return TEMPLATES.map(t => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = TEMPLATES.find(x => x.slug === slug);
  if (!t) return {};
  return {
    title: `${t.name} — Website Template | Passive Coder`,
    description: t.description,
  };
}

export default async function TemplatePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = TEMPLATES.find(t => t.slug === slug);
  if (!template) notFound();

  const content = getTemplateContent(slug);
  const related = TEMPLATES
    .filter(t => t.category === template.category && t.id !== template.id)
    .slice(0, 3);

  const fromColor = template.thumbFrom;
  const toColor = template.thumbTo;
  const accentHex = template.accentColorHex;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky top bar ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/#templates" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-900 text-sm">{template.name}</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{template.category}</span>
            {template.featured && (
              <span className="hidden sm:flex items-center gap-0.5 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                <Star className="w-3 h-3 fill-current" /> Featured
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/onboarding?template=${template.slug}&mode=theme`}
              className="hidden sm:flex items-center gap-1.5 border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Layout className="w-3.5 h-3.5" /> Theme Only
            </Link>
            <Link
              href={`/onboarding?template=${template.slug}&mode=full`}
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:from-orange-600 hover:to-rose-600 transition-all shadow-md shadow-orange-200"
            >
              <Zap className="w-3.5 h-3.5" /> Build With This
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Live mock website preview ────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

              {/* Browser chrome */}
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 text-center border border-gray-200 truncate">
                  yourbusiness.com — {template.name} by Passive Coder
                </div>
                <div className="hidden sm:flex items-center gap-1 text-xs text-green-600 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Preview
                </div>
              </div>

              {/* ── MOCK WEBSITE BODY ──────────────────────────────────────────── */}
              <div className="overflow-hidden">

                {/* NAV */}
                <nav
                  className="px-8 py-4 flex items-center justify-between"
                  style={{ background: fromColor, borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base text-white"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      {template.name.charAt(0)}
                    </div>
                    <span className="font-bold text-white text-sm">{template.name}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-5">
                    {content.navLinks.slice(0, 4).map(l => (
                      <span key={l.label} className="text-xs text-white/80 font-medium cursor-pointer">{l.label}</span>
                    ))}
                  </div>
                  <div className="text-xs font-bold px-4 py-2 rounded-lg text-white border-2 border-white/40 cursor-pointer">
                    {content.cta}
                  </div>
                </nav>

                {/* HERO */}
                <div
                  className="relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${fromColor} 0%, ${toColor} 100%)` }}
                >
                  <div className="px-8 sm:px-16 pt-14 pb-10">
                    <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-3">{template.category}</div>
                    <h2 className="text-white font-extrabold text-2xl sm:text-3xl leading-tight mb-4 max-w-xl">
                      {content.tagline}
                    </h2>
                    <p className="text-white/75 text-sm leading-relaxed mb-8 max-w-md">
                      {template.heroSubline}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {content.badges.map(b => (
                        <span key={b} className="flex items-center gap-1 bg-white/15 backdrop-blur-sm text-white text-[10px] font-semibold px-3 py-1.5 rounded-full border border-white/20">
                          <Check className="w-2.5 h-2.5" /> {b}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <div className="text-xs font-bold px-6 py-3 rounded-xl shadow-lg text-gray-800 bg-white cursor-pointer">
                        {content.cta}
                      </div>
                      <div className="border-2 border-white/40 text-white text-xs font-bold px-6 py-3 rounded-xl cursor-pointer">
                        {content.ctaSecondary}
                      </div>
                    </div>
                  </div>
                  <div
                    className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 80% 50%, white, transparent 70%)" }}
                  />
                </div>

                {/* STATS BAR */}
                <div className="bg-white border-b border-gray-100">
                  <div className="grid grid-cols-4 divide-x divide-gray-100">
                    {content.stats.map(s => (
                      <div key={s.label} className="px-4 py-4 text-center">
                        <div className="font-extrabold text-base" style={{ color: accentHex }}>{s.value}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 font-medium">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SERVICES */}
                <div className="bg-gray-50 px-8 py-10">
                  <div className="text-center mb-6">
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: accentHex }}>What We Offer</div>
                    <h3 className="text-xl font-extrabold text-gray-900">Our Services</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {content.services.slice(0, 6).map(s => (
                      <div key={s.name} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer">
                        <div className="text-2xl mb-2">{s.icon}</div>
                        <div className="font-bold text-xs text-gray-900 mb-1">{s.name}</div>
                        <div className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{s.desc}</div>
                        {s.price && (
                          <div className="mt-2 text-[10px] font-bold" style={{ color: accentHex }}>{s.price}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ABOUT */}
                <div className="bg-white px-8 py-10 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: accentHex }}>About Us</div>
                      <h3 className="text-lg font-extrabold text-gray-900 mb-3 leading-tight">{content.about.heading}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-4">{content.about.body}</p>
                      <ul className="space-y-1.5">
                        {content.about.highlights.map(h => (
                          <li key={h} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${accentHex}20` }}
                            >
                              <Check className="w-2.5 h-2.5" style={{ color: accentHex }} />
                            </div>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div
                      className="rounded-2xl h-48 flex flex-col items-center justify-center gap-3 p-6"
                      style={{ background: `linear-gradient(135deg, ${fromColor}40, ${toColor}80)` }}
                    >
                      <div className="text-5xl">{content.services[0]?.icon ?? "⭐"}</div>
                      <div className="text-center">
                        <div className="font-bold text-sm text-gray-800">{content.stats[0].value}</div>
                        <div className="text-xs text-gray-600">{content.stats[0].label}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRICING */}
                {content.pricing && content.pricing.length > 0 && (
                  <div className="bg-gray-50 px-8 py-10 border-t border-gray-100">
                    <div className="text-center mb-6">
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: accentHex }}>Simple Pricing</div>
                      <h3 className="text-xl font-extrabold text-gray-900">Choose Your Plan</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {content.pricing.map(tier => (
                        <div
                          key={tier.name}
                          className={`rounded-xl p-4 border-2 ${tier.highlight ? "shadow-lg" : "bg-white border-gray-200"}`}
                          style={tier.highlight ? { borderColor: accentHex, backgroundColor: `${accentHex}08` } : {}}
                        >
                          {tier.highlight && (
                            <div
                              className="text-[9px] font-bold uppercase tracking-widest mb-2 text-center py-0.5 px-2 rounded-full text-white"
                              style={{ backgroundColor: accentHex }}
                            >
                              Most Popular
                            </div>
                          )}
                          <div className="text-sm font-bold text-gray-900 mb-1">{tier.name}</div>
                          <div className="font-extrabold text-xl mb-0.5" style={{ color: tier.highlight ? accentHex : "#111827" }}>{tier.price}</div>
                          {tier.period && <div className="text-[10px] text-gray-400 mb-3">{tier.period}</div>}
                          <ul className="space-y-1.5 mb-4">
                            {tier.features.map(f => (
                              <li key={f} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                                <Check className="w-2.5 h-2.5 mt-0.5 flex-shrink-0 text-green-500" /> {f}
                              </li>
                            ))}
                          </ul>
                          <div
                            className="text-center text-xs font-bold py-2 rounded-lg cursor-pointer"
                            style={tier.highlight
                              ? { backgroundColor: accentHex, color: "#fff" }
                              : { border: `1.5px solid ${accentHex}`, color: accentHex }}
                          >
                            {tier.cta}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TEAM */}
                {content.team && content.team.length > 0 && (
                  <div className="bg-white px-8 py-10 border-t border-gray-100">
                    <div className="text-center mb-6">
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: accentHex }}>The Team</div>
                      <h3 className="text-xl font-extrabold text-gray-900">Meet Our Experts</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {content.team.map(m => (
                        <div key={m.name} className="text-center">
                          <div
                            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white font-extrabold text-lg mb-3 shadow-md"
                            style={{ backgroundColor: m.color }}
                          >
                            {m.initials}
                          </div>
                          <div className="font-bold text-xs text-gray-900">{m.name}</div>
                          <div className="text-[10px] font-medium mb-1" style={{ color: accentHex }}>{m.role}</div>
                          <div className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{m.bio}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TESTIMONIALS */}
                <div
                  className="px-8 py-10 border-t border-gray-100"
                  style={{ background: `linear-gradient(135deg, ${fromColor}12, ${toColor}18)` }}
                >
                  <div className="text-center mb-6">
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: accentHex }}>Client Stories</div>
                    <h3 className="text-xl font-extrabold text-gray-900">What Our Clients Say</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {content.testimonials.map(t => (
                      <div key={t.name} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <Quote className="w-4 h-4 mb-2 opacity-30" style={{ color: accentHex }} />
                        <p className="text-[11px] text-gray-700 leading-relaxed mb-3 italic line-clamp-4">&ldquo;{t.text}&rdquo;</p>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ backgroundColor: accentHex }}
                          >
                            {t.initials}
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-gray-900">{t.name}</div>
                            <div className="text-[10px] text-gray-500">{t.location}</div>
                          </div>
                          <div className="ml-auto flex gap-0.5">
                            {[...Array(t.rating)].map((_, i) => (
                              <Star key={i} className="w-2.5 h-2.5 fill-current text-amber-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ */}
                {content.faqItems && content.faqItems.length > 0 && (
                  <div className="bg-white px-8 py-10 border-t border-gray-100">
                    <div className="text-center mb-6">
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: accentHex }}>FAQ</div>
                      <h3 className="text-xl font-extrabold text-gray-900">Common Questions</h3>
                    </div>
                    <div className="space-y-3 max-w-2xl mx-auto">
                      {content.faqItems.map((f, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer">
                            <span className="text-xs font-semibold text-gray-900">{f.q}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          </div>
                          <div className="px-4 py-3 text-xs text-gray-600 leading-relaxed">{f.a}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CONTACT FOOTER */}
                <div
                  className="px-8 py-10 border-t border-gray-100"
                  style={{ background: `linear-gradient(135deg, ${fromColor}, ${toColor})` }}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-extrabold text-white mb-2">Ready to get started?</h3>
                    <p className="text-white/70 text-xs">Contact us today for a free consultation</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <div className="flex items-center gap-2 text-white/90 text-xs">
                      <Phone className="w-3.5 h-3.5" /> {content.phone}
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-xs">
                      <Mail className="w-3.5 h-3.5" /> {content.email}
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-xs">
                      <MapPin className="w-3.5 h-3.5" /> {content.address}
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className="inline-block bg-white text-xs font-bold px-8 py-3 rounded-xl cursor-pointer shadow-lg"
                      style={{ color: accentHex }}
                    >
                      {content.cta}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Import mode cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href={`/onboarding?template=${template.slug}&mode=theme`}
                className="group flex items-start gap-4 bg-white border border-gray-200 hover:border-orange-300 rounded-xl p-5 transition-all hover:shadow-md"
              >
                <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                  <Layout className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Theme Only</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Apply this template&apos;s colors, fonts and layout. Your existing content stays exactly as it is.
                  </p>
                  <span className="text-xs text-orange-500 font-medium mt-2 block">Best if you already have content →</span>
                </div>
              </Link>
              <Link
                href={`/onboarding?template=${template.slug}&mode=full`}
                className="group flex items-start gap-4 bg-white border border-gray-200 hover:border-orange-300 rounded-xl p-5 transition-all hover:shadow-md"
              >
                <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Full Demo Import</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Install with all sample content: pages, services, pricing, team bios, gallery and navigation.
                  </p>
                  <span className="text-xs text-orange-500 font-medium mt-2 block">Best for starting fresh →</span>
                </div>
              </Link>
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────────────── */}
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-20">
              <div
                className="h-24 rounded-xl mb-4 flex items-end p-3"
                style={{ background: `linear-gradient(135deg, ${fromColor}, ${toColor})` }}
              >
                <div className="flex flex-wrap gap-1">
                  {content.badges.slice(0, 3).map(b => (
                    <span key={b} className="text-[9px] bg-white/20 text-white font-medium px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <h2 className="font-bold text-gray-900 text-lg mb-1">{template.name}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{template.description}</p>

              <dl className="mt-4 space-y-2.5 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Category</dt>
                  <dd className="font-medium text-gray-700">{template.category}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Pages included</dt>
                  <dd className="font-medium text-gray-700">{template.pages} pages</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Demo content</dt>
                  <dd className="font-medium text-gray-700">{template.hasDemo ? "✅ Included" : "➖ Theme only"}</dd>
                </div>
                {template.featured && (
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Status</dt>
                    <dd className="font-medium text-orange-600 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Featured
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {template.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <Link
                  href={`/onboarding?template=${template.slug}&mode=full`}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold py-3 rounded-xl hover:from-orange-600 hover:to-rose-600 transition-all shadow-md shadow-orange-200"
                >
                  <Zap className="w-4 h-4" /> Build With This Template
                </Link>
                <Link
                  href={`/onboarding?template=${template.slug}&mode=theme`}
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:border-orange-300 hover:text-orange-600 transition-colors text-sm"
                >
                  <Layout className="w-4 h-4" /> Apply Theme Only
                </Link>
              </div>

              <p className="text-center text-[11px] text-gray-400 mt-3">Free to use · Cancel anytime</p>
            </div>

            {/* What&apos;s included */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">What&apos;s included</h3>
              <ul className="space-y-2">
                {[
                  `${template.pages} pre-built pages`,
                  "Mobile-responsive layout",
                  `${content.services.length} service entries`,
                  "Testimonials section",
                  content.pricing ? "Pricing / packages section" : "Contact form",
                  content.team ? "Team / about section" : "Gallery section",
                  "FAQ section",
                  "Contact details & map",
                  "WhatsApp float button",
                  "SEO-ready page structure",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">More in {template.category}</h3>
                <div className="space-y-3">
                  {related.map(t => (
                    <Link key={t.id} href={`/templates/${t.slug}`} className="flex items-center gap-3 group">
                      <div
                        className="w-12 h-10 rounded-lg flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${t.thumbFrom}, ${t.thumbTo})` }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-orange-600 transition-colors truncate">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.pages} pages · {t.hasDemo ? "Demo available" : "Theme only"}</p>
                      </div>
                      <Eye className="w-3.5 h-3.5 text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
