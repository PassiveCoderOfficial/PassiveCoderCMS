/**
 * Bein Sports Riyadh — satellite TV shop, An Nasim Al Gharbi, Riyadh.
 * Basic-plan demo at beinriyadh.passivecoder.com. English first, with a full
 * Arabic copy under /ar (pages carry seo.lang = "ar", so they render RTL with
 * their own Arabic header/footer). Package prices are PLACEHOLDERS until the
 * client confirms them — edit the pricing blocks in the dashboard.
 * Reviews are real Google reviews (avatars mirrored to storage). Safe to re-run.
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const OWNER_ID = "2ec0befe-7aa8-4a89-acc4-b9fe9250bcf4"; // walibdpro — demo creator
const SLUG = "beinriyadh";
const PLAN = "basic";
const TEMPLATE_SLUG = "construction-classic";
const DEMO_HOURS = 24 * 7;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "Bein Sports Riyadh";
const SITE_NAME_AR = "بين سبورت الرياض";
const PHONE = "+966503469371";
const PHONE_DISPLAY = "+966 50 346 9371";
const WA_NUMBER = "966503469371";
const ADDRESS = "PRH9+GX An Nasim Al Gharbi, Riyadh 14231, Saudi Arabia";
const ADDRESS_AR = "النسيم الغربي، الرياض 14231، المملكة العربية السعودية";
const GMB_URL = "https://maps.app.goo.gl/jnjdX2LMXWXZdGyw8";
const MAP_EMBED = "https://maps.google.com/maps?q=24.7287728,46.8198856&z=17&output=embed";
const waText = (t) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;

const PURPLE = "#6A2C9E";
const PURPLE_DEEP = "#2A0E4A";
const PURPLE_DARK = "#1C0833";
const GOLD = "#FFC21A";
const LAVENDER = "#F6F1FB";

const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/media/uploads/beinriyadh`;
const LOGO_LIGHT = `${STORAGE}/logo-light.png`;
const LOGO_DARK = `${STORAGE}/logo-dark.png`;
const FAVICON_URL = `${STORAGE}/favicon.png`;

// Pexels (free for commercial use). Stand-ins until the client's own shop photos arrive.
const px = (id, w = 1600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const IMG = {
  stadium: px(30651230, 2000),
  stadium2: px(41257),
  stadiumAerial: px(9735384),
  stadiumDay: px(1884576),
  fans: px(23495569),
  fans2: px(23495488),
  fans3: px(23495483),
  dishes: px(11462618),
  dishBalcony: px(12625353),
  repair: px(31718639),
};

// ─── Real Google reviews (from the GMB, Sep 2026) ───────────────────────────
const REVIEWS = [
  { name: "Mohd Ashraf", when: "4 months ago", content: "Excellent service. Good price, always happy." },
  { name: "hamsa pa", when: "4 months ago", content: "Bein Sports Riyadh, this is the best shop in Riyadh city. Service really good, price is always good." },
  { name: "SaBWSO Smsm", when: "5 months ago", content: "Very good service, best shop in Riyadh." },
  { name: "Shahbaz Wanli", when: "6 months ago", content: "This shop really good." },
  { name: "rezaul karim", when: "4 months ago", content: "Best shop in Riyadh. Good service all the time." },
].map((r, i) => ({ ...r, avatar: `${STORAGE}/review-${i + 1}.jpg` }));

// ─── Copy ───────────────────────────────────────────────────────────────────
// Every string that appears on the site lives here, once per language.
const T = {
  en: {
    prefix: "",
    lang: null,
    siteName: SITE_NAME,
    wa: waText("Hello Bein Sports Riyadh, I would like to ask about beIN packages."),
    nav: { home: "Home", packages: "Packages", services: "Services", about: "About", faq: "FAQ", contact: "Contact", switchLabel: "العربية", cta: "WhatsApp Us" },
    call: `Call ${PHONE_DISPLAY}`,
    whatsapp: "Order on WhatsApp",
    open: "Open 24 hours",
    address: ADDRESS,
    hero: {
      badge: "Open 24 Hours · An Nasim Al Gharbi, Riyadh",
      title: "Every Match. Every League.\nLive on Your TV.",
      subtitle: SITE_NAME,
      description: "beIN subscriptions, 4K receivers, dish installation and renewals in Riyadh. Walk in any time, or send us a WhatsApp and we set it up for you.",
    },
    stats: [
      ["5.0★", "Google Rating", "Star"],
      ["236+", "Google Reviews", "MessageSquare"],
      ["24/7", "Open Every Day", "Clock"],
      ["Same Day", "Installation", "Zap"],
    ],
    services: {
      title: "Everything You Need to Watch", subtitle: "Our Services", link: "Learn More",
      items: [
        ["Tv", "beIN Subscriptions", "New subscriptions on every beIN package, activated on the spot."],
        ["RefreshCw", "Renewals & Upgrades", "Renew before the big match or move up to a bigger package in minutes."],
        ["Box", "4K Receivers", "Genuine beIN receivers, including 4K models, ready to plug in and watch."],
        ["Satellite", "Dish Installation", "Dish mounting and precise alignment for a clean, stable signal."],
        ["Settings", "Receiver Setup", "Channel scan, account pairing and TV setup done for you."],
        ["Wrench", "Repair & Troubleshooting", "No signal, frozen picture or error codes. We find the fault and fix it."],
      ],
    },
    about: {
      title: "Your Local beIN Shop in Riyadh",
      body: "Bein Sports Riyadh is a satellite TV shop in An Nasim Al Gharbi. We sell and renew beIN subscriptions, supply receivers, and install and align dishes for homes, shops and cafés across Riyadh.\n\nOur customers come back because we keep it simple: fair prices, honest advice on which package fits what you watch, and a shop that is open 24 hours when you need it.\n\n✓ All beIN packages in one place\n✓ Receivers, dishes and accessories in stock\n✓ Installation at your home or business\n✓ Rated 5.0 by 236+ customers on Google",
    },
    why: {
      title: "Why Riyadh Chooses Us", subtitle: "Simple service, fair prices, open around the clock.",
      items: [
        ["Clock", "Open 24 Hours", "Late match tonight? Come in any time, day or night."],
        ["BadgeCheck", "Fair, Clear Prices", "You know the full price before you pay. No surprises."],
        ["Zap", "Fast Activation", "Most subscriptions and renewals are active within minutes."],
        ["Satellite", "Expert Installation", "Dishes aligned properly the first time for a strong signal."],
        ["MessageCircle", "WhatsApp Support", "Send a photo of the error on your screen and we will guide you."],
        ["Star", "5.0 on Google", "236+ customers rated us five stars."],
      ],
    },
    steps: {
      title: "How It Works", subtitle: "From first message to watching the match",
      items: [
        ["Message or Visit", "WhatsApp us or walk into the shop in An Nasim Al Gharbi."],
        ["Pick Your Package", "Tell us what you watch and we recommend the right package."],
        ["We Activate or Install", "Subscription activated, receiver set up, dish installed if needed."],
        ["Enjoy the Match", "Sit back and watch. We are one message away if you need help."],
      ],
    },
    reviews: { title: "What Our Customers Say", subtitle: "Real reviews from our Google Business Profile", role: "Google review", more: "Read all 236 reviews on Google" },
    packages: {
      heroBadge: "beIN Packages", heroTitle: "Packages & Prices", heroDesc: "Subscriptions, renewals, receivers and installation. Message us on WhatsApp to order or check today's offer.",
      subsTitle: "beIN Subscription Packages", subsSubtitle: "Prices in Saudi Riyal. Ask on WhatsApp for the latest offers.",
      hwTitle: "Receivers & Installation", hwSubtitle: "Genuine hardware and professional setup",
      order: "Order on WhatsApp", popular: "Most Popular", note: "Prices may change with beIN offers. Message us to confirm today's price before you visit.",
      plans: [
        ["Monthly", "SAR 199", "/ month", "Flexible monthly sports package", ["beIN SPORTS channels", "Top leagues and tournaments", "Activation in minutes", "Renew any month"]],
        ["Sports 6 Months", "SAR 799", "/ 6 months", "Half a season of live sport", ["All beIN SPORTS channels", "Live football every week", "TOD app access", "Instant renewal reminder"]],
        ["Premium 12 Months", "SAR 1,399", "/ year", "The full season, best value", ["All beIN SPORTS channels", "Major leagues and cups", "TOD app on phone and TV", "Free activation support"], true],
        ["Ultimate 12 Months", "SAR 1,999", "/ year", "Sport plus movies and entertainment", ["Everything in Premium", "Movies and entertainment channels", "Kids and documentaries", "Priority setup"]],
      ],
      hardware: [
        ["beIN 4K Receiver", "SAR 899", "", "Latest 4K receiver", ["4K HDR picture", "Wi-Fi and TOD built in", "Setup included in shop", "Warranty"]],
        ["Dish Installation", "From SAR 150", "", "Home, shop or café", ["Dish mounting", "Precise signal alignment", "Cable run to your TV", "Channel scan and test"], true],
        ["Renewal & Repair", "Ask Us", "", "Keep your service running", ["Subscription renewal", "Error code fixes", "Signal problems", "Receiver reset and update"]],
      ],
    },
    servicesPage: { heroBadge: "Our Services", heroTitle: "Satellite TV Services\nin Riyadh", heroDesc: "From a new subscription to a full dish installation, one shop handles it all." },
    aboutPage: { heroBadge: "About Us", heroTitle: "Your Neighbourhood\nbeIN Shop", heroDesc: "A trusted satellite TV shop in An Nasim Al Gharbi, open 24 hours." },
    faqPage: { heroBadge: "FAQ", heroTitle: "Questions? We Have Answers.", heroDesc: "Everything about packages, renewals and installation." },
    contactPage: {
      heroBadge: "Contact Us", heroTitle: "Visit the Shop or\nMessage Us", heroDesc: "Open 24 hours in An Nasim Al Gharbi, Riyadh.",
      cards: [
        ["MessageCircle", "WhatsApp", `${PHONE_DISPLAY}\nFastest way to order or ask a question.`],
        ["PhoneCall", "Call Us", `${PHONE_DISPLAY}\nSpeak to us directly, any time.`],
        ["MapPin", "Visit the Shop", "An Nasim Al Gharbi, Riyadh\nOpen 24 hours, every day."],
      ],
      cardsTitle: "Reach Us Your Way",
      mapTitle: "Find Us", mapSubtitle: "An Nasim Al Gharbi, Riyadh",
    },
    faq: [
      ["Which beIN packages do you sell?", "We sell every current beIN package, from monthly sports to the full 12 month Ultimate package. Tell us what you watch and we recommend the best fit."],
      ["Can I renew my subscription without visiting the shop?", "Yes. Send your card or receiver number on WhatsApp and we renew it for you. Payment details are shared on WhatsApp."],
      ["How long does activation take?", "Most new subscriptions and renewals are active within minutes."],
      ["Do you install dishes at home?", "Yes. We install and align dishes for homes, shops, cafés and compounds across Riyadh."],
      ["Do you sell 4K receivers?", "Yes, genuine beIN receivers including 4K models, with setup included."],
      ["My receiver shows an error code. Can you help?", "Send us a photo of the screen on WhatsApp. Most errors are fixed remotely in a few minutes. If not, bring the receiver to the shop."],
      ["What are your opening hours?", "We are open 24 hours, every day."],
      ["Where is the shop?", "An Nasim Al Gharbi, Riyadh. Tap Directions on our Contact page to open it in Google Maps."],
    ],
    faqTitle: "Frequently Asked Questions",
    cta: { title: "Big Match Coming Up?", desc: "Renew or upgrade now on WhatsApp and do not miss a minute." },
    contact: {
      title: "Send Us a Message", subtitle: "Tell us what you need and we reply fast. For the quickest answer, WhatsApp us.",
      fields: ["Full Name", "Mobile / WhatsApp", "What do you need?", "Message"],
      options: ["New subscription", "Renewal", "4K receiver", "Dish installation", "Repair", "Other"],
      submit: "Send Message", success: "Thank you. We will get back to you shortly. For faster replies, WhatsApp us.",
    },
    footer: {
      tagline: "beIN subscriptions, renewals, 4K receivers and dish installation in An Nasim Al Gharbi, Riyadh. Open 24 hours.",
      colPages: "Pages", colServices: "Services", colContact: "Contact",
      copyright: `© {year} ${SITE_NAME}. All rights reserved. beIN and beIN SPORTS are trademarks of beIN Media Group. ${SITE_NAME} is an independent retailer.`,
    },
    seo: {
      home: ["beIN Subscriptions & Receivers in Riyadh", "beIN subscriptions, renewals, 4K receivers and dish installation in An Nasim Al Gharbi, Riyadh. Open 24 hours. Rated 5.0 on Google."],
      packages: ["beIN Packages & Prices in Riyadh", "beIN subscription packages, 4K receiver prices and dish installation in Riyadh. Order on WhatsApp."],
      services: ["Satellite TV Services in Riyadh", "beIN subscriptions, renewals, receiver setup, dish installation and repair in Riyadh."],
      about: ["About Us", "Bein Sports Riyadh, a satellite TV shop in An Nasim Al Gharbi, open 24 hours."],
      faq: ["FAQ", "Answers about beIN packages, renewals, receivers and dish installation in Riyadh."],
      contact: ["Contact Us", "Visit Bein Sports Riyadh in An Nasim Al Gharbi or message us on WhatsApp. Open 24 hours."],
    },
  },

  ar: {
    prefix: "/ar",
    lang: "ar",
    siteName: SITE_NAME_AR,
    wa: waText("السلام عليكم، أبغى أستفسر عن باقات beIN"),
    nav: { home: "الرئيسية", packages: "الباقات", services: "خدماتنا", about: "من نحن", faq: "الأسئلة الشائعة", contact: "تواصل معنا", switchLabel: "English", cta: "واتساب" },
    call: "اتصل بنا",
    whatsapp: "اطلب عبر واتساب",
    open: "مفتوح 24 ساعة",
    address: ADDRESS_AR,
    hero: {
      badge: "مفتوح 24 ساعة · النسيم الغربي، الرياض",
      title: "كل مباراة. كل دوري.\nمباشرة على شاشتك.",
      subtitle: SITE_NAME_AR,
      description: "اشتراكات beIN، رسيفرات 4K، تركيب الدش والتجديد في الرياض. زورنا في أي وقت، أو راسلنا على واتساب ونجهّز لك كل شيء.",
    },
    stats: [
      ["5.0★", "تقييم قوقل", "Star"],
      ["+236", "تقييم على قوقل", "MessageSquare"],
      ["24/7", "مفتوحين يوميًا", "Clock"],
      ["نفس اليوم", "تركيب سريع", "Zap"],
    ],
    services: {
      title: "كل ما تحتاجه للمشاهدة", subtitle: "خدماتنا", link: "المزيد",
      items: [
        ["Tv", "اشتراكات beIN", "اشتراك جديد في جميع باقات beIN، يتفعّل في نفس اللحظة."],
        ["RefreshCw", "التجديد والترقية", "جدّد قبل المباراة الكبيرة أو ارفع باقتك خلال دقائق."],
        ["Box", "رسيفرات 4K", "رسيفرات beIN أصلية، منها موديلات 4K، جاهزة للتشغيل مباشرة."],
        ["Satellite", "تركيب الدش", "تركيب الدش وضبط الإشارة بدقة لصورة ثابتة وواضحة."],
        ["Settings", "برمجة الرسيفر", "بحث القنوات وربط الحساب وضبط التلفزيون، نسويها لك."],
        ["Wrench", "الصيانة وحل الأعطال", "ما فيه إشارة، الصورة واقفة، أو رسالة خطأ؟ نحدد المشكلة ونحلها."],
      ],
    },
    about: {
      title: "محل beIN القريب منك في الرياض",
      body: "بين سبورت الرياض محل متخصص في أجهزة ستلايت التلفزيون في حي النسيم الغربي. نبيع ونجدد اشتراكات beIN، ونوفر الرسيفرات، ونركّب ونضبط الدشوش للبيوت والمحلات والمقاهي في كل الرياض.\n\nعملاؤنا يرجعون لنا لأننا نخليها بسيطة: أسعار مناسبة، نصيحة صادقة عن الباقة اللي تناسب اللي تتابعه، ومحل مفتوح 24 ساعة وقت ما تحتاجه.\n\n✓ جميع باقات beIN في مكان واحد\n✓ رسيفرات ودشوش وإكسسوارات متوفرة\n✓ تركيب في بيتك أو محلك\n✓ تقييم 5.0 من أكثر من 236 عميل على قوقل",
    },
    why: {
      title: "ليش أهل الرياض يختارونا", subtitle: "خدمة بسيطة، أسعار مناسبة، ومفتوحين على مدار الساعة.",
      items: [
        ["Clock", "مفتوح 24 ساعة", "عندك مباراة متأخرة الليلة؟ تعال في أي وقت، ليل أو نهار."],
        ["BadgeCheck", "أسعار واضحة", "تعرف السعر كامل قبل ما تدفع. بدون مفاجآت."],
        ["Zap", "تفعيل سريع", "أغلب الاشتراكات والتجديدات تتفعّل خلال دقائق."],
        ["Satellite", "تركيب احترافي", "نضبط الدش صح من أول مرة عشان إشارة قوية."],
        ["MessageCircle", "دعم على واتساب", "صوّر رسالة الخطأ على الشاشة وأرسلها، ونرشدك خطوة بخطوة."],
        ["Star", "5.0 على قوقل", "أكثر من 236 عميل قيّمونا بخمس نجوم."],
      ],
    },
    steps: {
      title: "كيف نخدمك", subtitle: "من أول رسالة لين تشاهد المباراة",
      items: [
        ["راسلنا أو زورنا", "كلمنا على واتساب أو تعال للمحل في النسيم الغربي."],
        ["اختر باقتك", "قل لنا وش تتابع ونقترح لك الباقة المناسبة."],
        ["نفعّل أو نركّب", "نفعّل الاشتراك، نبرمج الرسيفر، ونركّب الدش إذا احتجت."],
        ["استمتع بالمباراة", "اجلس وتابع براحتك، وإذا احتجت شيء حنا على بعد رسالة."],
      ],
    },
    reviews: { title: "وش يقولون عملاؤنا", subtitle: "تقييمات حقيقية من صفحتنا على قوقل", role: "تقييم قوقل", more: "اقرأ جميع التقييمات (236) على قوقل" },
    packages: {
      heroBadge: "باقات beIN", heroTitle: "الباقات والأسعار", heroDesc: "اشتراكات، تجديد، رسيفرات وتركيب. راسلنا على واتساب للطلب أو لمعرفة عرض اليوم.",
      subsTitle: "باقات اشتراك beIN", subsSubtitle: "الأسعار بالريال السعودي. اسألنا على واتساب عن آخر العروض.",
      hwTitle: "الرسيفرات والتركيب", hwSubtitle: "أجهزة أصلية وتركيب احترافي",
      order: "اطلب عبر واتساب", popular: "الأكثر طلبًا", note: "الأسعار قد تتغير حسب عروض beIN. راسلنا لتأكيد سعر اليوم قبل زيارتك.",
      plans: [
        ["شهري", "199 ريال", "/ شهر", "باقة رياضية شهرية مرنة", ["قنوات beIN SPORTS", "أقوى الدوريات والبطولات", "تفعيل خلال دقائق", "جدّد أي شهر"]],
        ["رياضة 6 أشهر", "799 ريال", "/ 6 أشهر", "نص موسم من الرياضة المباشرة", ["جميع قنوات beIN SPORTS", "كورة مباشرة كل أسبوع", "تطبيق TOD", "تذكير بموعد التجديد"]],
        ["بريميوم 12 شهر", "1,399 ريال", "/ سنة", "الموسم كامل بأفضل قيمة", ["جميع قنوات beIN SPORTS", "أكبر الدوريات والكؤوس", "تطبيق TOD على الجوال والتلفزيون", "مساعدة مجانية في التفعيل"], true],
        ["ألتيميت 12 شهر", "1,999 ريال", "/ سنة", "رياضة مع أفلام وترفيه", ["كل مزايا بريميوم", "قنوات الأفلام والترفيه", "قنوات الأطفال والوثائقيات", "أولوية في التركيب"]],
      ],
      hardware: [
        ["رسيفر beIN 4K", "899 ريال", "", "أحدث رسيفر 4K", ["صورة 4K HDR", "واي فاي وTOD مدمج", "برمجة مجانية في المحل", "ضمان"]],
        ["تركيب الدش", "من 150 ريال", "", "للبيت أو المحل أو المقهى", ["تثبيت الدش", "ضبط الإشارة بدقة", "تمديد الكيبل للتلفزيون", "بحث القنوات والتجربة"], true],
        ["التجديد والصيانة", "اسألنا", "", "خلّ خدمتك شغالة دائمًا", ["تجديد الاشتراك", "حل رسائل الخطأ", "مشاكل الإشارة", "تحديث وإعادة ضبط الرسيفر"]],
      ],
    },
    servicesPage: { heroBadge: "خدماتنا", heroTitle: "خدمات الستلايت\nفي الرياض", heroDesc: "من اشتراك جديد إلى تركيب دش كامل، محل واحد يتكفل بكل شيء." },
    aboutPage: { heroBadge: "من نحن", heroTitle: "محل beIN\nفي حيّك", heroDesc: "محل ستلايت موثوق في النسيم الغربي، مفتوح 24 ساعة." },
    faqPage: { heroBadge: "الأسئلة الشائعة", heroTitle: "عندك سؤال؟ عندنا الجواب.", heroDesc: "كل ما تحتاج تعرفه عن الباقات والتجديد والتركيب." },
    contactPage: {
      heroBadge: "تواصل معنا", heroTitle: "زورنا في المحل\nأو راسلنا", heroDesc: "مفتوحين 24 ساعة في النسيم الغربي، الرياض.",
      cards: [
        ["MessageCircle", "واتساب", `${PHONE_DISPLAY}\nأسرع طريقة للطلب أو الاستفسار.`],
        ["PhoneCall", "اتصل بنا", `${PHONE_DISPLAY}\nكلمنا مباشرة في أي وقت.`],
        ["MapPin", "زورنا في المحل", "النسيم الغربي، الرياض\nمفتوح 24 ساعة يوميًا."],
      ],
      cardsTitle: "تواصل معنا بالطريقة اللي تناسبك",
      mapTitle: "موقعنا", mapSubtitle: "النسيم الغربي، الرياض",
    },
    faq: [
      ["وش باقات beIN اللي عندكم؟", "عندنا جميع باقات beIN الحالية، من الباقة الرياضية الشهرية إلى باقة ألتيميت لمدة 12 شهر. قل لنا وش تتابع ونقترح لك الأنسب."],
      ["أقدر أجدد اشتراكي بدون ما أجي للمحل؟", "أكيد. أرسل رقم الكرت أو الرسيفر على واتساب ونجدده لك، ونرسل لك طريقة الدفع على واتساب."],
      ["كم ياخذ التفعيل؟", "أغلب الاشتراكات الجديدة والتجديدات تتفعّل خلال دقائق."],
      ["تركّبون الدش في البيت؟", "نعم، نركّب ونضبط الدشوش للبيوت والمحلات والمقاهي والمجمعات في جميع أحياء الرياض."],
      ["عندكم رسيفرات 4K؟", "نعم، رسيفرات beIN أصلية ومنها موديلات 4K، والبرمجة علينا."],
      ["الرسيفر يطلع رسالة خطأ، تقدرون تساعدوني؟", "صوّر الشاشة وأرسلها لنا على واتساب. أغلب الأعطال نحلها عن بُعد خلال دقائق، وإذا ما انحلت جيب الرسيفر للمحل."],
      ["وش أوقات الدوام؟", "مفتوحين 24 ساعة، كل يوم."],
      ["وين موقع المحل؟", "في حي النسيم الغربي بالرياض. اضغط على الموقع في صفحة تواصل معنا ويفتح لك في خرائط قوقل."],
    ],
    faqTitle: "الأسئلة الشائعة",
    cta: { title: "عندك مباراة كبيرة قريب؟", desc: "جدّد أو ارفع باقتك الحين على واتساب، ولا تفوّتك ولا دقيقة." },
    contact: {
      title: "أرسل لنا رسالة", subtitle: "قل لنا وش تحتاج ونرد عليك بسرعة. وللرد الأسرع، راسلنا على واتساب.",
      fields: ["الاسم الكامل", "رقم الجوال / واتساب", "وش تحتاج؟", "رسالتك"],
      options: ["اشتراك جديد", "تجديد", "رسيفر 4K", "تركيب دش", "صيانة", "أخرى"],
      submit: "إرسال", success: "شكرًا لك. بنتواصل معك قريب. وللرد الأسرع، راسلنا على واتساب.",
    },
    footer: {
      tagline: "اشتراكات beIN، التجديد، رسيفرات 4K وتركيب الدش في النسيم الغربي، الرياض. مفتوح 24 ساعة.",
      colPages: "الصفحات", colServices: "خدماتنا", colContact: "تواصل معنا",
      copyright: `© {year} ${SITE_NAME_AR}. جميع الحقوق محفوظة. beIN و beIN SPORTS علامتان تجاريتان لمجموعة beIN الإعلامية. ${SITE_NAME_AR} متجر مستقل.`,
    },
    seo: {
      home: ["اشتراكات ورسيفرات beIN في الرياض", "اشتراكات beIN، التجديد، رسيفرات 4K وتركيب الدش في النسيم الغربي بالرياض. مفتوح 24 ساعة. تقييم 5.0 على قوقل."],
      packages: ["باقات beIN وأسعارها في الرياض", "أسعار باقات اشتراك beIN، رسيفرات 4K وتركيب الدش في الرياض. اطلب عبر واتساب."],
      services: ["خدمات الستلايت في الرياض", "اشتراكات beIN، التجديد، برمجة الرسيفر، تركيب الدش والصيانة في الرياض."],
      about: ["من نحن", "بين سبورت الرياض، محل ستلايت في النسيم الغربي، مفتوح 24 ساعة."],
      faq: ["الأسئلة الشائعة", "إجابات عن باقات beIN والتجديد والرسيفرات وتركيب الدش في الرياض."],
      contact: ["تواصل معنا", "زورنا في النسيم الغربي أو راسلنا على واتساب. مفتوح 24 ساعة."],
    },
  },
};

// ─── shared block helpers ───────────────────────────────────────────────────
const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = {
  visible: true, width: "full",
  padding: { top: 88, right: 24, bottom: 88, left: 24 },
  margin: ZERO,
  background: { type: "none" },
};
const bgColor = (color) => ({ type: "color", color });

const PAGES = ["home", "packages", "services", "about", "faq", "contact"];
const pagePath = (L, key) => (key === "home" ? (L.prefix || "/") : `${L.prefix}/${key}`);
const pageSlug = (L, key) => pagePath(L, key).replace(/^\//, "") || "home";

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
    padding: ZERO, margin: ZERO, background: bgColor(PURPLE_DEEP),
    templateVariant: "solid-with-cta",
    data: {
      logoText: L.siteName, logo: LOGO_LIGHT, items: navItems(L),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: PURPLE_DEEP, textColor: "#ffffff", colorMode: "legacy", activeColor: GOLD, ctaVariant: "solid", logoHeight: 52, logoCaption: "",
      showCta: true, ctaLabel: L.nav.cta, ctaUrl: L.wa,
    },
  };
}

function footer(L) {
  return {
    id: uid("footer"), type: "footer", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      logo: LOGO_LIGHT, logoText: L.siteName, tagline: L.footer.tagline, logoCaption: "",
      style: "dark", backgroundColor: PURPLE_DARK, accentColor: GOLD, textColor: "#d9cfe6",
      copyrightText: L.footer.copyright, copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: L.wa }],
      columns: [
        { id: uid("fc"), heading: L.footer.colPages, links: PAGES.map((k) => ({ id: uid("fl"), label: L.nav[k], url: pagePath(L, k) })) },
        { id: uid("fc"), heading: L.footer.colServices, links: L.services.items.map(([, title]) => ({ id: uid("fl"), label: title, url: pagePath(L, "services") })) },
        { id: uid("fc"), heading: L.footer.colContact, links: [
          { id: uid("fl"), label: `${L.call} ${L.lang ? PHONE_DISPLAY : ""}`.trim(), url: `tel:${PHONE}` },
          { id: uid("fl"), label: L.whatsapp, url: L.wa },
          { id: uid("fl"), label: L.open, url: pagePath(L, "contact") },
          { id: uid("fl"), label: L.address, url: GMB_URL },
          { id: uid("fl"), label: L.nav.switchLabel, url: pagePath(L.lang ? T.en : T.ar, "home") },
        ]},
      ],
      bottomLinks: [],
    },
  };
}

function hero(L, { badge, title, subtitle, description, img, compact }) {
  return {
    ...BASE, id: uid("hero"), type: "hero", padding: ZERO,
    templateVariant: "fullscreen-overlay",
    background: { type: "image", imageUrl: img, imageOverlay: PURPLE_DARK, imageOverlayOpacity: 0.72 },
    data: {
      layout: "centered", badge, title, subtitle, description, compact: !!compact,
      badgeBgColor: GOLD, badgeTextColor: PURPLE_DARK,
      primaryButton: { label: L.whatsapp, url: L.wa, variant: "primary" },
      secondaryButton: { label: L.lang ? `${L.call} ${PHONE_DISPLAY}` : L.call, url: `tel:${PHONE}`, variant: "outline" },
      imageUrl: img,
      typography: { titleSize: compact ? "5xl" : "6xl", titleColor: "#ffffff", subtitleColor: GOLD, descColor: "#ece4f5" },
    },
  };
}

function stats(L) {
  return {
    ...BASE, id: uid("stats"), type: "stats", padding: ZERO,
    templateVariant: "dark-band",
    data: {
      columns: 4, animate: false,
      items: L.stats.map(([value, label, icon]) => ({ id: uid("st"), value, label, icon })),
    },
  };
}

const SERVICE_IMAGES = [IMG.fans, IMG.stadiumAerial, IMG.fans2, IMG.dishes, IMG.fans3, IMG.repair];

function servicesGrid(L, bg = "#ffffff") {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg),
    templateVariant: "program-cards-dark",
    data: {
      title: L.services.title, subtitle: L.services.subtitle, layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: L.services.items.map(([icon, title, description], i) => ({
        id: uid("sv"), title, description, icon, iconType: "lucide",
        imageUrl: SERVICE_IMAGES[i].replace("w=1600", "w=900"),
        linkLabel: L.whatsapp, link: L.wa,
      })),
    },
  };
}

function aboutSplit(L, bg = "#ffffff", img = IMG.fans2) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "alternating-images",
    data: {
      title: "", subtitle: "", layout: "alternating", columns: 2, style: "minimal",
      items: [{ id: uid("f"), title: L.about.title, description: L.about.body, imageUrl: img, icon: "" }],
    },
  };
}

function whyUs(L, bg = LAVENDER) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    templateVariant: "outlined-cards",
    data: {
      title: L.why.title, subtitle: L.why.subtitle, columns: 3, iconSize: "md",
      items: L.why.items.map(([icon, label, description]) => ({ id: uid("i"), icon, color: PURPLE, label, description })),
    },
  };
}

function steps(L, bg = "#ffffff") {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg),
    data: {
      title: L.steps.title, subtitle: L.steps.subtitle, layout: "horizontal", style: "connected",
      items: L.steps.items.map(([title, description], i) => ({ id: uid("s"), step: `0${i + 1}`, title, description })),
    },
  };
}

function reviews(L, bg = LAVENDER) {
  return [
    {
      ...BASE, id: uid("tes"), type: "testimonials", background: bgColor(bg),
      padding: { top: 88, right: 24, bottom: 24, left: 24 },
      templateVariant: "quote-cards",
      data: {
        title: L.reviews.title, subtitle: L.reviews.subtitle, layout: "grid",
        items: REVIEWS.map((r) => ({ id: uid("t"), name: r.name, role: L.reviews.role, company: r.when, content: r.content, rating: 5, avatar: r.avatar })),
      },
    },
    {
      ...BASE, id: uid("cta"), type: "cta", background: bgColor(bg),
      padding: { top: 0, right: 24, bottom: 88, left: 24 },
      data: {
        title: "", description: "", layout: "centered",
        primaryButton: { label: `★★★★★ ${L.reviews.more}`, url: GMB_URL },
      },
    },
  ];
}

function faq(L, items, bg = "#ffffff") {
  return {
    ...BASE, id: uid("faq"), type: "faq", background: bgColor(bg),
    templateVariant: "accordion-bordered",
    data: {
      title: L.faqTitle, subtitle: "", layout: "accordion", allowMultiple: false,
      items: items.map(([question, answer]) => ({ id: uid("f"), question, answer })),
    },
  };
}

function gallery(title, urls, bg = "#ffffff") {
  return {
    ...BASE, id: uid("gal"), type: "gallery", background: bgColor(bg),
    data: {
      title, subtitle: "", layout: "grid", columns: 3, gap: "md", lightbox: true,
      images: urls.map((url) => ({ id: uid("gi"), url: url.replace("w=1600", "w=1200"), alt: title, caption: "" })),
    },
  };
}

function pricing(L, title, subtitle, plans, bg) {
  return {
    ...BASE, id: uid("pricing"), type: "pricing", background: bgColor(bg),
    templateVariant: "highlighted-cards",
    data: {
      title, subtitle, layout: "cards", billingToggle: false, showCurrencyToggle: false,
      plans: plans.map(([name, price, period, description, features, highlighted]) => ({
        id: uid("plan"), name, price, period, description, features,
        highlighted: !!highlighted, badge: highlighted ? L.packages.popular : undefined,
        ctaLabel: L.packages.order,
        ctaUrl: waText(L.lang ? `السلام عليكم، أبغى ${name}` : `Hello, I would like the ${name} package.`),
      })),
    },
  };
}

function note(text, bg) {
  return {
    ...BASE, id: uid("text"), type: "text", background: bgColor(bg),
    padding: { top: 0, right: 24, bottom: 72, left: 24 },
    data: { content: `<p style="text-align:center"><em>${text}</em></p>`, alignment: "center", columns: 1, typography: {} },
  };
}

function cta(L) {
  return {
    ...BASE, id: uid("cta"), type: "cta",
    background: { type: "gradient", gradient: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)` },
    templateVariant: "gradient-banner",
    data: {
      title: L.cta.title, description: L.cta.desc, layout: "centered",
      primaryButton: { label: L.whatsapp, url: L.wa },
      secondaryButton: { label: L.lang ? `${L.call} ${PHONE_DISPLAY}` : L.call, url: `tel:${PHONE}` },
    },
  };
}

function contact(L, bg = "#ffffff") {
  const [fName, fPhone, fNeed, fMsg] = L.contact.fields;
  return {
    ...BASE, id: uid("contact"), type: "contact", background: bgColor(bg),
    data: {
      title: L.contact.title, subtitle: L.contact.subtitle, layout: "split",
      showMap: true, mapEmbedUrl: MAP_EMBED, showContactInfo: true,
      phone: PHONE_DISPLAY, email: "", address: L.address, recipientEmail: "",
      fields: [
        { id: "f-name", label: fName, type: "text", required: true },
        { id: "f-phone", label: fPhone, type: "tel", required: true },
        { id: "f-need", label: fNeed, type: "select", required: false, options: L.contact.options },
        { id: "f-msg", label: fMsg, type: "textarea", required: false },
      ],
      submitLabel: L.contact.submit, successMessage: L.contact.success,
    },
  };
}

// ─── pages ──────────────────────────────────────────────────────────────────
function homePage(L) {
  return [
    hero(L, { ...L.hero, img: IMG.stadium }),
    stats(L),
    servicesGrid(L, "#ffffff"),
    pricing(L, L.packages.subsTitle, L.packages.subsSubtitle, L.packages.plans, LAVENDER),
    note(L.packages.note, LAVENDER),
    aboutSplit(L, "#ffffff"),
    whyUs(L, LAVENDER),
    steps(L, "#ffffff"),
    ...reviews(L, LAVENDER),
    faq(L, L.faq.slice(0, 4), "#ffffff"),
    cta(L),
    contact(L, LAVENDER),
  ];
}

function packagesPage(L) {
  const p = L.packages;
  return [
    hero(L, { badge: p.heroBadge, title: p.heroTitle, subtitle: L.siteName, description: p.heroDesc, img: IMG.stadium2, compact: true }),
    pricing(L, p.subsTitle, p.subsSubtitle, p.plans, "#ffffff"),
    pricing(L, p.hwTitle, p.hwSubtitle, p.hardware, LAVENDER),
    note(p.note, LAVENDER),
    faq(L, L.faq.slice(0, 4), "#ffffff"),
    cta(L),
  ];
}

function servicesPage(L) {
  const s = L.servicesPage;
  return [
    hero(L, { badge: s.heroBadge, title: s.heroTitle, subtitle: L.siteName, description: s.heroDesc, img: IMG.dishes, compact: true }),
    servicesGrid(L, "#ffffff"),
    steps(L, LAVENDER),
    whyUs(L, "#ffffff"),
    cta(L),
  ];
}

function aboutPage(L) {
  const a = L.aboutPage;
  return [
    hero(L, { badge: a.heroBadge, title: a.heroTitle, subtitle: L.siteName, description: a.heroDesc, img: IMG.fans3, compact: true }),
    aboutSplit(L, "#ffffff", IMG.fans),
    stats(L),
    whyUs(L, LAVENDER),
    gallery(L.lang ? "من أجواء المشاهدة" : "Made for Match Day", [IMG.stadium2, IMG.fans2, IMG.stadiumAerial, IMG.dishBalcony, IMG.fans, IMG.stadiumDay], "#ffffff"),
    ...reviews(L, LAVENDER),
  ];
}

function faqPage(L) {
  const f = L.faqPage;
  return [
    hero(L, { badge: f.heroBadge, title: f.heroTitle, subtitle: L.siteName, description: f.heroDesc, img: IMG.stadiumDay, compact: true }),
    faq(L, L.faq, "#ffffff"),
    cta(L),
  ];
}

function contactPage(L) {
  const c = L.contactPage;
  const links = [L.wa, `tel:${PHONE}`, GMB_URL];
  return [
    hero(L, { badge: c.heroBadge, title: c.heroTitle, subtitle: `${PHONE_DISPLAY} · ${L.open}`, description: c.heroDesc, img: IMG.dishBalcony, compact: true }),
    {
      ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(LAVENDER),
      templateVariant: "outlined-cards",
      data: {
        title: c.cardsTitle, subtitle: "", columns: 3, iconSize: "md",
        items: c.cards.map(([icon, label, description], i) => ({ id: uid("i"), icon, color: PURPLE, label, description, url: links[i] })),
      },
    },
    contact(L, "#ffffff"),
  ];
}

const BUILDERS = { home: homePage, packages: packagesPage, services: servicesPage, about: aboutPage, faq: faqPage, contact: contactPage };

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
    tenant_id: id, label: "Shop", phone: PHONE, whatsapp: WA_NUMBER, email: null,
    address: ADDRESS, is_primary: true, floating_whatsapp: true, sort_order: 0,
  });
  console.log("✓ tenant created", id, "demo until", expiresAt);
  return id;
}

async function run() {
  const tenantId = await ensureTenant();
  const now = new Date().toISOString();
  const { data: tpl } = await sb.from("templates").select("id").eq("slug", TEMPLATE_SLUG).single();

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
    site_name: SITE_NAME, tagline: "beIN Subscriptions, Receivers & Dish Installation",
    logo_url: LOGO_LIGHT, logo_dark_url: LOGO_DARK, logo_type: "image", logo_alt: SITE_NAME, logo_width: 220,
    favicon_url: FAVICON_URL,
    primary_color: PURPLE, secondary_color: PURPLE_DEEP,
    color_overrides: {
      primary: PURPLE, primaryFg: "#ffffff", secondary: PURPLE_DEEP, accent: GOLD, ring: PURPLE,
      background: "#ffffff", foreground: "#1d1026", card: "#ffffff", muted: LAVENDER, mutedFg: "#5d4f6b",
      border: "#e6dcf0", borderRadius: "0.75rem",
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
    tenant_id: tenantId, site_name: SITE_NAME,
    site_description: T.en.seo.home[1],
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Riyadh", language: "en", maintenance_mode: false,
  }, { onConflict: "tenant_id" });
  if (ssErr) console.log("✗ site_settings:", ssErr.message);

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/  ·  Arabic: /ar`);
}

run().catch((e) => { console.error(e); process.exit(1); });
