/**
 * Passive Coder root site (passivecoder.com) built from CMS builder blocks.
 *
 * Writes the root tenant's pages (slug ROOT_TENANT_SLUG = "beta", previewed at
 * beta.passivecoder.com) plus its global header/footer. passivecoder.com only
 * serves these once homepage_settings.use_builder_pages is turned on.
 *
 * Native blocks only, no custom_html. Prices come from the live catalog via
 * the "pricing_catalog" block, never typed into a page.
 *
 * Safe to re-run: pages with the same slug are replaced (old versions are
 * archived, never deleted).
 *   node scripts/seed-root-site.cjs
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const TENANT_ID = "ee3322fe-52b3-4c8e-9feb-ad5d7ded93d7";
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
const uid = (p) => `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// ─── brand ──────────────────────────────────────────────────────────────────
const LOGO = "https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1777257556858_Passive_Coder_Web_logo.png";
const BG = "#05060a";
const BG2 = "#0a0c12";
const ORANGE = "#ff7600";
const WA_NUMBER = "8801678669699";
const wa = (t) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const WA = wa("Hi Passive Coder, I want a website for my business.");
const WA_BN = wa("আসসালামু আলাইকুম, আমার ব্যবসার জন্য একটা ওয়েবসাইট চাই।");
const U = (id, w = 1200) => `https://images.unsplash.com/${id}?w=${w}&q=72&auto=format&fit=crop`;

const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const pad = (t, b = t) => ({ top: t, right: 24, bottom: b, left: 24 });
const color = (c) => ({ type: "color", color: c });
const block = (type, data, extra = {}) => ({
  id: uid(type), type, order: 0, visible: true, width: "full",
  padding: pad(96), margin: ZERO, background: color(BG),
  ...extra, data,
});
const typo = (size = "6xl") => ({ titleSize: size, titleColor: "", subtitleColor: "", descColor: "" });

// ─── content ────────────────────────────────────────────────────────────────
const CLIENTS = [
  ["Dream Arabia", "Real estate · UAE", "dreamarabiasa.com"],
  ["Emirates Curtain", "Interior fit-out · UAE", "emiratescurtain.com"],
  ["Everyday Renovations", "Renovation · UAE", "everydayrenovations.com"],
  ["Dubai Deep Cleaning", "Cleaning · UAE", "dubaideepcleaning.ae"],
  ["Advance Construction", "Construction · Singapore", "advanceconstructionsg.com"],
  ["Aircon Interior Service", "HVAC & interior · Singapore", "airconinteriorservicesg.com"],
  ["Hasan Flooring KL", "Flooring · Malaysia", "hasanflooringkl.com"],
  ["Al Madhhar Paints", "Paints & coatings · Saudi Arabia", "almadhharpaints.com"],
  ["Anamika Global", "Business services · Malaysia", "anamikaglobal.com"],
];

const INDUSTRIES = [
  ["Restaurants & cafes", "photo-1555396273-367ea4eb4db5"],
  ["Construction & renovation", "photo-1504307651254-35680f356dfd"],
  ["Cleaning services", "photo-1581578731548-c64695cc6952"],
  ["Electrical, AC & plumbing", "photo-1621905251189-08b45d6a269e"],
  ["Clinics & health", "photo-1576091160399-112ba8d25d1d"],
  ["Salons & spas", "photo-1560066984-138dadb4c035"],
  ["Shops & retail", "photo-1441986300917-64674bd600d8"],
  ["Real estate", "photo-1600585154340-be6161a56a0c"],
];

const TESTIMONIALS = [
  ["Md Masud Hossain Emon", "MEP Contracting, Qatar", "Our site looks exactly like a company our size should: professional, easy to find, and ours to update whenever we want. No back-and-forth with an agency every time something changes."],
  ["Jabadul Islam", "Jabedul Shamsul Technical Services, UAE", "They understood exactly what a technical services business in the UAE needs online. Straightforward process, and the site was live faster than I expected."],
  ["Maudud Ahammad", "Jabal Al Akram Technical Service, UAE", "Clean, professional site that represents the company well. Support has been responsive whenever I needed something changed."],
  ["MR Anuwar", "Anamika Global SDN BHD, Malaysia", "Good communication throughout, and the end result was exactly what we asked for. Happy to recommend Passive Coder to other business owners."],
  ["Arif Shikder", "SKR Arif Global Enterprise, Malaysia", "Professional work, delivered without the runaround I had with other developers before. The site does exactly what a business site should do."],
  ["Jubaidul Kabeir", "Advanced Handyman PTE LTD, Singapore", "Solid site for our handyman business: looks credible, works well on mobile, and the team was easy to work with from start to finish."],
];

const FAQ_EN = [
  ["How much does a website cost?", "You pay once to build it: Basic, Pro or Business. Hosting, SSL, daily backups and your domain are included for the first 12 months. From year 2 there is a small yearly platform fee, or nothing extra if you are on a Care plan."],
  ["Is there a monthly fee?", "No. The platform renews once a year. Care plans are the only thing you can pay monthly, and they are optional."],
  ["What is a Care plan?", "Our team looks after your site every month: content and design changes, new pages, reports, SEO checks and priority support. Hosting and domain renewal are included, so you never pay the platform fee while Care is active."],
  ["What happens if I stop Care?", "Your website stays online. It moves to the yearly platform renewal for your package, with your pages and data kept exactly as they are."],
  ["Do I pay before I see anything?", "No. Send us your business name, logo, a few photos and your services. We build your homepage first, you see it, and then you confirm and pay."],
  ["How do I pay?", "Card (USD), shurjoPay, bKash, Nagad or bank transfer. Bangladeshi clients can pay in taka."],
  ["Can I use my own domain?", "Yes. Connect a domain you already own, or we register one for you. Domain renewal is included in the platform fee and every Care plan."],
  ["Will my site show up on Google?", "Every page is built search-ready: fast, mobile-first, with titles, descriptions and structured data. Care Pro and above include Search Console and SEO checks."],
];

const FAQ_BN = [
  ["ওয়েবসাইট বানাতে কত খরচ?", "একবারই পেমেন্ট: Basic, Pro অথবা Business। প্রথম ১২ মাসের হোস্টিং, SSL, ব্যাকআপ আর ডোমেইন এর মধ্যেই। দ্বিতীয় বছর থেকে ছোট একটা ইয়ারলি প্ল্যাটফর্ম ফি, অথবা Care নিলে আলাদা কিছু লাগবে না।"],
  ["প্রতি মাসে কি টাকা দিতে হবে?", "না। প্ল্যাটফর্ম বছরে একবার রিনিউ হয়। শুধু Care প্যাকেজ মাসে মাসে নেওয়া যায়, সেটাও ঐচ্ছিক।"],
  ["আগে টাকা দিতে হবে?", "না। আপনার ব্যবসার নাম, লোগো, কয়েকটা ছবি আর সার্ভিসের তালিকা পাঠান। আমরা আগে হোমপেজ বানিয়ে দেখাব, পছন্দ হলে কনফার্ম করে পেমেন্ট করবেন।"],
  ["কীভাবে পেমেন্ট করব?", "bKash, Nagad, ব্যাংক ট্রান্সফার, shurjoPay অথবা কার্ড।"],
  ["আমাকে কি বাংলাদেশে থাকতে হবে?", "না। আপনি UAE, সৌদি, কাতার, মালয়েশিয়া, সিঙ্গাপুর যেখানেই থাকুন, সব কাজ WhatsApp-এ হয়।"],
  ["Care বন্ধ করলে সাইটের কী হবে?", "সাইট চালু থাকবে। আপনার প্যাকেজের ইয়ারলি প্ল্যাটফর্ম রিনিউতে চলে যাবে, সব পেজ আর ডেটা যেমন আছে তেমনই থাকবে।"],
];

// ─── chrome ─────────────────────────────────────────────────────────────────
const NAV = [
  ["Home", "/"], ["Pricing", "/pricing"], ["Care Plans", "/website-maintenance"],
  ["Bangladesh", "/website-for-bangladeshi-businesses"], ["Contact", "/contact"],
];

function header() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: color(BG),
    data: {
      logo: LOGO, logoText: "Passive Coder", logoHeight: 34,
      items: NAV.map(([label, url], i) => ({ id: `n${i}`, label, url, children: [] })),
      sticky: true, transparent: false, style: "default",
      backgroundColor: "rgba(5,6,10,0.88)", textColor: "#e2e8f0", activeColor: ORANGE,
      colorMode: "legacy", ctaVariant: "solid",
      showCta: true, ctaLabel: "Get my website", ctaUrl: "/pricing", showCart: false,
    },
  };
}

function footer() {
  return {
    id: uid("footer"), type: "footer", order: 1, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: color("#030407"),
    data: {
      logo: LOGO, logoText: "Passive Coder",
      tagline: "Websites for local service businesses, built and looked after by a real team. Live in 17+ businesses across 8 countries.",
      style: "dark", backgroundColor: "#030407", accentColor: ORANGE, textColor: "#94a3b8",
      copyrightText: "© {year} Passive Coder. All rights reserved.", copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: WA }],
      columns: [
        { id: uid("fc"), heading: "Product", links: [
          { id: uid("fl"), label: "Website packages", url: "/pricing" },
          { id: uid("fl"), label: "Care plans", url: "/website-maintenance" },
          { id: uid("fl"), label: "Templates", url: "/templates" },
          { id: uid("fl"), label: "Sign in", url: "/login" },
        ]},
        { id: uid("fc"), heading: "Company", links: [
          { id: uid("fl"), label: "Contact", url: "/contact" },
          { id: uid("fl"), label: "Bangladesh", url: "/website-for-bangladeshi-businesses" },
          { id: uid("fl"), label: "WhatsApp us", url: WA },
        ]},
        { id: uid("fc"), heading: "Legal", links: [
          { id: uid("fl"), label: "Privacy policy", url: "/privacy" },
          { id: uid("fl"), label: "Terms of service", url: "/terms" },
          { id: uid("fl"), label: "Refund policy", url: "/refund" },
        ]},
      ],
      bottomLinks: [],
    },
  };
}

// ─── reusable sections ──────────────────────────────────────────────────────
const pricing = (mode, extra = {}) => block("pricing_catalog", {
  mode, language: "en", defaultCurrency: "USD", showCurrencyToggle: true, showBdPrompt: true,
  bdPromptUrl: "/website-for-bangladeshi-businesses#pricing", careLinkUrl: "/website-maintenance",
  tone: "dark", ctaBaseUrl: "/onboarding", ...extra,
}, { padding: pad(104) });

const faq = (items, title, subtitle, variant = "split-heading", bg = BG) => block("faq", {
  title, subtitle, layout: "accordion", allowMultiple: false,
  items: items.map(([question, answer]) => ({ id: uid("f"), question, answer })),
}, { templateVariant: variant, background: color(bg) });

const finalCta = (title, description, primary, secondary) => block("cta", {
  title, description, layout: "split",
  primaryButton: primary, secondaryButton: secondary,
}, { templateVariant: "dark-split", padding: pad(40, 104) });

const pageHero = (badge, title, accent, subtitle, buttons = {}) => block("hero", {
  layout: "centered", badge, title, titleAccent: accent, subtitle, compact: true,
  typography: typo("6xl"), ...buttons,
}, { templateVariant: "page-banner", padding: pad(120, 72), background: color(BG) });

// ─── pages ──────────────────────────────────────────────────────────────────
function home() {
  return [
    block("hero", {
      layout: "left",
      badge: "Websites for local service businesses",
      title: "More customers from Google and WhatsApp.",
      titleAccent: "Your website, done for you.",
      subtitle: "We build and run a professional website for your business, with WhatsApp enquiries, online booking and a shop built in. You serve customers. We handle the tech.",
      primaryButton: { label: "See packages", url: "/pricing", variant: "primary" },
      secondaryButton: { label: "Talk to us on WhatsApp", url: WA, variant: "outline" },
      imageUrl: U("photo-1556740738-b6a63e27c4df", 1400),
      imageAlt: "Small business owner serving a customer",
      typography: typo("7xl"),
    }, { templateVariant: "dark-gradient-left", padding: pad(140, 120) }),

    block("stats", {
      layout: "row", columns: 4, style: "plain", animate: true,
      items: [
        { id: uid("s"), value: "17", suffix: "+", label: "Live client websites" },
        { id: uid("s"), value: "8", label: "Countries" },
        { id: uid("s"), value: "24", suffix: "h", label: "Average time to go live" },
        { id: uid("s"), value: "99.9", suffix: "%", label: "Uptime" },
      ],
    }, { templateVariant: "gradient-numbers", padding: pad(56), background: color(BG2) }),

    block("services", {
      eyebrow: "Real client websites",
      title: "Live right now. Click any of them.",
      subtitle: "Every site below was built and is run on Passive Coder.",
      layout: "cards", columns: 3, cardStyle: "elevated", source: "inline",
      items: CLIENTS.map(([name, kicker, domain]) => ({
        id: uid("c"), title: name, kicker, description: domain,
        imageUrl: `/images/clients/${domain}.jpg`, link: `https://${domain}`, linkLabel: "Visit site",
      })),
    }, { templateVariant: "image-cards-dark" }),

    block("services", {
      eyebrow: "Industries",
      title: "Built for businesses like yours",
      subtitle: "Start from a design made for your trade: the right pages, the right photos, and buttons that bring in enquiries.",
      layout: "grid", columns: 4, cardStyle: "flat", source: "inline",
      items: INDUSTRIES.map(([label, photo]) => ({
        id: uid("i"), title: label, description: "", imageUrl: U(photo, 700), link: "/pricing", linkLabel: "Get started",
      })),
    }, { templateVariant: "image-tiles", background: color(BG2) }),

    block("steps", {
      title: "From first message to live website",
      subtitle: "No forms, no tech. Most sites are live within a day.",
      layout: "horizontal", style: "connected",
      items: [
        { id: uid("st"), icon: "MessageCircle", title: "Send us your details", description: "Business name, logo, a few photos and your services, on WhatsApp." },
        { id: uid("st"), icon: "LayoutTemplate", title: "See your homepage", description: "We build your homepage first. You see it before you pay anything." },
        { id: uid("st"), icon: "BadgeCheck", title: "Confirm and pay once", description: "Card, bKash, Nagad or bank. One payment for the build." },
        { id: uid("st"), icon: "Rocket", title: "Go live", description: "Your domain, hosting and SSL set up. Customers can find you." },
      ],
    }, { templateVariant: "timeline-connected" }),

    block("features", {
      eyebrow: "Everything included",
      title: "One platform. Every tool your business needs.",
      subtitle: "No plugins, no add-ons, no surprise bills.",
      layout: "grid", columns: 3, style: "card",
      items: [
        { id: uid("ft"), icon: "MessageCircle", title: "WhatsApp enquiries", description: "Every button can open a WhatsApp chat with you, with the service already filled in." },
        { id: uid("ft"), icon: "CalendarCheck", title: "Online booking", description: "Customers book a time on your site. You confirm from the dashboard or your phone." },
        { id: uid("ft"), icon: "ShoppingBag", title: "Online shop", description: "Sell products with cash on delivery or online payment, on the Business package." },
        { id: uid("ft"), icon: "Users", title: "CRM for leads", description: "Every form and booking lands in one list, so no enquiry gets lost." },
        { id: uid("ft"), icon: "Search", title: "Built for Google", description: "Fast, mobile-first pages with titles, descriptions and structured data." },
        { id: uid("ft"), icon: "ShieldCheck", title: "Hosting, SSL, backups", description: "Secure hosting, a free SSL certificate and daily backups. Nothing to set up." },
      ],
    }, { templateVariant: "bento-grid", background: color(BG2) }),

    pricing("both", {
      eyebrow: "Pricing",
      title: "Pay once for your website",
      subtitle: "One-time build price. Hosting, SSL, backups and your domain are included for the first year. No monthly bill unless you want our team looking after your site.",
    }),

    block("features", {
      eyebrow: "Our promise",
      title: "Try it with nothing to lose",
      subtitle: "We only do well when your website brings you customers, so the risk sits with us.",
      layout: "grid", columns: 3, style: "card",
      items: [
        { id: uid("g"), icon: "Eye", title: "See it before you pay", description: "We build your homepage first. If you do not like it, you owe nothing." },
        { id: uid("g"), icon: "RotateCcw", title: "14-day money back", description: "Not happy in the first 14 days after paying? Ask for a full refund." },
        { id: uid("g"), icon: "LifeBuoy", title: "Real people on support", description: "A team that knows your site answers on WhatsApp, not a chatbot." },
      ],
    }, { templateVariant: "highlight-cards" }),

    block("testimonials", {
      title: "Real businesses, real results",
      subtitle: "Business owners across the Gulf and Southeast Asia run their websites on Passive Coder.",
      layout: "grid", source: "inline",
      items: TESTIMONIALS.map(([name, company, content]) => ({ id: uid("t"), name, company, content, rating: 5 })),
    }, { templateVariant: "dark-quote-cards", background: color(BG2) }),

    faq(FAQ_EN, "Questions, answered", "Still unsure? Message us on WhatsApp and a real person will reply."),

    finalCta("Ready to get more customers online?",
      "Send us your business name and services. We build your homepage first, and you only pay when you like it.",
      { label: "Get my website", url: "/pricing" }, { label: "WhatsApp us", url: WA }),
  ];
}

function pricingPage() {
  return [
    pageHero("Pricing", "Pay once for your website.", "Keep it looked after.",
      "A one-time build price with the first year of hosting, SSL, backups and domain included. Add a Care plan when you want our team to keep improving it."),
    pricing("packages", { eyebrow: "", title: "", subtitle: "" }),
    pricing("care", {
      eyebrow: "Care plans", title: "Want us to look after it?",
      subtitle: "Monthly changes, new pages, reports and priority support. Hosting and domain renewal included.",
      showBdPrompt: false,
    }, ),
    faq(FAQ_EN, "Pricing questions", "Everything about payments, renewals and Care.", "two-column-grid", BG2),
    finalCta("Not sure which package fits?", "Tell us about your business on WhatsApp and we will recommend one. No pressure.",
      { label: "WhatsApp us", url: WA }, { label: "Contact", url: "/contact" }),
  ];
}

function carePage() {
  return [
    pageHero("Website Care Plans", "Website maintenance,", "done for you.",
      "Our team keeps your website updated, fast and secure every month. Hosting, SSL, backups and domain renewal are included in every plan.",
      { primaryButton: { label: "See Care plans", url: "#care", variant: "primary" }, secondaryButton: { label: "Ask on WhatsApp", url: WA, variant: "outline" } }),
    pricing("care", { eyebrow: "", title: "", subtitle: "", showBdPrompt: false }),
    block("features", {
      eyebrow: "What you get",
      title: "Your website keeps getting better",
      layout: "grid", columns: 3, style: "card",
      items: [
        { id: uid("cf"), icon: "PenLine", title: "Content and design changes", description: "Text, photos, prices, sections. Send it on WhatsApp and it is done." },
        { id: uid("cf"), icon: "FilePlus2", title: "New pages every month", description: "A new service, an offer or a landing page for your ads, from Care Pro." },
        { id: uid("cf"), icon: "BarChart3", title: "Monthly report", description: "Visitors, enquiries and your top pages, in plain words." },
        { id: uid("cf"), icon: "Search", title: "SEO checks", description: "Search Console, schema and page checks so Google understands your site." },
        { id: uid("cf"), icon: "Server", title: "Hosting and domain included", description: "No separate platform fee while Care is active. Your domain renews automatically." },
        { id: uid("cf"), icon: "Zap", title: "Fast response", description: "48 hours on Care Basic, 24 hours on Pro, same day on Business." },
      ],
    }, { templateVariant: "bento-grid", background: color(BG2) }),
    faq([
      ["What counts as one change?", "One edit request on one page that takes up to 30 minutes: text, an image, reordering a section, a colour, a form field. Bigger requests count as several changes, or we quote them as a new page. Unused changes do not roll over."],
      ["What does fair use mean on Care Business?", "Up to about 20 hours of our team's time a month. If you need more, we talk to you first. We never bill extra without asking."],
      ["What is not included?", "A full redesign, new custom features or integrations, paid stock photos or videos, and ad spend. We are happy to quote these separately."],
      ["What happens if I stop Care?", "Your website stays online and moves to the yearly platform renewal for your package. You can start Care again any time."],
      ["My site was not built by Passive Coder. Can I get Care?", "Yes. We move your site onto our platform first. Care for a moved site is yearly, or monthly with a one-time onboarding fee."],
      ["Do you manage Google Business Profile?", "No. Search Console, schema and SEO checks are included from Care Pro, but we do not manage Google Business Profile listings."],
    ], "Care plan questions", "The fine print, in plain words."),
    finalCta("Need a new website too?", "Every website package comes with free Care months. Get the website and a year of Care together and save 10%.",
      { label: "See website packages", url: "/pricing" }, { label: "WhatsApp us", url: WA }),
  ];
}

function bangladeshPage() {
  return [
    block("hero", {
      layout: "left",
      badge: "প্রবাসী ব্যবসায়ীদের জন্য",
      title: "আপনার ব্যবসার প্রফেশনাল ওয়েবসাইট,",
      titleAccent: "একবার পেমেন্টে।",
      subtitle: "UAE, সৌদি, কাতার, ওমান, মালয়েশিয়া, সিঙ্গাপুরে যেখানেই থাকুন, WhatsApp-এ সব কাজ। আগে হোমপেজ দেখবেন, পছন্দ হলে পেমেন্ট।",
      primaryButton: { label: "প্রাইস দেখুন", url: "#pricing", variant: "primary" },
      secondaryButton: { label: "WhatsApp-এ কথা বলুন", url: WA_BN, variant: "outline" },
      imageUrl: U("photo-1504307651254-35680f356dfd", 1400),
      imageAlt: "Construction business owner",
      typography: typo("6xl"),
    }, { templateVariant: "dark-gradient-left", padding: pad(130, 110) }),
    block("stats", {
      layout: "row", columns: 4, style: "plain", animate: true,
      items: [
        { id: uid("s"), value: "17", suffix: "+", label: "লাইভ ক্লায়েন্ট ওয়েবসাইট" },
        { id: uid("s"), value: "8", label: "দেশে" },
        { id: uid("s"), value: "24", suffix: "h", label: "গড়ে লাইভ হতে সময়" },
        { id: uid("s"), value: "0", label: "আগে টাকা দিতে হয় না" },
      ],
    }, { templateVariant: "gradient-numbers", padding: pad(56), background: color(BG2) }),
    block("pricing_catalog", {
      mode: "both", language: "bn", defaultCurrency: "BDT", showCurrencyToggle: false, showBdPrompt: false,
      careLinkUrl: "/website-maintenance", tone: "dark", ctaBaseUrl: "/onboarding",
      eyebrow: "প্রাইস", title: "ওয়েবসাইট বানাতে একবারই পেমেন্ট",
      subtitle: "প্রথম ১২ মাসের হোস্টিং, SSL, ব্যাকআপ আর ডোমেইন প্যাকেজের সাথেই। মাসে মাসে কোনো চার্জ নেই।",
    }, { padding: pad(104) }),
    block("steps", {
      title: "কীভাবে কাজ হয়",
      subtitle: "কোনো ফর্ম নেই, কোনো টেকনিক্যাল ঝামেলা নেই।",
      layout: "horizontal", style: "connected",
      items: [
        { id: uid("st"), icon: "MessageCircle", title: "তথ্য পাঠান", description: "ব্যবসার নাম, লোগো, কয়েকটা ছবি আর সার্ভিসের তালিকা WhatsApp-এ।" },
        { id: uid("st"), icon: "LayoutTemplate", title: "হোমপেজ দেখুন", description: "আমরা আগে হোমপেজ বানিয়ে দেখাই, তখনো কোনো টাকা লাগে না।" },
        { id: uid("st"), icon: "BadgeCheck", title: "কনফার্ম করে পেমেন্ট", description: "bKash, Nagad, ব্যাংক অথবা কার্ডে একবার পেমেন্ট।" },
        { id: uid("st"), icon: "Rocket", title: "সাইট লাইভ", description: "ডোমেইন, হোস্টিং, SSL সব সেটআপ করে আপনার সাইট লাইভ।" },
      ],
    }, { templateVariant: "timeline-connected", background: color(BG2) }),
    block("services", {
      eyebrow: "আমাদের কাজ",
      title: "এখনই লাইভ, নিজে দেখে নিন",
      subtitle: "নিচের প্রতিটি সাইট Passive Coder-এ বানানো এবং চালানো।",
      layout: "cards", columns: 3, cardStyle: "elevated", source: "inline",
      items: CLIENTS.slice(0, 6).map(([name, kicker, domain]) => ({
        id: uid("c"), title: name, kicker, description: domain,
        imageUrl: `/images/clients/${domain}.jpg`, link: `https://${domain}`, linkLabel: "সাইট দেখুন",
      })),
    }, { templateVariant: "image-cards-dark" }),
    faq(FAQ_BN, "সাধারণ প্রশ্ন", "আরো কিছু জানতে চাইলে WhatsApp করুন।", "split-heading", BG2),
    finalCta("আজই শুরু করুন", "ব্যবসার নাম আর সার্ভিস পাঠান, আমরা আগে হোমপেজ বানিয়ে দেখাব।",
      { label: "WhatsApp-এ মেসেজ দিন", url: WA_BN }, { label: "প্রাইস দেখুন", url: "#pricing" }),
  ];
}

function contactPage() {
  return [
    pageHero("Contact", "Talk to a real person.", "We reply fast.",
      "WhatsApp is the quickest way to reach us. Or send the form and we will get back to you within a day.",
      { primaryButton: { label: "WhatsApp us", url: WA, variant: "primary" } }),
    block("contact", {
      title: "Send us a message", subtitle: "Tell us about your business and what you need.",
      layout: "split", showMap: false, showContactInfo: true,
      fields: [
        { id: "f-name", label: "Your name", type: "text", required: true },
        { id: "f-business", label: "Business name", type: "text", required: false },
        { id: "f-phone", label: "WhatsApp number", type: "tel", required: true },
        { id: "f-email", label: "Email", type: "email", required: false },
        { id: "f-msg", label: "What do you need?", type: "textarea", required: true },
      ],
      submitLabel: "Send message", successMessage: "Thanks! We will get back to you shortly.",
    }, { padding: pad(48, 104) }),
  ];
}

function legalPage(title, sections) {
  return [
    pageHero("Legal", title, "", ""),
    block("text", {
      content: sections.map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join(""),
      alignment: "left", columns: 1, typography: { lineHeight: "1.75" },
    }, { padding: pad(24, 104), width: "narrow" }),
  ];
}

const REFUND = [
  ["See it before you pay", "We build your homepage before you pay anything. If you do not like it, you owe nothing."],
  ["14-day money-back guarantee", "If you are not satisfied, you can ask for a full refund of your website build within 14 days of payment."],
  ["Care plans", "Monthly Care can be stopped at any time and runs until the end of the paid month. Yearly Care is refundable within 14 days of payment."],
  ["Platform renewals", "Yearly platform renewals are refundable within 14 days of the renewal date."],
  ["How to ask", "Message us on WhatsApp or through the contact page with your site name. Refunds go back to the original payment method."],
];

// ─── write ──────────────────────────────────────────────────────────────────
async function upsertPage(slug, title, blocks, seo, order) {
  const now = new Date().toISOString();
  await sb.from("pages").update({ status: "archived", updated_at: now })
    .eq("tenant_id", TENANT_ID).eq("slug", slug).is("deleted_at", null).neq("status", "archived");
  const { error } = await sb.from("pages").insert({
    tenant_id: TENANT_ID, template_id: null, title, slug, type: "page", status: "published",
    blocks: blocks.map((b, i) => ({ ...b, order: i })), seo, order_index: order, created_at: now, updated_at: now,
  });
  if (error) throw new Error(`${slug}: ${error.message}`);
  console.log("page", slug, blocks.length, "blocks");
}

async function preserveLegal(slug) {
  // Keep the existing legal wording if the root tenant already has one.
  const { data } = await sb.from("pages").select("id").eq("tenant_id", TENANT_ID).eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
  return !!data;
}

(async () => {
  const { error: idErr } = await sb.from("site_identity").update({
    global_header: [header()], global_footer: [footer()], global_prefooter: [], updated_at: new Date().toISOString(),
  }).eq("tenant_id", TENANT_ID);
  if (idErr) throw idErr;
  await sb.from("nav_menus").delete().eq("tenant_id", TENANT_ID);

  const seo = (title, description) => ({ title, description });
  await upsertPage("home", "Home", home(), seo("Passive Coder — Professional Websites for Local Businesses", "We build and run professional websites for local service businesses, with WhatsApp enquiries, booking and a shop built in. Pay once, see it first."), 0);
  await upsertPage("pricing", "Pricing", pricingPage(), seo("Website Pricing — Passive Coder", "One-time website packages with the first year of hosting, SSL, backups and domain included. Optional monthly or yearly Care plans."), 1);
  await upsertPage("website-maintenance", "Website Care Plans", carePage(), seo("Website Maintenance & Care Plans — Passive Coder", "Website maintenance with hosting, domain renewal, monthly updates, new pages, SEO checks and priority support."), 2);
  await upsertPage("bangladesh", "Bangladesh", bangladeshPage(), seo("প্রবাসী ব্যবসায়ীদের জন্য প্রফেশনাল ওয়েবসাইট | Passive Coder", "একবার পেমেন্টে প্রফেশনাল ওয়েবসাইট, প্রথম বছরের হোস্টিং আর ডোমেইন সহ। আগে দেখুন, পরে পেমেন্ট।"), 3);
  await upsertPage("contact", "Contact", contactPage(), seo("Contact — Passive Coder", "Talk to the Passive Coder team on WhatsApp or send us a message."), 4);
  await upsertPage("refund", "Refund Policy", legalPage("Refund policy", REFUND), seo("Refund Policy — Passive Coder", "Our refund policy for website builds, Care plans and platform renewals."), 7);
  console.log("done");
})().catch((e) => { console.error(e); process.exit(1); });
