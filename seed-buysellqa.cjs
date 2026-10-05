/**
 * Buy Sell Moving Shifting Qatar — Md. Billal Hossain, Najma, Doha.
 * Basic-plan demo at buysellqa.passivecoder.com, English + Arabic (/ar, seo.lang = "ar").
 * Two focus lines: Moving & Shifting, and Buy & Sell (used AC / refrigerators).
 * Six pages per language: Home, About, Moving & Shifting, Buy & Sell, All Services, Contact.
 * Every service card and both focus pages carry two CTAs: Call + WhatsApp.
 * Logo: vector redraw, clients/Buy Sell Moving Shifiting Qatar/build-logo.cjs (Qatar flag palette).
 * Photos are Pexels stand-ins. Safe to re-run; --skip-assets skips uploads.
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const OWNER_ID = "2ec0befe-7aa8-4a89-acc4-b9fe9250bcf4"; // walibdpro — demo creator
const SLUG = "buysellqa";
const PLAN = "basic";
const TEMPLATE_SLUG = "aircon-plumbing"; // custom_css empty
const DEMO_HOURS = 72; // demos always 72h (matches src/modules/demo/links.ts)

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "Buy Sell Moving Shifting Qatar";
const SITE_NAME_AR = "شراء وبيع ونقل أثاث قطر";
const OWNER = "Md. Billal Hossain";
const OWNER_AR = "محمد بلال حسين";
// Card prints "+9430669553" (missing the 7 of +974). Qatar mobile = +974 3066 9553.
const PHONE = "+97430669553";
const PHONE_DISPLAY = "+974 3066 9553";
const PHONE_LOCAL = "3066 9553";
const WA_NUMBER = "97430669553";
const ADDRESS = "Najma, Doha, Qatar";
const ADDRESS_AR = "النجمة، الدوحة، قطر";
const MAP_EMBED = "https://maps.google.com/maps?q=Najma%2C%20Doha%2C%20Qatar&z=14&output=embed";
const MAP_LINK = "https://maps.google.com/?q=Najma,+Doha,+Qatar";
const TEL = `tel:${PHONE}`;
const phoneTxt = (L) => (L.lang ? `⁦${PHONE_DISPLAY}⁩` : PHONE_DISPLAY); // LTR isolate inside Arabic
const waText = (t) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;

const MAROON = "#8A1538";   // Qatar flag maroon, primary
const DEEP = "#5E0E26";
const DARK = "#2B0712";     // footer / dark bands
const INK = "#241418";
const PAPER = "#FFFFFF";
const CREAM = "#FBF6F3";    // alternate band
const LINE = "#EADDE0";
const MUTED = "#6B5A5F";
const WA_GREEN = "#1FAF57";

const STORAGE_DIR = `uploads/${SLUG}`;
const asset = (name) => `${SUPABASE_URL}/storage/v1/object/public/media/${STORAGE_DIR}/${name}`;
const LOGO = asset("logo.png");
const LOGO_LIGHT = asset("logo-light.png");
const FAVICON_URL = asset("favicon.png");

// Pexels (free for commercial use), stand-ins until the client sends photos.
const px = (id, w = 1400) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const IMG = {
  van: 7464721, van2: 7464723, crew: 7464703, sofaHall: 7464722, boxes: 7464729,
  carry: 7464657, mover: 7464711, doorway: 7464724, kneel: 7464709, tape: 7464661,
  acRoof: 5463575, acFix: 5463584, acPanel: 5463578, acShop: 33671149,
  fridge: 6835104, kitchen: 6835107, carpenter: 5973910, drill: 4981798,
};
const img = (k, w) => px(IMG[k], w);

// ─── Services (shared EN/AR) ────────────────────────────────────────────────
// group: "move" | "buy" — focus pages filter by group; home shows the two pillars + the rest.
const SERVICES = [
  { key: "house", group: "move", icon: "home", img: "sofaHall",
    en: ["House & Villa Shifting", "Flats, villas and rooms across Doha. Packing, loading, transport and unloading by one team."],
    ar: ["نقل البيوت والفلل", "شقق وفلل وغرف في جميع أنحاء الدوحة. تغليف وتحميل ونقل وتنزيل بفريق واحد."] },
  { key: "office", group: "move", icon: "building", img: "doorway",
    en: ["Office & Shop Relocation", "Desks, files, shelves and equipment moved with care, after hours if you need it."],
    ar: ["نقل المكاتب والمحلات", "مكاتب وملفات ورفوف ومعدات تُنقل بعناية، وبعد الدوام إذا احتجت."] },
  { key: "truck", group: "move", icon: "truck", img: "van2",
    en: ["Truck & Pickup Hire", "Closed truck or pickup with driver and helpers, for a full move or a single item."],
    ar: ["تأجير شاحنة وبيك أب", "شاحنة مغلقة أو بيك أب مع سائق وعمال، لنقل كامل أو قطعة واحدة."] },
  { key: "furniture", group: "move", icon: "hammer", img: "carpenter",
    en: ["Furniture Removal & Fixing", "Carpenter on the team to dismantle, move and fix beds, wardrobes and cabinets."],
    ar: ["فك وتركيب الأثاث", "نجار ضمن الفريق لفك ونقل وتركيب الأسرّة والدواليب والخزائن."] },
  { key: "labor", group: "move", icon: "users", img: "carry",
    en: ["Labour & Loading", "Strong, careful helpers for loading, unloading and heavy lifting by the hour or the job."],
    ar: ["عمال تحميل وتنزيل", "عمال أقوياء وحريصون للتحميل والتنزيل ورفع الأغراض الثقيلة بالساعة أو بالمهمة."] },
  { key: "usedac", group: "buy", icon: "snow", img: "acShop",
    en: ["Used AC Buying & Selling", "We buy your old split or window AC for cash and sell checked, working used units."],
    ar: ["شراء وبيع المكيفات المستعملة", "نشتري مكيفك القديم سبليت أو شباك نقدًا، ونبيع مكيفات مستعملة مفحوصة وشغالة."] },
  { key: "fridge", group: "buy", icon: "fridge", img: "fridge",
    en: ["Used Refrigerator Buying & Selling", "Moving out or upgrading? We buy your fridge and collect it. Working used fridges for sale."],
    ar: ["شراء وبيع الثلاجات المستعملة", "مغادر أو بتغيّر ثلاجتك؟ نشتريها ونستلمها من عندك. وعندنا ثلاجات مستعملة شغالة للبيع."] },
  { key: "acrepair", group: "buy", icon: "wrench", img: "acFix",
    en: ["AC Replacement & Repair", "Not cooling, leaking or noisy? We find the fault, repair it or replace the unit."],
    ar: ["تبديل وتصليح المكيفات", "ما يبرد، يسرّب أو صوته عالي؟ نحدد العطل ونصلحه أو نبدّل المكيف."] },
  { key: "acservice", group: "buy", icon: "spark", img: "acRoof",
    en: ["AC Home Servicing", "Cleaning and servicing at your home so your AC cools properly through the Qatar summer."],
    ar: ["صيانة المكيفات في البيت", "تنظيف وصيانة في بيتك عشان مكيفك يبرد زين طول صيف قطر."] },
];

// ─── Copy ───────────────────────────────────────────────────────────────────
const T = {
  en: {
    prefix: "", lang: null, dir: "ltr", siteName: SITE_NAME,
    phone: PHONE_DISPLAY,
    wa: waText("Hello, I would like to ask about your services."),
    waFor: (s) => waText(`Hello, I would like to ask about ${s}.`),
    nav: { home: "Home", about: "About Us", moving: "Moving Shifting", buysell: "Buy Sell", services: "All Services", contact: "Contact Us", switchLabel: "العربية" },
    call: "Call Now", callShort: "Call", whatsapp: "WhatsApp", callUs: "Call us now", learn: "View details",
    strip: ["Moving, shifting and used AC / fridge buy & sell in Doha", "Call now"],
    hero: {
      pill: "Najma, Doha · All over Qatar",
      title: ["Moving & Shifting.", "Buy & Sell."],
      desc: "House and office shifting with truck, labour and carpenter. We also buy and sell used ACs and refrigerators. One call and we take care of it.",
      ticks: ["Packing, loading, transport", "Carpenter for furniture fixing", "Cash for your old AC & fridge"],
      phoneLabel: "Call for a free quote",
    },
    pillars: {
      eyebrow: "Our two main services", title: "What can we do for you today?",
      moving: { tag: "Moving & Shifting", title: "Shift your home or office without the stress", list: ["House, villa and flat shifting", "Office and shop relocation", "Truck and pickup with driver", "Furniture removal and fixing"] },
      buysell: { tag: "Buy & Sell", title: "Sell your old AC and fridge for cash, or buy a used one", list: ["We buy old ACs and refrigerators", "Checked, working used units for sale", "AC replacement and repair", "AC home servicing"] },
    },
    other: { eyebrow: "More services", title: "Everything around your move", lede: "Call or WhatsApp straight from any card." },
    steps: { eyebrow: "How it works", title: "Three steps, one phone call", items: [
      ["Call or WhatsApp", "Tell us what you need moved, or send a photo of the AC or fridge you want to sell."],
      ["Get a clear price", "We give you the price up front. No hidden charges on the day."],
      ["We do the job", "Our team arrives on time, does the work and you pay when it is done."],
    ] },
    why: { eyebrow: "Why customers call us", title: "Simple, honest and on time", items: [
      ["One team, every job", "Moving, labour, carpenter and truck from one number. No running around."],
      ["Careful with your things", "Furniture wrapped, boxes packed and heavy items lifted the right way."],
      ["Fair prices", "Clear price before we start, and a fair cash offer for your used appliances."],
      ["Quick response", "Call or WhatsApp and we reply fast, including weekends."],
    ] },
    bigCta: { title: "Moving soon or selling an old AC?", desc: "Call now and talk to us directly. We pick up straight away.", },
    servicesPage: { crumb: "All Services", title: "All Our Services", desc: "Moving and shifting, labour, truck hire, furniture fixing, and used AC and refrigerator buy & sell in Doha." },
    movingPage: {
      crumb: "Moving Shifting", title: "Moving & Shifting in Doha", desc: "House, villa, flat, office and shop shifting with truck, labour and carpenter. One call and we handle the whole move.",
      introTitle: "Your move, handled from start to finish",
      intro: "Moving house is hard work. We make it easy. Our team packs, dismantles furniture, loads the truck, drives it across Doha or anywhere in Qatar, then unloads and fixes everything in your new place.",
      includesTitle: "What is included", includes: [
        ["Packing & wrapping", "Boxes, wrapping and careful packing for fragile items."],
        ["Furniture dismantle & fixing", "Beds, wardrobes and cabinets taken apart and fixed again by our carpenter."],
        ["Loading & unloading", "Strong helpers who lift heavy items safely."],
        ["Truck & pickup", "Closed truck or pickup, sized for your move."],
        ["AC removal & fitting", "Split ACs removed and fitted again at the new place."],
        ["Office & shop moves", "After-hours moves so your business keeps running."],
      ],
      card: { title: "Free moving quote", desc: "Tell us the size of the move and the two locations. We give you a price on the phone." },
      galleryTitle: "Our moving work",
    },
    buyPage: {
      crumb: "Buy Sell", title: "Used AC & Refrigerator Buy & Sell", desc: "Sell your old AC or refrigerator for cash, buy a checked used unit, or get your AC repaired and serviced at home.",
      buyTitle: "We buy", buyDesc: "Moving out, upgrading or leaving Qatar? Send us a photo and we make you an offer. We collect it from your home.",
      buyList: ["Split ACs", "Window ACs", "Refrigerators", "Working or not working"],
      sellTitle: "We sell", sellDesc: "Need a budget AC or fridge? Our used units are checked and working before they leave.",
      sellList: ["Checked, working used ACs", "Used refrigerators", "Delivery in Doha", "AC fitting available"],
      howTitle: "Selling your old AC or fridge", how: [
        ["Send a photo", "WhatsApp a photo of the unit and tell us the brand and size."],
        ["Get our offer", "We give you a fair cash price."],
        ["We collect & pay", "Our team removes it from your home and pays you on the spot."],
      ],
      repairTitle: "AC repair and servicing",
    },
    aboutPage: {
      crumb: "About Us", title: "About Us", desc: "A local moving, shifting and used appliance business based in Najma, Doha.",
      storyTitle: "Local, hands-on and easy to reach",
      story: `${SITE_NAME} is run by ${OWNER} from Najma, Doha. We help families, bachelors and small businesses move house and office, and we buy and sell used air conditioners and refrigerators.\n\nWhen you call, you talk to the person who does the job. We keep it simple: a clear price, a team that turns up on time, and care for your things.`,
      values: [["Honest prices", "You know the price before we start."], ["On time", "We turn up when we say we will."], ["Careful hands", "Your furniture and appliances are treated with care."]],
      galleryTitle: "Our team at work",
    },
    contactPage: {
      crumb: "Contact Us", title: "Contact Us", desc: "The fastest way to reach us is a phone call. WhatsApp works too.",
      callCard: "Call us directly", waCard: "WhatsApp us", waDesc: "Send a photo or your move details.", locCard: "Our area", locDesc: "Najma, Doha. We serve all of Qatar.",
      formTitle: "Send us a message", formSub: "Leave your details and we call you back.",
      fields: ["Full Name", "Mobile / WhatsApp", "Service needed", "Message"],
      options: ["House / villa shifting", "Office relocation", "Truck / pickup", "Furniture fixing", "Sell my old AC / fridge", "Buy a used AC / fridge", "AC repair / servicing", "Other"],
      submit: "Send Message", success: "Thank you. We will call you back shortly. For a faster answer, call us now.",
    },
    faqTitle: "Frequently Asked Questions",
    faqMove: [
      ["Do you move within Doha and outside Doha?", "Yes. We move homes and offices inside Doha and to other areas in Qatar."],
      ["Do you dismantle and fix furniture?", "Yes. A carpenter comes with the team to dismantle and fix beds, wardrobes and cabinets."],
      ["How do I get a price?", "Call us with the size of the move and both locations. We give you the price on the phone."],
      ["Can you move only one or two items?", "Yes. Hire a pickup with helpers for single items like a fridge, sofa or washing machine."],
    ],
    faqBuy: [
      ["Do you buy ACs that are not working?", "Yes. Send us a photo and the brand. We make an offer for working and not working units."],
      ["Do you remove the AC from my wall?", "Yes. Our team removes the unit and takes it away."],
      ["Are your used ACs and fridges working?", "Yes. Every unit we sell is checked and working before it leaves us."],
      ["Do you repair ACs at home?", "Yes. We repair, replace and service ACs at your home."],
    ],
    footer: { tagline: "Moving and shifting, truck and labour, furniture fixing, and used AC and refrigerator buy & sell. Najma, Doha, Qatar.", pages: "Pages", services: "Services", contact: "Contact", copyright: `© {year} ${SITE_NAME}. All rights reserved.` },
    seo: {
      home: ["Moving, Shifting & Used AC Buy Sell in Doha", "House and office shifting with truck, labour and carpenter, plus used AC and refrigerator buying and selling in Doha, Qatar. Call +974 3066 9553."],
      about: ["About Us", `${SITE_NAME}, a local moving and used appliance business in Najma, Doha.`],
      moving: ["Moving & Shifting in Doha, Qatar", "House, villa, office and shop shifting in Doha with truck, labour and carpenter. Call for a free quote."],
      buysell: ["Used AC & Fridge Buy Sell in Doha", "We buy old ACs and refrigerators for cash and sell checked used units in Doha. AC repair and home servicing."],
      services: ["All Services", "Moving, shifting, labour, truck hire, furniture fixing, used AC and refrigerator buy & sell, AC repair and servicing in Doha."],
      contact: ["Contact Us", "Call +974 3066 9553 or WhatsApp for moving, shifting and used AC / fridge buy & sell in Doha."],
    },
  },

  ar: {
    prefix: "/ar", lang: "ar", dir: "rtl", siteName: SITE_NAME_AR,
    phone: PHONE_DISPLAY,
    wa: waText("السلام عليكم، أبغى أستفسر عن خدماتكم"),
    waFor: (s) => waText(`السلام عليكم، أبغى أستفسر عن ${s}`),
    nav: { home: "الرئيسية", about: "من نحن", moving: "نقل الأثاث", buysell: "شراء وبيع", services: "جميع الخدمات", contact: "تواصل معنا", switchLabel: "English" },
    call: "اتصل الآن", callShort: "اتصال", whatsapp: "واتساب", callUs: "اتصل بنا الآن", learn: "التفاصيل",
    strip: ["نقل أثاث وشراء وبيع المكيفات والثلاجات المستعملة في الدوحة", "اتصل الآن"],
    hero: {
      pill: "النجمة، الدوحة · جميع مناطق قطر",
      title: ["نقل الأثاث.", "شراء وبيع."],
      desc: "نقل البيوت والمكاتب بالشاحنة والعمال والنجار. ونشتري ونبيع المكيفات والثلاجات المستعملة. مكالمة وحدة ونتكفل بالباقي.",
      ticks: ["تغليف وتحميل ونقل", "نجار لفك وتركيب الأثاث", "نقدًا مقابل مكيفك وثلاجتك القديمة"],
      phoneLabel: "اتصل لعرض سعر مجاني",
    },
    pillars: {
      eyebrow: "خدماتنا الرئيسية", title: "كيف نقدر نخدمك اليوم؟",
      moving: { tag: "نقل الأثاث", title: "انقل بيتك أو مكتبك بدون تعب", list: ["نقل البيوت والفلل والشقق", "نقل المكاتب والمحلات", "شاحنة وبيك أب مع سائق", "فك وتركيب الأثاث"] },
      buysell: { tag: "شراء وبيع", title: "بع مكيفك وثلاجتك القديمة نقدًا، أو اشترِ مستعمل", list: ["نشتري المكيفات والثلاجات القديمة", "أجهزة مستعملة مفحوصة وشغالة للبيع", "تبديل وتصليح المكيفات", "صيانة المكيفات في البيت"] },
    },
    other: { eyebrow: "خدمات أخرى", title: "كل ما يخص نقلك", lede: "اتصل أو راسلنا على واتساب مباشرة من أي بطاقة." },
    steps: { eyebrow: "طريقة العمل", title: "ثلاث خطوات ومكالمة وحدة", items: [
      ["اتصل أو راسلنا", "قل لنا وش تبغى تنقل، أو أرسل صورة المكيف أو الثلاجة اللي تبغى تبيعها."],
      ["سعر واضح", "نعطيك السعر من البداية. بدون رسوم مخفية يوم الشغل."],
      ["ننجز الشغل", "فريقنا يوصل في الموعد، ينجز الشغل وتدفع بعد ما يخلص."],
    ] },
    why: { eyebrow: "ليش العملاء يتصلون فينا", title: "بساطة وأمانة والتزام بالموعد", items: [
      ["فريق واحد لكل شيء", "نقل وعمال ونجار وشاحنة من رقم واحد. بدون لف ودوران."],
      ["نحافظ على أغراضك", "تغليف الأثاث وتعبئة الكراتين ورفع الأغراض الثقيلة بالطريقة الصحيحة."],
      ["أسعار مناسبة", "سعر واضح قبل ما نبدأ، وعرض نقدي عادل لأجهزتك المستعملة."],
      ["رد سريع", "اتصل أو راسلنا على واتساب ونرد عليك بسرعة، حتى في العطل."],
    ] },
    bigCta: { title: "عندك نقل قريب أو مكيف قديم تبغى تبيعه؟", desc: "اتصل الآن وكلمنا مباشرة. نرد عليك على طول." },
    servicesPage: { crumb: "جميع الخدمات", title: "جميع خدماتنا", desc: "نقل الأثاث، العمال، تأجير الشاحنات، فك وتركيب الأثاث، وشراء وبيع المكيفات والثلاجات المستعملة في الدوحة." },
    movingPage: {
      crumb: "نقل الأثاث", title: "نقل الأثاث في الدوحة", desc: "نقل البيوت والفلل والشقق والمكاتب والمحلات بالشاحنة والعمال والنجار. مكالمة وحدة ونتكفل بالنقل كامل.",
      introTitle: "نقلك علينا من البداية للنهاية",
      intro: "نقل البيت شغل متعب، وحنا نسهّله عليك. فريقنا يغلّف، يفك الأثاث، يحمّل الشاحنة، ينقلها داخل الدوحة أو لأي مكان في قطر، ثم ينزّل ويركّب كل شيء في بيتك الجديد.",
      includesTitle: "وش تشمل الخدمة", includes: [
        ["التغليف والتعبئة", "كراتين وتغليف وتعبئة بعناية للأغراض القابلة للكسر."],
        ["فك وتركيب الأثاث", "الأسرّة والدواليب والخزائن يفكها ويركّبها النجار."],
        ["التحميل والتنزيل", "عمال أقوياء يرفعون الأغراض الثقيلة بأمان."],
        ["شاحنة وبيك أب", "شاحنة مغلقة أو بيك أب حسب حجم النقل."],
        ["فك وتركيب المكيفات", "نفك المكيفات السبليت ونركّبها في المكان الجديد."],
        ["نقل المكاتب والمحلات", "نقل بعد الدوام عشان شغلك ما يتوقف."],
      ],
      card: { title: "عرض سعر مجاني للنقل", desc: "قل لنا حجم النقل والموقعين، ونعطيك السعر على التلفون." },
      galleryTitle: "من أعمال النقل",
    },
    buyPage: {
      crumb: "شراء وبيع", title: "شراء وبيع المكيفات والثلاجات المستعملة", desc: "بع مكيفك أو ثلاجتك القديمة نقدًا، اشترِ جهاز مستعمل مفحوص، أو صلّح وصيّن مكيفك في البيت.",
      buyTitle: "نشتري", buyDesc: "مغادر أو بتغيّر أو مسافر من قطر؟ أرسل لنا صورة ونعطيك عرض. نستلمه من بيتك.",
      buyList: ["مكيفات سبليت", "مكيفات شباك", "ثلاجات", "شغالة أو خربانة"],
      sellTitle: "نبيع", sellDesc: "تحتاج مكيف أو ثلاجة بسعر مناسب؟ أجهزتنا المستعملة مفحوصة وشغالة قبل ما تطلع.",
      sellList: ["مكيفات مستعملة مفحوصة وشغالة", "ثلاجات مستعملة", "توصيل داخل الدوحة", "تركيب المكيف متوفر"],
      howTitle: "بيع مكيفك أو ثلاجتك القديمة", how: [
        ["أرسل صورة", "صوّر الجهاز وأرسله على واتساب مع الماركة والحجم."],
        ["استلم عرضنا", "نعطيك سعر نقدي عادل."],
        ["نستلم وندفع", "فريقنا يفك الجهاز من بيتك ويدفع لك في نفس الوقت."],
      ],
      repairTitle: "تصليح وصيانة المكيفات",
    },
    aboutPage: {
      crumb: "من نحن", title: "من نحن", desc: "نشاط محلي لنقل الأثاث وشراء وبيع الأجهزة المستعملة في النجمة، الدوحة.",
      storyTitle: "محليين وقريبين منك",
      story: `${SITE_NAME_AR} يديره ${OWNER_AR} من منطقة النجمة في الدوحة. نساعد العائلات والعزاب والمحلات الصغيرة في نقل البيوت والمكاتب، ونشتري ونبيع المكيفات والثلاجات المستعملة.\n\nلما تتصل، تكلم الشخص اللي ينجز الشغل بنفسه. نخليها بسيطة: سعر واضح، فريق يوصل في الموعد، وحرص على أغراضك.`,
      values: [["أسعار أمينة", "تعرف السعر قبل ما نبدأ."], ["في الموعد", "نوصل في الوقت اللي نتفق عليه."], ["أيدي حريصة", "نتعامل مع أثاثك وأجهزتك بعناية."]],
      galleryTitle: "فريقنا أثناء العمل",
    },
    contactPage: {
      crumb: "تواصل معنا", title: "تواصل معنا", desc: "أسرع طريقة توصل لنا هي المكالمة. والواتساب بعد متاح.",
      callCard: "اتصل بنا مباشرة", waCard: "راسلنا على واتساب", waDesc: "أرسل صورة أو تفاصيل النقل.", locCard: "منطقتنا", locDesc: "النجمة، الدوحة. نخدم جميع مناطق قطر.",
      formTitle: "أرسل لنا رسالة", formSub: "اترك بياناتك ونتصل فيك.",
      fields: ["الاسم الكامل", "رقم الجوال / واتساب", "الخدمة المطلوبة", "رسالتك"],
      options: ["نقل بيت / فيلا", "نقل مكتب", "شاحنة / بيك أب", "فك وتركيب أثاث", "بيع مكيف / ثلاجة قديمة", "شراء مكيف / ثلاجة مستعملة", "تصليح / صيانة مكيف", "أخرى"],
      submit: "إرسال", success: "شكرًا لك. بنتصل فيك قريب. وللرد الأسرع، اتصل بنا الآن.",
    },
    faqTitle: "الأسئلة الشائعة",
    faqMove: [
      ["تنقلون داخل الدوحة وخارجها؟", "نعم. ننقل البيوت والمكاتب داخل الدوحة ولباقي مناطق قطر."],
      ["تفكون وتركّبون الأثاث؟", "نعم. النجار يجي مع الفريق ويفك ويركّب الأسرّة والدواليب والخزائن."],
      ["كيف أعرف السعر؟", "اتصل فينا وقل لنا حجم النقل والموقعين، ونعطيك السعر على التلفون."],
      ["تقدرون تنقلون قطعة أو قطعتين بس؟", "نعم. تقدر تأجر بيك أب مع عمال لقطعة وحدة مثل ثلاجة أو كنب أو غسالة."],
    ],
    faqBuy: [
      ["تشترون المكيفات الخربانة؟", "نعم. أرسل لنا صورة والماركة، ونعطيك عرض للشغال والخربان."],
      ["تفكون المكيف من الجدار؟", "نعم. فريقنا يفك الجهاز وياخذه."],
      ["المكيفات والثلاجات المستعملة عندكم شغالة؟", "نعم. كل جهاز نبيعه مفحوص وشغال قبل ما يطلع من عندنا."],
      ["تصلحون المكيفات في البيت؟", "نعم. نصلح ونبدّل ونصيّن المكيفات في بيتك."],
    ],
    footer: { tagline: "نقل الأثاث، شاحنات وعمال، فك وتركيب الأثاث، وشراء وبيع المكيفات والثلاجات المستعملة. النجمة، الدوحة، قطر.", pages: "الصفحات", services: "خدماتنا", contact: "تواصل", copyright: `© {year} ${SITE_NAME_AR}. جميع الحقوق محفوظة.` },
    seo: {
      home: ["نقل أثاث وشراء وبيع مكيفات مستعملة في الدوحة", "نقل البيوت والمكاتب بالشاحنة والعمال والنجار، وشراء وبيع المكيفات والثلاجات المستعملة في الدوحة، قطر. اتصل 97430669553+."],
      about: ["من نحن", `${SITE_NAME_AR}، نشاط محلي لنقل الأثاث والأجهزة المستعملة في النجمة، الدوحة.`],
      moving: ["نقل الأثاث في الدوحة، قطر", "نقل البيوت والفلل والمكاتب والمحلات في الدوحة بالشاحنة والعمال والنجار. اتصل لعرض سعر مجاني."],
      buysell: ["شراء وبيع مكيفات وثلاجات مستعملة في الدوحة", "نشتري المكيفات والثلاجات القديمة نقدًا ونبيع أجهزة مستعملة مفحوصة في الدوحة. تصليح وصيانة المكيفات."],
      services: ["جميع الخدمات", "نقل أثاث، عمال، تأجير شاحنات، فك وتركيب أثاث، شراء وبيع مكيفات وثلاجات مستعملة، تصليح وصيانة مكيفات في الدوحة."],
      contact: ["تواصل معنا", "اتصل أو راسلنا على واتساب لنقل الأثاث وشراء وبيع المكيفات والثلاجات المستعملة في الدوحة."],
    },
  },
};

// ─── block plumbing ─────────────────────────────────────────────────────────
const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = { visible: true, width: "full", padding: { top: 88, right: 24, bottom: 88, left: 24 }, margin: ZERO, background: { type: "none" } };
const bgColor = (color) => ({ type: "color", color });
const html = (id, markup, css, bg = PAPER) => ({ ...BASE, id: uid(id), type: "custom_html", padding: ZERO, background: bgColor(bg), data: { html: markup, css } });

const PAGES = ["home", "about", "moving", "buysell", "services", "contact"];
const ROUTE = { home: "", about: "about", moving: "moving-shifting", buysell: "buy-sell", services: "services", contact: "contact" };
const pagePath = (L, key) => (key === "home" ? (L.prefix || "/") : `${L.prefix}/${ROUTE[key]}`);
const pageSlug = (L, key) => pagePath(L, key).replace(/^\//, "") || "home";
const svcName = (L, s) => s[L.lang ? "ar" : "en"][0];
const svcDesc = (L, s) => s[L.lang ? "ar" : "en"][1];
const ph = (L) => `<bdi dir="ltr">${PHONE_DISPLAY}</bdi>`;

// ─── icons ──────────────────────────────────────────────────────────────────
const sv = (d, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICO = {
  phone: (s) => sv(`<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>`, s),
  wa: (s = 18) => `<svg viewBox="0 0 32 32" width="${s}" height="${s}" fill="currentColor"><path d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.5 2 7.8L0 32l8.5-2A16 16 0 1 0 16 0zm7.3 19.3c-.4-.2-2.4-1.2-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.3 1.6-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-1.2-1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7l-1.2-3c-.3-.8-.7-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.3s1.4 3.9 1.6 4.1c.2.3 2.8 4.3 6.8 6 1 .4 1.7.7 2.3.8 1 .3 1.8.3 2.5.2.8-.1 2.4-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5z"/></svg>`,
  home: () => sv(`<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>`),
  building: () => sv(`<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>`),
  truck: () => sv(`<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.6a1 1 0 0 0-.2-.6l-3.5-4.4A1 1 0 0 0 17.5 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>`),
  hammer: () => sv(`<path d="m15 12-8.4 8.4a2.1 2.1 0 1 1-3-3L12 9"/><path d="M17.6 15 22 10.6M20.9 11.7l-1.3-1.3c-.6-.6-.9-1.4-.9-2.2V7l-2.3-2.3a5.5 5.5 0 0 0-3.9-1.6H9l.9.8a6.5 6.5 0 0 1 2.1 4.8v1.6l2 2h1.3c.8 0 1.5.3 2.1.8l1.2 1.3"/>`),
  users: () => sv(`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>`),
  snow: () => sv(`<path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>`),
  fridge: () => sv(`<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14M9 5v2M9 13v3"/>`),
  wrench: () => sv(`<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>`),
  spark: () => sv(`<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/>`),
  check: () => sv(`<path d="M20 6 9 17l-5-5"/>`, 16),
  arrow: () => sv(`<path d="M5 12h14M13 6l6 6-6 6"/>`, 16),
  pin: () => sv(`<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>`),
};

// Shared CSS (scoped .bs-). Logical properties so RTL pages mirror cleanly.
const CSS = `
.bs-wrap{max-width:78rem;margin:0 auto;padding:0 24px}
.bs-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:14px 22px;border-radius:12px;font-weight:800;font-size:1rem;text-decoration:none;line-height:1;transition:transform .15s,box-shadow .15s,background .15s;white-space:nowrap}
.bs-btn:hover{transform:translateY(-2px)}
.bs-call{background:${MAROON};color:#fff!important;box-shadow:0 12px 26px -12px rgba(138,21,56,.8)}.bs-call:hover{background:${DEEP}}
.bs-wa{background:${WA_GREEN};color:#fff!important;box-shadow:0 12px 26px -12px rgba(31,175,87,.7)}.bs-wa:hover{background:#178f47}
.bs-ghost{background:#fff;color:${MAROON}!important;border:1.5px solid ${LINE}}.bs-ghost:hover{border-color:${MAROON}}
.bs-head{max-width:46rem;margin:0 auto 44px;text-align:center}
.bs-eye{display:inline-block;font-size:.78rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:${MAROON};margin-bottom:10px}
.bs-head h2,.bs-h2{font-weight:900;font-size:clamp(1.8rem,3.2vw,2.6rem);line-height:1.15;color:${INK};margin:0}
.bs-lede{margin-top:12px;color:${MUTED};font-size:1.05rem;line-height:1.65}
.bs-sec{padding:88px 0}
.bs-bigphone{display:inline-flex;align-items:center;gap:14px;text-decoration:none;color:${MAROON}!important}
.bs-bigphone .bs-ring{width:62px;height:62px;border-radius:50%;background:${MAROON};color:#fff;display:grid;place-items:center;flex:none;box-shadow:0 0 0 8px rgba(138,21,56,.12);animation:bsPulse 2s infinite}
.bs-bigphone small{display:block;font-size:.82rem;font-weight:700;color:${MUTED};letter-spacing:.04em;text-transform:uppercase}
.bs-bigphone b{display:block;font-size:clamp(2rem,4.4vw,3.1rem);font-weight:900;line-height:1.05;letter-spacing:.01em}
@keyframes bsPulse{0%,100%{box-shadow:0 0 0 0 rgba(138,21,56,.35)}50%{box-shadow:0 0 0 12px rgba(138,21,56,0)}}
@media(max-width:640px){.bs-sec{padding:64px 0}.bs-wrap{padding:0 16px}.bs-btn{padding:13px 16px;font-size:.95rem}}
`;

// ─── sections ───────────────────────────────────────────────────────────────
function callStrip(L) {
  return html("strip", `<div class="bs-strip" dir="${L.dir}"><div class="bs-wrap bs-strip-in">
  <span class="bs-strip-t">${L.strip[0]}</span>
  <a href="${TEL}" class="bs-strip-p">${ICO.phone(20)}<span>${L.strip[1]}:</span> <b>${ph(L)}</b></a>
</div></div>`, `${CSS}
.bs-strip{background:${MAROON};color:#fff;position:relative;overflow:hidden}
.bs-strip-in{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-top:10px;padding-bottom:10px}
.bs-strip-t{font-weight:600;font-size:.92rem;opacity:.92}
.bs-strip-p{display:inline-flex;align-items:center;gap:8px;color:#fff!important;text-decoration:none;font-weight:700;font-size:1rem}
.bs-strip-p b{font-size:1.45rem;font-weight:900;letter-spacing:.02em}
@media(max-width:760px){.bs-strip-t{display:none}.bs-strip-in{justify-content:center}.bs-strip-p b{font-size:1.3rem}}`, MAROON);
}

function heroHome(L) {
  const h = L.hero;
  return html("hero", `<section class="bs-hero" dir="${L.dir}"><div class="bs-wrap bs-hero-g">
  <div class="bs-hero-copy">
    <span class="bs-pill">${ICO.pin()} ${h.pill}</span>
    <h1><span>${h.title[0]}</span><em>${h.title[1]}</em></h1>
    <p>${h.desc}</p>
    <a class="bs-bigphone" href="${TEL}"><span class="bs-ring">${ICO.phone(28)}</span><span><small>${h.phoneLabel}</small><b>${ph(L)}</b></span></a>
    <div class="bs-hero-cta"><a class="bs-btn bs-call" href="${TEL}">${ICO.phone(18)} ${L.call}</a><a class="bs-btn bs-wa" href="${L.wa}">${ICO.wa()} ${L.whatsapp}</a></div>
    <ul class="bs-ticks">${h.ticks.map((t) => `<li>${ICO.check()}${t}</li>`).join("")}</ul>
  </div>
  <div class="bs-hero-art">
    <div class="bs-hero-a"><img src="${img("van", 1100)}" alt="${L.nav.moving}"/><span>${L.pillars.moving.tag}</span></div>
    <div class="bs-hero-b"><img src="${img("acShop", 800)}" alt="${L.nav.buysell}"/><span>${L.pillars.buysell.tag}</span></div>
      </div>
</div></section>`, `${CSS}
.bs-hero{background:linear-gradient(180deg,${CREAM},#fff);padding:64px 0 88px;overflow:hidden}
.bs-hero-g{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center}
.bs-pill{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid ${LINE};color:${MAROON};font-weight:700;font-size:.88rem;padding:8px 16px;border-radius:999px}
.bs-hero h1{font-weight:900;font-size:clamp(2.5rem,5.4vw,4.4rem);line-height:1.04;color:${INK};margin:20px 0 18px}
.bs-hero h1 span,.bs-hero h1 em{display:block}.bs-hero h1 em{font-style:normal;color:${MAROON}}
.bs-hero p{font-size:1.12rem;line-height:1.7;color:${MUTED};max-width:34rem;margin:0 0 26px}
.bs-hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin:26px 0 22px}
.bs-ticks{display:flex;flex-wrap:wrap;gap:10px 22px;list-style:none;padding:0;margin:0}
.bs-ticks li{display:flex;align-items:center;gap:7px;font-weight:700;color:${INK};font-size:.95rem}.bs-ticks svg{color:${MAROON}}
.bs-hero-art{position:relative;min-height:520px}
.bs-hero-art img{width:100%;height:100%;object-fit:cover;display:block}
.bs-hero-a,.bs-hero-b{position:absolute;border-radius:22px;overflow:hidden;box-shadow:0 30px 60px -28px rgba(43,7,18,.55)}
.bs-hero-a{inset-inline-start:0;top:0;width:78%;height:72%}
.bs-hero-b{inset-inline-end:0;bottom:0;width:58%;height:50%;border:6px solid #fff}
.bs-hero-a span,.bs-hero-b span{position:absolute;inset-inline-start:14px;bottom:14px;background:#fff;color:${MAROON};font-weight:800;font-size:.85rem;padding:7px 13px;border-radius:999px}
.bs-flag{position:absolute;inset-inline-end:6%;top:6%;width:84px;height:84px;border-radius:18px;background:${MAROON};box-shadow:inset 26px 0 0 #fff,0 16px 30px -14px rgba(43,7,18,.6)}
@media(max-width:960px){.bs-hero-g{grid-template-columns:1fr;gap:40px}.bs-hero-art{min-height:380px}.bs-flag{display:none}}
@media(max-width:640px){.bs-hero{padding:40px 0 56px}.bs-hero-art{min-height:300px}}`, CREAM);
}

function pillars(L) {
  const p = L.pillars;
  const card = (k, d, imgKey) => `<article class="bs-pil">
    <div class="bs-pil-img"><img src="${img(imgKey, 1000)}" alt="${d.tag}"/><span>${d.tag}</span></div>
    <div class="bs-pil-body">
      <h3>${d.title}</h3>
      <ul>${d.list.map((t) => `<li>${ICO.check()}${t}</li>`).join("")}</ul>
      <div class="bs-pil-cta"><a class="bs-btn bs-call" href="${TEL}">${ICO.phone(18)} ${L.call}</a><a class="bs-btn bs-wa" href="${L.waFor(d.tag)}">${ICO.wa()} ${L.whatsapp}</a><a class="bs-pil-more" href="${pagePath(L, k)}">${L.learn} ${ICO.arrow()}</a></div>
    </div>
  </article>`;
  return html("pillars", `<section class="bs-sec" dir="${L.dir}"><div class="bs-wrap">
  <div class="bs-head"><span class="bs-eye">${p.eyebrow}</span><h2>${p.title}</h2></div>
  <div class="bs-pil-g">${card("moving", p.moving, "crew")}${card("buysell", p.buysell, "acRoof")}</div>
</div></section>`, `${CSS}
.bs-pil-g{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.bs-pil{background:#fff;border:1px solid ${LINE};border-radius:24px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 50px -36px rgba(43,7,18,.5)}
.bs-pil-img{position:relative;height:300px}.bs-pil-img img{width:100%;height:100%;object-fit:cover;display:block}
.bs-pil-img span{position:absolute;inset-inline-start:18px;top:18px;background:${MAROON};color:#fff;font-weight:800;padding:8px 14px;border-radius:999px;font-size:.9rem}
.bs-pil-body{padding:28px 28px 30px;display:flex;flex-direction:column;flex:1}
.bs-pil h3{font-size:1.5rem;font-weight:900;color:${INK};line-height:1.25;margin:0 0 16px}
.bs-pil ul{list-style:none;padding:0;margin:0 0 24px;display:grid;grid-template-columns:1fr 1fr;gap:10px 16px}
.bs-pil li{display:flex;gap:8px;align-items:flex-start;color:${INK};font-weight:600;font-size:.97rem}.bs-pil li svg{color:${MAROON};flex:none;margin-top:3px}
.bs-pil-cta{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:auto}
.bs-pil-more{display:inline-flex;align-items:center;gap:6px;color:${MAROON}!important;font-weight:800;text-decoration:none;margin-inline-start:6px}
[dir=rtl] .bs-pil-more svg,[dir=rtl] .bs-arrow svg{transform:scaleX(-1)}
@media(max-width:900px){.bs-pil-g{grid-template-columns:1fr}}
@media(max-width:520px){.bs-pil ul{grid-template-columns:1fr}.bs-pil-body{padding:22px}}`, PAPER);
}

// Service cards: image, icon, title, desc, Call + WhatsApp.
function serviceCards(L, list, { eyebrow, title, lede, bg = CREAM, cols = 3 }) {
  const card = (s) => `<article class="bs-card">
    <div class="bs-card-img"><img src="${img(s.img, 800)}" alt="${svcName(L, s)}" loading="lazy"/><span class="bs-card-ic">${ICO[s.icon]()}</span></div>
    <div class="bs-card-b"><h3>${svcName(L, s)}</h3><p>${svcDesc(L, s)}</p>
      <div class="bs-card-cta"><a class="bs-btn bs-call" href="${TEL}">${ICO.phone(17)} ${L.callShort}</a><a class="bs-btn bs-wa" href="${L.waFor(svcName(L, s))}">${ICO.wa(17)} ${L.whatsapp}</a></div>
    </div></article>`;
  return html("cards", `<section class="bs-sec" dir="${L.dir}"><div class="bs-wrap">
  ${title ? `<div class="bs-head">${eyebrow ? `<span class="bs-eye">${eyebrow}</span>` : ""}<h2>${title}</h2>${lede ? `<p class="bs-lede">${lede}</p>` : ""}</div>` : ""}
  <div class="bs-cards bs-c${cols}">${list.map(card).join("")}</div>
</div></section>`, `${CSS}
.bs-cards{display:flex;flex-wrap:wrap;justify-content:center;gap:24px}.bs-card{width:calc((100% - 48px)/3)}.bs-c2 .bs-card{width:calc((100% - 24px)/2)}.bs-c4 .bs-card{width:calc((100% - 72px)/4)}
.bs-card{background:#fff;border:1px solid ${LINE};border-radius:20px;overflow:hidden;display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s}
.bs-card:hover{transform:translateY(-4px);box-shadow:0 26px 50px -30px rgba(43,7,18,.5)}
.bs-card-img{position:relative;height:210px}.bs-card-img img{width:100%;height:100%;object-fit:cover;display:block}
.bs-card-ic{position:absolute;inset-inline-start:18px;bottom:-24px;width:52px;height:52px;border-radius:14px;background:${MAROON};color:#fff;display:grid;place-items:center;border:4px solid #fff}
.bs-card-b{padding:36px 22px 22px;display:flex;flex-direction:column;flex:1}
.bs-card h3{font-size:1.2rem;font-weight:900;color:${INK};margin:0 0 8px}
.bs-card p{color:${MUTED};line-height:1.6;font-size:.96rem;margin:0 0 18px}
.bs-card-cta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto}.bs-card-cta .bs-btn{padding:12px 10px}
@media(max-width:1000px){.bs-cards .bs-card{width:calc((100% - 24px)/2)}}
@media(max-width:620px){.bs-cards .bs-card{width:100%}}`, bg);
}

function stepsBand(L, items, { eyebrow, title, bg = PAPER }) {
  return html("steps", `<section class="bs-sec" dir="${L.dir}"><div class="bs-wrap">
  <div class="bs-head"><span class="bs-eye">${eyebrow}</span><h2>${title}</h2></div>
  <ol class="bs-steps">${items.map(([t, d], i) => `<li><span class="bs-num">${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol>
</div></section>`, `${CSS}
.bs-steps{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;counter-reset:s;position:relative}
.bs-steps li{position:relative;background:#fff;border:1px solid ${LINE};border-radius:20px;padding:30px 26px}
.bs-num{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:${MAROON};color:#fff;font-weight:900;font-size:1.35rem;margin-bottom:16px;box-shadow:0 0 0 7px rgba(138,21,56,.1)}
.bs-steps h3{font-size:1.18rem;font-weight:900;color:${INK};margin:0 0 8px}.bs-steps p{color:${MUTED};line-height:1.6;margin:0}
@media(max-width:860px){.bs-steps{grid-template-columns:1fr}}`, bg);
}

function nativeSteps(L, bg = PAPER) {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg),
    data: {
      title: L.steps.title, subtitle: L.steps.eyebrow, layout: "horizontal", style: "connected",
      items: L.steps.items.map(([title, description], i) => ({ id: uid("s"), step: `0${i + 1}`, title, description })),
    },
  };
}

function whyGrid(L, bg = CREAM) {
  const icons = ["Users", "ShieldCheck", "BadgeCheck", "Zap"];
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    templateVariant: "outlined-cards",
    data: {
      title: L.why.title, subtitle: L.why.eyebrow, columns: 4, iconSize: "md",
      items: L.why.items.map(([label, description], i) => ({ id: uid("i"), icon: icons[i], color: MAROON, label, description })),
    },
  };
}

function nativeGallery(L, title, keys, bg = PAPER) {
  return {
    ...BASE, id: uid("gal"), type: "gallery", background: bgColor(bg),
    data: {
      title, subtitle: "", layout: "grid", columns: 3, gap: "md", lightbox: true,
      images: keys.map((k) => ({ id: uid("gi"), url: img(k, 1000), alt: title, caption: "" })),
    },
  };
}

function whyBand(L) {
  const w = L.why;
  return html("why", `<section class="bs-why" dir="${L.dir}"><div class="bs-wrap bs-why-g">
  <div class="bs-why-l"><span class="bs-eye">${w.eyebrow}</span><h2 class="bs-h2">${w.title}</h2>
    <a class="bs-bigphone" href="${TEL}"><span class="bs-ring">${ICO.phone(28)}</span><span><small>${L.callUs}</small><b>${ph(L)}</b></span></a></div>
  <div class="bs-why-r">${w.items.map(([t, d], i) => `<div class="bs-why-i"><span>0${i + 1}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
</div></section>`, `${CSS}
.bs-why{background:${DARK};padding:92px 0;position:relative;overflow:hidden}
.bs-why:before{content:"";position:absolute;inset-block:0;inset-inline-start:0;width:46px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='46' height='46'%3E%3Cpath d='M0 0H28L46 23L28 46H0Z' fill='%23fff'/%3E%3C/svg%3E") repeat-y 0 0/46px 46px}
[dir=rtl].bs-why:before{transform:scaleX(-1)}
.bs-why-g{display:grid;grid-template-columns:.9fr 1.3fr;gap:56px;align-items:center;padding-inline-start:72px}
.bs-why .bs-eye{color:#F2B8C6}.bs-why .bs-h2{color:#fff;margin-bottom:30px}
.bs-why .bs-bigphone{color:#fff!important}.bs-why .bs-bigphone small{color:#E7C5CE}.bs-why .bs-ring{background:#fff;color:${MAROON}}
.bs-why-r{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.bs-why-i{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:24px}
.bs-why-i span{font-weight:900;color:#F2B8C6;font-size:.95rem}.bs-why-i h3{color:#fff;font-weight:900;font-size:1.15rem;margin:8px 0 6px}.bs-why-i p{color:#D9C2C8;line-height:1.6;margin:0}
@media(max-width:900px){.bs-why-g{grid-template-columns:1fr;padding-inline-start:40px}.bs-why:before{width:28px}}
@media(max-width:560px){.bs-why-r{grid-template-columns:1fr}.bs-why{padding:64px 0}}`, DARK);
}

function bigCall(L) {
  return html("bigcall", `<section class="bs-big" dir="${L.dir}"><div class="bs-wrap bs-big-in">
  <div><h2>${L.bigCta.title}</h2><p>${L.bigCta.desc}</p></div>
  <div class="bs-big-r">
    <a class="bs-big-num" href="${TEL}">${ICO.phone(34)}<bdi dir="ltr">${PHONE_DISPLAY}</bdi></a>
    <div class="bs-big-btns"><a class="bs-btn bs-white" href="${TEL}">${ICO.phone(18)} ${L.call}</a><a class="bs-btn bs-wa" href="${L.wa}">${ICO.wa()} ${L.whatsapp}</a></div>
  </div>
</div></section>`, `${CSS}
.bs-big{background:linear-gradient(120deg,${MAROON},${DEEP});padding:72px 0;position:relative;overflow:hidden}
.bs-big:after{content:"";position:absolute;inset-inline-end:-80px;top:-80px;width:320px;height:320px;border-radius:50%;background:rgba(255,255,255,.06)}
.bs-big-in{display:grid;grid-template-columns:1fr auto;gap:40px;align-items:center;position:relative;z-index:1}
.bs-big h2{color:#fff;font-weight:900;font-size:clamp(1.7rem,3vw,2.4rem);margin:0 0 10px;line-height:1.2}.bs-big p{color:#F1D6DD;font-size:1.08rem;margin:0}
.bs-big-r{text-align:center}
.bs-big-num{display:inline-flex;align-items:center;gap:14px;color:#fff!important;text-decoration:none;font-weight:900;font-size:clamp(2.1rem,4.8vw,3.4rem);letter-spacing:.01em;margin-bottom:16px}
.bs-big-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.bs-white{background:#fff;color:${MAROON}!important}
@media(max-width:860px){.bs-big-in{grid-template-columns:1fr;text-align:center}}`, MAROON);
}

function innerHero(L, { crumb, title, desc, imgKey }) {
  return html("ihero", `<section class="bs-ih" dir="${L.dir}" style="--bg:url('${img(imgKey, 1800)}')"><div class="bs-wrap">
  <nav class="bs-crumb"><a href="${pagePath(L, "home")}">${L.nav.home}</a><span>/</span><b>${crumb}</b></nav>
  <h1>${title}</h1><p>${desc}</p>
  <div class="bs-ih-cta"><a class="bs-btn bs-call" href="${TEL}">${ICO.phone(18)} ${L.call} <bdi dir="ltr">${PHONE_LOCAL}</bdi></a><a class="bs-btn bs-wa" href="${L.wa}">${ICO.wa()} ${L.whatsapp}</a></div>
</div></section>`, `${CSS}
.bs-ih{background:linear-gradient(90deg,rgba(43,7,18,.92),rgba(94,14,38,.72)),var(--bg) center/cover;padding:96px 0 88px;color:#fff}
[dir=rtl].bs-ih{background:linear-gradient(270deg,rgba(43,7,18,.92),rgba(94,14,38,.72)),var(--bg) center/cover}
.bs-crumb{display:flex;gap:8px;font-size:.9rem;color:#E9C9D2;margin-bottom:16px}.bs-crumb a{color:#E9C9D2!important;text-decoration:none}.bs-crumb b{color:#fff}
.bs-ih h1{font-weight:900;font-size:clamp(2.2rem,4.6vw,3.6rem);line-height:1.1;margin:0 0 14px;max-width:46rem;color:#fff}
.bs-ih p{font-size:1.12rem;line-height:1.65;color:#F1DDE2;max-width:40rem;margin:0 0 28px}
.bs-ih-cta{display:flex;flex-wrap:wrap;gap:12px}.bs-ih .bs-call{background:#fff;color:${MAROON}!important}
@media(max-width:640px){.bs-ih{padding:64px 0 56px}}`, DARK);
}

// Intro split with sticky call card (focus pages).
function introWithCard(L, { title, body, imgKey, card }) {
  return html("intro", `<section class="bs-sec" dir="${L.dir}"><div class="bs-wrap bs-int">
  <div class="bs-int-l"><h2 class="bs-h2">${title}</h2><p class="bs-lede">${body}</p><img src="${img(imgKey, 1200)}" alt="${title}"/></div>
  <aside class="bs-qc"><h3>${card.title}</h3><p>${card.desc}</p>
    <a class="bs-qc-num" href="${TEL}">${ICO.phone(24)}<bdi dir="ltr">${PHONE_DISPLAY}</bdi></a>
    <a class="bs-btn bs-call" href="${TEL}">${ICO.phone(18)} ${L.call}</a><a class="bs-btn bs-wa" href="${L.wa}">${ICO.wa()} ${L.whatsapp}</a>
  </aside>
</div></section>`, `${CSS}
.bs-int{display:grid;grid-template-columns:1.5fr 1fr;gap:48px;align-items:start}
.bs-int-l img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:20px;margin-top:28px;display:block}
.bs-qc{position:sticky;top:110px;background:${CREAM};border:1px solid ${LINE};border-top:6px solid ${MAROON};border-radius:20px;padding:30px;display:flex;flex-direction:column;gap:12px}
.bs-qc h3{font-size:1.35rem;font-weight:900;color:${INK};margin:0}.bs-qc p{color:${MUTED};line-height:1.6;margin:0 0 6px}
.bs-qc-num{display:flex;align-items:center;gap:10px;color:${MAROON}!important;font-weight:900;font-size:1.9rem;text-decoration:none;margin-bottom:6px}
@media(max-width:900px){.bs-int{grid-template-columns:1fr}.bs-qc{position:static}}`, PAPER);
}

function includesGrid(L, title, items, bg = CREAM) {
  return html("incl", `<section class="bs-sec" dir="${L.dir}"><div class="bs-wrap">
  <div class="bs-head"><h2>${title}</h2></div>
  <div class="bs-inc">${items.map(([t, d]) => `<div><span>${ICO.check()}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
</div></section>`, `${CSS}
.bs-inc{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.bs-inc div{background:#fff;border:1px solid ${LINE};border-radius:18px;padding:24px}
.bs-inc span{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:rgba(138,21,56,.1);color:${MAROON};margin-bottom:12px}
.bs-inc h3{font-weight:900;font-size:1.1rem;color:${INK};margin:0 0 6px}.bs-inc p{color:${MUTED};line-height:1.6;margin:0}
@media(max-width:900px){.bs-inc{grid-template-columns:1fr 1fr}}@media(max-width:560px){.bs-inc{grid-template-columns:1fr}}`, bg);
}

function buySellSplit(L) {
  const b = L.buyPage;
  const col = (cls, t, d, list, imgKey, wa) => `<div class="bs-bs ${cls}"><img src="${img(imgKey, 900)}" alt="${t}"/><div class="bs-bs-b">
    <h3>${t}</h3><p>${d}</p><ul>${list.map((x) => `<li>${ICO.check()}${x}</li>`).join("")}</ul>
    <div class="bs-bs-cta"><a class="bs-btn bs-call" href="${TEL}">${ICO.phone(18)} ${L.call}</a><a class="bs-btn bs-wa" href="${wa}">${ICO.wa()} ${L.whatsapp}</a></div></div></div>`;
  return html("bsplit", `<section class="bs-sec" dir="${L.dir}"><div class="bs-wrap bs-bsg">
  ${col("bs-buy", b.buyTitle, b.buyDesc, b.buyList, "acPanel", L.waFor(L.lang ? "بيع مكيف أو ثلاجة قديمة" : "selling my old AC / fridge"))}
  ${col("bs-sell", b.sellTitle, b.sellDesc, b.sellList, "kitchen", L.waFor(L.lang ? "شراء مكيف أو ثلاجة مستعملة" : "buying a used AC / fridge"))}
</div></section>`, `${CSS}
.bs-bsg{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.bs-bs{border-radius:24px;overflow:hidden;border:1px solid ${LINE};background:#fff;display:flex;flex-direction:column}
.bs-bs img{width:100%;aspect-ratio:16/8;object-fit:cover;display:block}
.bs-bs-b{padding:28px;display:flex;flex-direction:column;flex:1}
.bs-bs h3{font-size:2rem;font-weight:900;margin:0 0 8px;color:${MAROON}}.bs-sell h3{color:${INK}}
.bs-bs p{color:${MUTED};line-height:1.65;margin:0 0 16px}
.bs-bs ul{list-style:none;padding:0;margin:0 0 22px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.bs-bs li{display:flex;gap:8px;font-weight:700;color:${INK}}.bs-bs li svg{color:${MAROON};flex:none;margin-top:3px}
.bs-bs-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:auto}
.bs-buy{border-top:6px solid ${MAROON}}.bs-sell{border-top:6px solid ${INK}}
@media(max-width:900px){.bs-bsg{grid-template-columns:1fr}}@media(max-width:480px){.bs-bs ul{grid-template-columns:1fr}}`, PAPER);
}

function photoStrip(L, title, keys, bg = PAPER) {
  return html("gal", `<section class="bs-sec" dir="${L.dir}"><div class="bs-wrap">
  <div class="bs-head"><h2>${title}</h2></div>
  <div class="bs-gal">${keys.map((k, i) => `<figure class="g${i}"><img src="${img(k, 900)}" alt="${title}" loading="lazy"/></figure>`).join("")}</div>
</div></section>`, `${CSS}
.bs-gal{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:200px;gap:14px}
.bs-gal figure{margin:0;border-radius:16px;overflow:hidden}.bs-gal img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}.bs-gal figure:hover img{transform:scale(1.05)}
.bs-gal .g0{grid-column:span 2;grid-row:span 2}
@media(max-width:760px){.bs-gal{grid-template-columns:1fr 1fr;grid-auto-rows:150px}}`, bg);
}

function aboutStory(L) {
  const a = L.aboutPage;
  return html("story", `<section class="bs-sec" dir="${L.dir}"><div class="bs-wrap bs-st">
  <div class="bs-st-img"><img src="${img("mover", 1000)}" alt="${a.storyTitle}"/><div class="bs-st-badge"><b>${L.lang ? OWNER_AR : OWNER}</b><span>${L.lang ? ADDRESS_AR : ADDRESS}</span></div></div>
  <div><span class="bs-eye">${a.crumb}</span><h2 class="bs-h2">${a.storyTitle}</h2>
    ${a.story.split("\n\n").map((p) => `<p class="bs-lede">${p}</p>`).join("")}
    <div class="bs-vals">${a.values.map(([t, d]) => `<div><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
    <a class="bs-bigphone" href="${TEL}"><span class="bs-ring">${ICO.phone(28)}</span><span><small>${L.callUs}</small><b>${ph(L)}</b></span></a>
  </div>
</div></section>`, `${CSS}
.bs-st{display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:center}
.bs-st-img{position:relative}.bs-st-img img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:24px;display:block}
.bs-st-badge{position:absolute;inset-inline-end:-18px;bottom:28px;background:${MAROON};color:#fff;padding:16px 20px;border-radius:16px;box-shadow:0 20px 40px -20px rgba(43,7,18,.7)}
.bs-st-badge b{display:block;font-size:1.05rem}.bs-st-badge span{font-size:.88rem;opacity:.85}
.bs-vals{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:26px 0 30px}
.bs-vals div{border-inline-start:4px solid ${MAROON};background:${CREAM};border-radius:12px;padding:14px 16px}
.bs-vals h3{font-weight:900;font-size:1rem;color:${INK};margin:0 0 4px}.bs-vals p{color:${MUTED};font-size:.92rem;line-height:1.5;margin:0}
@media(max-width:900px){.bs-st{grid-template-columns:1fr}.bs-st-badge{inset-inline-end:12px}.bs-vals{grid-template-columns:1fr}}`, PAPER);
}

function contactCards(L) {
  const c = L.contactPage;
  return html("ccards", `<section class="bs-sec" dir="${L.dir}"><div class="bs-wrap">
  <a class="bs-cc-call" href="${TEL}"><span class="bs-ring">${ICO.phone(34)}</span><span><small>${c.callCard}</small><b><bdi dir="ltr">${PHONE_DISPLAY}</bdi></b></span><em class="bs-btn bs-white">${L.call}</em></a>
  <div class="bs-cc-g">
    <a class="bs-cc" href="${L.wa}"><span class="bs-cc-ic bs-cc-wa">${ICO.wa(24)}</span><h3>${c.waCard}</h3><p><bdi dir="ltr">${PHONE_DISPLAY}</bdi><br/>${c.waDesc}</p></a>
    <a class="bs-cc" href="${MAP_LINK}"><span class="bs-cc-ic">${ICO.pin()}</span><h3>${c.locCard}</h3><p>${c.locDesc}</p></a>
  </div>
</div></section>`, `${CSS}
.bs-cc-call{display:flex;align-items:center;gap:22px;flex-wrap:wrap;background:linear-gradient(120deg,${MAROON},${DEEP});color:#fff!important;text-decoration:none;border-radius:24px;padding:34px 36px;margin-bottom:22px}
.bs-cc-call .bs-ring{width:76px;height:76px;border-radius:50%;background:#fff;color:${MAROON};display:grid;place-items:center;flex:none;animation:bsPulse 2s infinite}
.bs-cc-call small{display:block;font-weight:700;color:#F1D6DD;text-transform:uppercase;letter-spacing:.06em;font-size:.85rem}
.bs-cc-call b{display:block;font-size:clamp(2.2rem,5.4vw,3.8rem);font-weight:900;line-height:1.05}
.bs-cc-call em{font-style:normal;margin-inline-start:auto}.bs-white{background:#fff;color:${MAROON}!important}
.bs-cc-g{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.bs-cc{display:block;background:#fff;border:1px solid ${LINE};border-radius:20px;padding:26px;text-decoration:none;transition:border-color .2s}.bs-cc:hover{border-color:${MAROON}}
.bs-cc-ic{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;background:${MAROON};color:#fff;margin-bottom:12px}.bs-cc-wa{background:${WA_GREEN}}
.bs-cc h3{font-weight:900;color:${INK};margin:0 0 6px;font-size:1.2rem}.bs-cc p{color:${MUTED};margin:0;line-height:1.6}
@media(max-width:700px){.bs-cc-g{grid-template-columns:1fr}.bs-cc-call{padding:26px 22px}.bs-cc-call em{margin-inline-start:0;width:100%}}`, CREAM);
}

function faq(L, items, bg = PAPER) {
  return {
    ...BASE, id: uid("faq"), type: "faq", background: bgColor(bg),
    templateVariant: "accordion-bordered",
    data: { title: L.faqTitle, subtitle: "", layout: "accordion", allowMultiple: false, items: items.map(([question, answer]) => ({ id: uid("f"), question, answer })) },
  };
}

function contactForm(L, bg = PAPER) {
  const c = L.contactPage;
  const [fName, fPhone, fNeed, fMsg] = c.fields;
  return {
    ...BASE, id: uid("contact"), type: "contact", background: bgColor(bg),
    data: {
      title: c.formTitle, subtitle: c.formSub, layout: "split",
      showMap: true, mapEmbedUrl: MAP_EMBED, showContactInfo: true,
      phone: phoneTxt(L), email: "", address: L.lang ? ADDRESS_AR : ADDRESS, recipientEmail: "",
      fields: [
        { id: "f-name", label: fName, type: "text", required: true },
        { id: "f-phone", label: fPhone, type: "tel", required: true },
        { id: "f-need", label: fNeed, type: "select", required: false, options: c.options },
        { id: "f-msg", label: fMsg, type: "textarea", required: false },
      ],
      submitLabel: c.submit, successMessage: c.success,
    },
  };
}

// ─── chrome ─────────────────────────────────────────────────────────────────
function navItems(L) {
  const other = L.lang ? T.en : T.ar;
  return [
    ...PAGES.map((k, i) => ({ id: `n${i}`, label: L.nav[k], url: pagePath(L, k), children: [] })),
    { id: "nlang", label: L.nav.switchLabel, url: pagePath(other, "home"), children: [] },
  ];
}

function header(L) {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor(PAPER),
    templateVariant: "solid-with-cta",
    data: {
      logoText: L.siteName, logo: LOGO, items: navItems(L),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: PAPER, textColor: INK, colorMode: "legacy", activeColor: MAROON, ctaVariant: "solid", logoHeight: 50, logoCaption: "",
      showCta: true, ctaLabel: `${L.callShort} ⁦${PHONE_LOCAL}⁩`, ctaUrl: TEL,
    },
  };
}

function footer(L) {
  return {
    id: uid("footer"), type: "footer", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      logo: LOGO_LIGHT, logoText: L.siteName, tagline: L.footer.tagline, logoCaption: "",
      style: "dark", backgroundColor: DARK, accentColor: "#F2B8C6", textColor: "#D9C2C8",
      copyrightText: L.footer.copyright, copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: L.wa }],
      columns: [
        { id: uid("fc"), heading: L.footer.pages, links: PAGES.map((k) => ({ id: uid("fl"), label: L.nav[k], url: pagePath(L, k) })) },
        { id: uid("fc"), heading: L.footer.services, links: SERVICES.map((s) => ({ id: uid("fl"), label: svcName(L, s), url: pagePath(L, s.group === "move" ? "moving" : "buysell") })) },
        { id: uid("fc"), heading: L.footer.contact, links: [
          { id: uid("fl"), label: `${L.call}: ${phoneTxt(L)}`, url: TEL },
          { id: uid("fl"), label: `${L.whatsapp}: ${phoneTxt(L)}`, url: L.wa },
          { id: uid("fl"), label: L.lang ? ADDRESS_AR : ADDRESS, url: MAP_LINK },
          { id: uid("fl"), label: L.nav.switchLabel, url: pagePath(L.lang ? T.en : T.ar, "home") },
        ] },
      ],
      bottomLinks: [],
    },
  };
}

// ─── pages ──────────────────────────────────────────────────────────────────
const MOVE = SERVICES.filter((s) => s.group === "move");
const BUY = SERVICES.filter((s) => s.group === "buy");
// Home "other services": six cards (headline lines live in the pillars; AC servicing is on Buy Sell).
const OTHER = SERVICES.filter((s) => !["house", "usedac", "acservice"].includes(s.key));

function homePage(L) {
  return [
    callStrip(L),
    heroHome(L),
    pillars(L),
    serviceCards(L, OTHER, { eyebrow: L.other.eyebrow, title: L.other.title, lede: L.other.lede, bg: CREAM, cols: 3 }),
    nativeSteps(L, PAPER),
    whyGrid(L, CREAM),
    nativeGallery(L, L.aboutPage.galleryTitle, ["crew", "acFix", "van2", "carpenter", "boxes", "fridge"], PAPER),
    faq(L, [...L.faqMove.slice(0, 2), ...L.faqBuy.slice(0, 2)], CREAM),
    bigCall(L),
  ];
}

function movingPage(L) {
  const m = L.movingPage;
  return [
    callStrip(L),
    innerHero(L, { crumb: m.crumb, title: m.title, desc: m.desc, imgKey: "van" }),
    introWithCard(L, { title: m.introTitle, body: m.intro, imgKey: "boxes", card: m.card }),
    serviceCards(L, MOVE, { eyebrow: m.crumb, title: L.lang ? "خدمات النقل" : "Moving services", bg: CREAM, cols: 3 }),
    includesGrid(L, m.includesTitle, m.includes, PAPER),
    photoStrip(L, m.galleryTitle, ["crew", "sofaHall", "van", "tape", "doorway"], CREAM),
    faq(L, L.faqMove, PAPER),
    bigCall(L),
  ];
}

function buySellPage(L) {
  const b = L.buyPage;
  return [
    callStrip(L),
    innerHero(L, { crumb: b.crumb, title: b.title, desc: b.desc, imgKey: "acShop" }),
    buySellSplit(L),
    stepsBand(L, b.how, { eyebrow: b.crumb, title: b.howTitle, bg: CREAM }),
    serviceCards(L, BUY, { eyebrow: b.crumb, title: L.lang ? "خدمات المكيفات والثلاجات" : "AC & refrigerator services", bg: PAPER, cols: 4 }),
    faq(L, L.faqBuy, CREAM),
    bigCall(L),
  ];
}

function servicesPage(L) {
  const s = L.servicesPage;
  return [
    callStrip(L),
    innerHero(L, { crumb: s.crumb, title: s.title, desc: s.desc, imgKey: "kneel" }),
    serviceCards(L, MOVE, { eyebrow: L.pillars.moving.tag, title: L.pillars.moving.title, bg: PAPER, cols: 3 }),
    serviceCards(L, BUY, { eyebrow: L.pillars.buysell.tag, title: L.pillars.buysell.title, bg: CREAM, cols: 4 }),
    stepsBand(L, L.steps.items, { eyebrow: L.steps.eyebrow, title: L.steps.title, bg: PAPER }),
    bigCall(L),
  ];
}

function aboutPage(L) {
  const a = L.aboutPage;
  return [
    callStrip(L),
    innerHero(L, { crumb: a.crumb, title: a.title, desc: a.desc, imgKey: "crew" }),
    aboutStory(L),
    whyBand(L),
    photoStrip(L, a.galleryTitle, ["carry", "acFix", "van2", "carpenter", "boxes"], PAPER),
    bigCall(L),
  ];
}

function contactPage(L) {
  const c = L.contactPage;
  return [
    callStrip(L),
    innerHero(L, { crumb: c.crumb, title: c.title, desc: c.desc, imgKey: "doorway" }),
    contactCards(L),
    contactForm(L, PAPER),
  ];
}

const BUILDERS = { home: homePage, about: aboutPage, moving: movingPage, buysell: buySellPage, services: servicesPage, contact: contactPage };

// ─── write ──────────────────────────────────────────────────────────────────
async function ensureTenant() {
  const { data: existing } = await sb.from("tenants").select("id").eq("slug", SLUG).maybeSingle();
  if (existing) return existing.id;
  const expiresAt = new Date(Date.now() + DEMO_HOURS * 3600_000).toISOString();
  const { data, error } = await sb.from("tenants").insert({
    name: SITE_NAME, slug: SLUG, plan: PLAN, status: "onboarded",
    owner_id: OWNER_ID, onboarding_completed: true,
    demo_expires_at: expiresAt, demo_created_by: OWNER_ID, demo_whatsapp: WA_NUMBER,
  }).select("id").single();
  if (error) throw new Error(`tenant: ${error.message}`);
  const id = data.id;
  await sb.from("tenant_members").insert({ tenant_id: id, user_id: OWNER_ID, role: "owner" });
  await sb.from("subscriptions").upsert(
    { tenant_id: id, plan_id: PLAN, status: "onboarded", billing_cycle: "monthly", payment_method: "manual" },
    { onConflict: "tenant_id" },
  );
  await sb.from("contact_details").insert({
    tenant_id: id, label: "Main", phone: PHONE, whatsapp: WA_NUMBER, email: null,
    address: ADDRESS, is_primary: true, floating_whatsapp: true, floating_call: true, sort_order: 0,
  });
  console.log("✓ tenant created", id, "demo until", expiresAt);
  return id;
}

async function uploadAssets(tenantId) {
  const dir = path.join(__dirname, "..", "clients", "Buy Sell Moving Shifiting Qatar", "site-assets");
  const { data: existingMedia } = await sb.from("media").select("storage_path").eq("tenant_id", tenantId);
  const known = new Set((existingMedia ?? []).map((m) => m.storage_path));
  let n = 0;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.(jpg|png)$/.test(file)) continue;
    const buffer = fs.readFileSync(path.join(dir, file));
    const storagePath = `${STORAGE_DIR}/${file}`;
    const mime = file.endsWith(".png") ? "image/png" : "image/jpeg";
    const { error } = await sb.storage.from("media").upload(storagePath, buffer, { contentType: mime, upsert: true, cacheControl: "3600" });
    if (error) { console.log(`✗ upload ${file}: ${error.message}`); continue; }
    n++;
    if (!known.has(storagePath)) {
      await sb.from("media").insert({
        tenant_id: tenantId, name: file, original_name: file, mime_type: mime, size: buffer.length,
        url: asset(file), storage_path: storagePath, folder: "/", alt: file.replace(/\.(jpg|png)$/, "").replace(/-/g, " "),
      });
    }
  }
  console.log(`✓ assets uploaded: ${n}`);
}

async function run() {
  const { data: tpl } = await sb.from("templates").select("id, custom_css").eq("slug", TEMPLATE_SLUG).single();
  if (!tpl) throw new Error(`template ${TEMPLATE_SLUG} missing`);
  if (tpl.custom_css) console.log("! template has custom_css, check palette leaks");
  const tenantId = await ensureTenant();
  if (!process.argv.includes("--skip-assets")) await uploadAssets(tenantId);
  const now = new Date().toISOString();

  const pages = [];
  for (const L of [T.en, T.ar]) {
    for (const key of PAGES) {
      let blocks = BUILDERS[key](L);
      // Arabic pages carry their own chrome; English pages use the global one.
      if (L.lang) blocks = [header(L), ...blocks, footer(L)];
      const alternates = { en: pagePath(T.en, key), ar: pagePath(T.ar, key) };
      const [seoTitle, seoDesc] = L.seo[key];
      pages.push({ slug: pageSlug(L, key), title: L.nav[key], blocks, seo: { title: seoTitle, description: seoDesc, alternates, ...(L.lang ? { lang: L.lang } : {}) } });
    }
  }

  const keep = new Set(pages.map((p) => p.slug));
  const { data: existing } = await sb.from("pages").select("id, slug").eq("tenant_id", tenantId);
  for (const p of existing ?? []) if (!keep.has(p.slug)) await sb.from("pages").delete().eq("id", p.id);

  let i = 0;
  for (const { slug, title, blocks, seo } of pages) {
    blocks.forEach((b, k) => { b.order = k; });
    const row = { title, blocks, status: "published", type: "page", order_index: i++, updated_at: now, draft_blocks: null, seo };
    const found = (existing ?? []).find((p) => p.slug === slug);
    const { error } = found
      ? await sb.from("pages").update(row).eq("id", found.id)
      : await sb.from("pages").insert({ ...row, tenant_id: tenantId, slug, created_at: now });
    console.log(error ? `✗ ${slug}: ${error.message}` : `  ✓ ${slug}`);
  }

  const { error: idErr } = await sb.from("site_identity").upsert({
    tenant_id: tenantId,
    template_id: tpl.id, active_template_slug: TEMPLATE_SLUG,
    site_name: SITE_NAME, tagline: "Moving, Shifting & Used AC / Fridge Buy Sell in Doha",
    logo_url: LOGO, logo_dark_url: LOGO_LIGHT, logo_type: "image", logo_alt: SITE_NAME, logo_width: 300,
    favicon_url: FAVICON_URL,
    primary_color: MAROON, secondary_color: DEEP,
    color_overrides: {
      primary: MAROON, primaryFg: "#ffffff", secondary: DEEP, accent: "#F2B8C6", ring: MAROON,
      background: PAPER, foreground: INK, card: PAPER, muted: CREAM, mutedFg: MUTED,
      border: LINE, borderRadius: "0.75rem",
    },
    design_overrides: { headingFont: "Cairo", bodyFont: "Cairo", headingWeight: "800", roundness: "soft", shadow: "normal" },
    global_header: header(T.en), global_footer: footer(T.en), global_prefooter: [],
    updated_at: now,
  }, { onConflict: "tenant_id" });
  console.log(idErr ? `✗ site_identity: ${idErr.message}` : "✓ site_identity");

  await sb.from("nav_menus").upsert(
    { tenant_id: tenantId, name: "Main Navigation", location: "header", items: navItems(T.en), updated_at: now },
    { onConflict: "tenant_id,location" },
  );
  const { error: ssErr } = await sb.from("site_settings").upsert({
    tenant_id: tenantId, site_name: SITE_NAME, site_description: T.en.seo.home[1],
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Qatar", language: "en", maintenance_mode: false, site_theme: "light",
  }, { onConflict: "tenant_id" });
  if (ssErr) console.log("✗ site_settings:", ssErr.message);

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/  ·  Arabic: /ar`);
}

run().catch((e) => { console.error(e); process.exit(1); });
