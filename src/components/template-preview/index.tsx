import {
  HeroBoldDark, HeroSplitImage, HeroMinimalLight,
  HeroAngledSplit, HeroEditorial, HeroCorporate,
} from "./hero-variants";
import {
  NavDarkSolid, NavWhiteBorder, NavTransparent, NavCorporate,
} from "./nav-variants";
import {
  StatsBar, StatsDarkBand, StatsCards, StatsEditorial,
} from "./stats-variants";
import {
  ServicesIconGrid, ServicesHorizontalList, ServicesBigCards,
  ServicesAlternating, ServicesNumbered,
} from "./services-variants";
import {
  AboutSplit, AboutColorBlock, AboutDark, AboutEditorial,
} from "./about-variants";
import {
  PricingHighlightCards, PricingTable, PricingDark,
} from "./pricing-variants";
import {
  TestimonialsCards, TestimonialsFullWidth, TestimonialsEditorial, TestimonialsRatings,
} from "./testimonials-variants";
import {
  TeamAvatarCards, TeamHorizontalList,
  FaqAccordion, FaqTwoColumn,
  CtaBanner, CtaMinimal,
  ContactFooterDark, ContactFooterLight,
} from "./team-faq-cta-variants";
import type { TemplateContent } from "@/lib/templates/template-content";
import type { Template } from "@/lib/templates/templates-data";

// ── Layout combo assigned to each template slug ───────────────────────────────
// Each combo is a different structural arrangement — not just colors.

type LayoutCombo = {
  nav: "dark-solid" | "white-border" | "transparent" | "corporate";
  hero: "bold-dark" | "split-image" | "minimal-light" | "angled-split" | "editorial" | "corporate";
  stats: "bar" | "dark-band" | "cards" | "editorial";
  services: "icon-grid" | "horizontal-list" | "big-cards" | "alternating" | "numbered";
  about: "split" | "color-block" | "dark" | "editorial";
  pricing: "highlight-cards" | "table" | "dark";
  testimonials: "cards" | "full-width" | "editorial" | "ratings";
  team: "avatar-cards" | "horizontal-list";
  faq: "accordion" | "two-column";
  cta: "banner" | "minimal";
  contact: "dark" | "light";
};

const LAYOUT_COMBOS: Record<string, LayoutCombo> = {
  // Bold dark hero → horizontal service list → dark band stats → full-width testimonial → dark contact
  "build-right": {
    nav: "dark-solid", hero: "bold-dark", stats: "dark-band",
    services: "horizontal-list", about: "color-block",
    pricing: "highlight-cards", testimonials: "cards",
    team: "avatar-cards", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Split hero → icon grid → editorial stats → editorial testimonials → light contact
  "colour-craft": {
    nav: "white-border", hero: "split-image", stats: "editorial",
    services: "icon-grid", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "horizontal-list", faq: "two-column", cta: "minimal", contact: "light",
  },
  // Angled split hero → big cards → stats cards → ratings testimonials
  "pest-shield": {
    nav: "dark-solid", hero: "angled-split", stats: "cards",
    services: "big-cards", about: "color-block",
    pricing: "highlight-cards", testimonials: "ratings",
    team: "horizontal-list", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Corporate nav → corporate hero → dark band → numbered services → dark pricing
  "uniform-pro": {
    nav: "corporate", hero: "corporate", stats: "dark-band",
    services: "numbered", about: "dark",
    pricing: "dark", testimonials: "full-width",
    team: "avatar-cards", faq: "two-column", cta: "banner", contact: "dark",
  },
  // Transparent nav (overlays hero) → editorial hero → stats bar → alternating services
  "glass-line": {
    nav: "white-border", hero: "minimal-light", stats: "bar",
    services: "alternating", about: "split",
    pricing: "table", testimonials: "cards",
    team: "horizontal-list", faq: "accordion", cta: "minimal", contact: "light",
  },
  // AC/HVAC: Split hero → horizontal list → dark band → full-width testimonial
  "cool-breeze": {
    nav: "dark-solid", hero: "split-image", stats: "dark-band",
    services: "horizontal-list", about: "color-block",
    pricing: "highlight-cards", testimonials: "full-width",
    team: "avatar-cards", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Electrical: Angled split → big cards → cards stats → ratings
  "sparky-pro": {
    nav: "dark-solid", hero: "angled-split", stats: "cards",
    services: "big-cards", about: "dark",
    pricing: "table", testimonials: "ratings",
    team: "horizontal-list", faq: "two-column", cta: "banner", contact: "dark",
  },
  // Laundry: Minimal light → icon grid → editorial stats → editorial testimonials
  "fresh-wash": {
    nav: "white-border", hero: "minimal-light", stats: "editorial",
    services: "icon-grid", about: "color-block",
    pricing: "highlight-cards", testimonials: "cards",
    team: "horizontal-list", faq: "accordion", cta: "minimal", contact: "light",
  },
  // Curtains: Editorial hero → alternating services → editorial stats
  "curtain-studio": {
    nav: "transparent", hero: "editorial", stats: "editorial",
    services: "alternating", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "avatar-cards", faq: "two-column", cta: "minimal", contact: "light",
  },
  // Trading/B2B: Corporate nav → corporate hero → dark band → numbered → dark pricing
  "trade-supply": {
    nav: "corporate", hero: "corporate", stats: "dark-band",
    services: "numbered", about: "dark",
    pricing: "dark", testimonials: "ratings",
    team: "horizontal-list", faq: "two-column", cta: "banner", contact: "dark",
  },
  // Security: Dark solid → bold-dark hero → dark band → big cards → dark pricing
  "shield-guard": {
    nav: "dark-solid", hero: "bold-dark", stats: "dark-band",
    services: "big-cards", about: "dark",
    pricing: "highlight-cards", testimonials: "cards",
    team: "avatar-cards", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Car wash/detailing: Dark solid → split image → stats cards → big cards → ratings
  "shine-auto": {
    nav: "dark-solid", hero: "split-image", stats: "cards",
    services: "big-cards", about: "color-block",
    pricing: "highlight-cards", testimonials: "ratings",
    team: "avatar-cards", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Catering/events: Transparent nav → editorial hero → editorial stats → alternating → editorial testimonials
  "feast-events": {
    nav: "transparent", hero: "editorial", stats: "editorial",
    services: "alternating", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "avatar-cards", faq: "two-column", cta: "minimal", contact: "light",
  },
  // Medical clinic: White border nav → minimal light → stats bar → icon grid → light contact
  "medplus-clinic": {
    nav: "white-border", hero: "minimal-light", stats: "bar",
    services: "icon-grid", about: "split",
    pricing: "highlight-cards", testimonials: "cards",
    team: "horizontal-list", faq: "accordion", cta: "minimal", contact: "light",
  },
  // Driving school: Dark solid → angled split → stats cards → numbered → ratings testimonials
  "drive-academy": {
    nav: "dark-solid", hero: "angled-split", stats: "cards",
    services: "numbered", about: "color-block",
    pricing: "highlight-cards", testimonials: "ratings",
    team: "horizontal-list", faq: "two-column", cta: "banner", contact: "dark",
  },

  // ── Batch 2 ─────────────────────────────────────────────────────────────────

  // Handyman: Bold dark → horizontal list → dark band → ratings → dark contact
  "handyfix-pro": {
    nav: "dark-solid", hero: "bold-dark", stats: "dark-band",
    services: "horizontal-list", about: "color-block",
    pricing: "highlight-cards", testimonials: "ratings",
    team: "horizontal-list", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Building maintenance: Corporate nav → corporate hero → dark band → numbered → dark
  "buildguard": {
    nav: "corporate", hero: "corporate", stats: "dark-band",
    services: "numbered", about: "dark",
    pricing: "dark", testimonials: "full-width",
    team: "avatar-cards", faq: "two-column", cta: "banner", contact: "dark",
  },
  // General contractor: Editorial → big cards → editorial stats → editorial testimonials → light
  "apex-construct": {
    nav: "transparent", hero: "editorial", stats: "editorial",
    services: "big-cards", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "avatar-cards", faq: "two-column", cta: "minimal", contact: "light",
  },
  // House cleaning: Minimal light → icon grid → bar stats → cards testimonials → light
  "sparkle-home": {
    nav: "white-border", hero: "minimal-light", stats: "bar",
    services: "icon-grid", about: "split",
    pricing: "highlight-cards", testimonials: "cards",
    team: "horizontal-list", faq: "accordion", cta: "minimal", contact: "light",
  },
  // Commercial cleaning: Dark solid → split image → dark band → big cards → dark
  "cleancore-commercial": {
    nav: "dark-solid", hero: "split-image", stats: "dark-band",
    services: "big-cards", about: "color-block",
    pricing: "dark", testimonials: "full-width",
    team: "avatar-cards", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Carpet cleaning: Angled split → alternating → cards stats → ratings → light
  "fibrefresh": {
    nav: "white-border", hero: "angled-split", stats: "cards",
    services: "alternating", about: "split",
    pricing: "highlight-cards", testimonials: "ratings",
    team: "horizontal-list", faq: "accordion", cta: "minimal", contact: "light",
  },
  // Plumbing: Bold dark → horizontal list → dark band → full-width testimonial → dark
  "flowmaster-plumbing": {
    nav: "dark-solid", hero: "bold-dark", stats: "dark-band",
    services: "horizontal-list", about: "dark",
    pricing: "highlight-cards", testimonials: "full-width",
    team: "horizontal-list", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Gas & heating: Angled split → big cards → dark band → ratings → dark
  "heatwave-hvac": {
    nav: "dark-solid", hero: "angled-split", stats: "dark-band",
    services: "big-cards", about: "color-block",
    pricing: "table", testimonials: "ratings",
    team: "horizontal-list", faq: "two-column", cta: "banner", contact: "dark",
  },
  // Multi-trade building services: Corporate → corporate hero → dark band → numbered → dark
  "totalbuilds-services": {
    nav: "corporate", hero: "corporate", stats: "dark-band",
    services: "numbered", about: "dark",
    pricing: "highlight-cards", testimonials: "cards",
    team: "avatar-cards", faq: "two-column", cta: "banner", contact: "dark",
  },
  // Car mechanic: Dark solid → bold dark → dark band → big cards → dark pricing → dark contact
  "torque-auto": {
    nav: "dark-solid", hero: "bold-dark", stats: "dark-band",
    services: "big-cards", about: "dark",
    pricing: "dark", testimonials: "ratings",
    team: "horizontal-list", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Tyre shop: Dark solid → split image → cards stats → horizontal list → ratings
  "gripzone-tyres": {
    nav: "dark-solid", hero: "split-image", stats: "cards",
    services: "horizontal-list", about: "color-block",
    pricing: "highlight-cards", testimonials: "ratings",
    team: "horizontal-list", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Panel beating: White border → split image → bar stats → alternating → light
  "panelcraft": {
    nav: "white-border", hero: "split-image", stats: "bar",
    services: "alternating", about: "split",
    pricing: "highlight-cards", testimonials: "cards",
    team: "avatar-cards", faq: "accordion", cta: "minimal", contact: "light",
  },
  // Fashion: Editorial → alternating → editorial stats → editorial testimonials → light
  "threadline": {
    nav: "transparent", hero: "editorial", stats: "editorial",
    services: "alternating", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "horizontal-list", faq: "two-column", cta: "minimal", contact: "light",
  },
  // Activewear: Angled split → big cards → dark band → full-width → dark
  "stride-active": {
    nav: "dark-solid", hero: "angled-split", stats: "dark-band",
    services: "big-cards", about: "color-block",
    pricing: "highlight-cards", testimonials: "full-width",
    team: "horizontal-list", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Workwear & safety: Corporate → corporate hero → dark band → numbered → dark
  "worksafe-gear": {
    nav: "corporate", hero: "corporate", stats: "dark-band",
    services: "numbered", about: "dark",
    pricing: "table", testimonials: "ratings",
    team: "horizontal-list", faq: "two-column", cta: "banner", contact: "dark",
  },
  // Travel agency: Transparent → editorial hero → editorial stats → alternating → light
  "wanderway": {
    nav: "transparent", hero: "editorial", stats: "editorial",
    services: "alternating", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "avatar-cards", faq: "two-column", cta: "minimal", contact: "light",
  },
  // Tour operator: Dark solid → split image → cards → big cards → ratings → dark
  "trailblaze-tours": {
    nav: "dark-solid", hero: "split-image", stats: "cards",
    services: "big-cards", about: "color-block",
    pricing: "highlight-cards", testimonials: "ratings",
    team: "avatar-cards", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Visa & immigration: Corporate → corporate hero → dark band → numbered → dark
  "visabridge": {
    nav: "corporate", hero: "corporate", stats: "dark-band",
    services: "numbered", about: "dark",
    pricing: "dark", testimonials: "full-width",
    team: "avatar-cards", faq: "two-column", cta: "banner", contact: "dark",
  },
  // Casual dining: Transparent → editorial → editorial stats → alternating → light
  "tablefare": {
    nav: "transparent", hero: "editorial", stats: "editorial",
    services: "alternating", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "avatar-cards", faq: "accordion", cta: "minimal", contact: "light",
  },
  // Cafe: Minimal light → icon grid → bar stats → icon grid → light contact
  "beancraft-cafe": {
    nav: "white-border", hero: "minimal-light", stats: "bar",
    services: "icon-grid", about: "split",
    pricing: "highlight-cards", testimonials: "cards",
    team: "horizontal-list", faq: "accordion", cta: "minimal", contact: "light",
  },
  // Food truck: Bold dark → angled split → dark band → big cards → dark
  "streetbite": {
    nav: "dark-solid", hero: "angled-split", stats: "dark-band",
    services: "big-cards", about: "color-block",
    pricing: "highlight-cards", testimonials: "ratings",
    team: "horizontal-list", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Beauty salon: Minimal light → split image → editorial stats → alternating → light
  "lumiere-salon": {
    nav: "white-border", hero: "minimal-light", stats: "editorial",
    services: "alternating", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "avatar-cards", faq: "two-column", cta: "minimal", contact: "light",
  },
  // Barbershop: Dark solid → bold dark → dark band → icon grid → dark
  "fade-barbershop": {
    nav: "dark-solid", hero: "bold-dark", stats: "dark-band",
    services: "icon-grid", about: "dark",
    pricing: "highlight-cards", testimonials: "ratings",
    team: "avatar-cards", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Dental clinic: White border → minimal light → bar stats → icon grid → light
  "smilestudio-dental": {
    nav: "white-border", hero: "minimal-light", stats: "bar",
    services: "icon-grid", about: "split",
    pricing: "highlight-cards", testimonials: "cards",
    team: "horizontal-list", faq: "accordion", cta: "minimal", contact: "light",
  },
  // Gym: Dark solid → bold dark → dark band → big cards → dark pricing → dark contact
  "ironforge-gym": {
    nav: "dark-solid", hero: "bold-dark", stats: "dark-band",
    services: "big-cards", about: "dark",
    pricing: "dark", testimonials: "full-width",
    team: "avatar-cards", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Personal trainer: Split image → alternating → editorial stats → editorial → light
  "peak-pt": {
    nav: "transparent", hero: "split-image", stats: "editorial",
    services: "alternating", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "horizontal-list", faq: "two-column", cta: "minimal", contact: "light",
  },
  // Courier: Corporate → corporate hero → cards stats → horizontal list → dark
  "swiftdrop-courier": {
    nav: "corporate", hero: "corporate", stats: "cards",
    services: "horizontal-list", about: "color-block",
    pricing: "highlight-cards", testimonials: "ratings",
    team: "horizontal-list", faq: "accordion", cta: "banner", contact: "dark",
  },
  // Storage & removals: White border → split image → bar → icon grid → light
  "vaultstore": {
    nav: "white-border", hero: "split-image", stats: "bar",
    services: "icon-grid", about: "split",
    pricing: "highlight-cards", testimonials: "cards",
    team: "horizontal-list", faq: "accordion", cta: "minimal", contact: "light",
  },
  // Printing & signage: Editorial → big cards → editorial stats → editorial → light
  "pressmark-print": {
    nav: "transparent", hero: "editorial", stats: "editorial",
    services: "big-cards", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "horizontal-list", faq: "two-column", cta: "minimal", contact: "light",
  },
  // Tutoring: White border → minimal light → bar → icon grid → light
  "brightminds-tutor": {
    nav: "white-border", hero: "minimal-light", stats: "bar",
    services: "icon-grid", about: "split",
    pricing: "highlight-cards", testimonials: "cards",
    team: "avatar-cards", faq: "accordion", cta: "minimal", contact: "light",
  },
  // Vocational training: Corporate → corporate hero → dark band → numbered → dark
  "skillforge-training": {
    nav: "corporate", hero: "corporate", stats: "dark-band",
    services: "numbered", about: "dark",
    pricing: "table", testimonials: "full-width",
    team: "avatar-cards", faq: "two-column", cta: "banner", contact: "dark",
  },
  // Law firm: Corporate → corporate hero → dark band → alternating → dark pricing → dark
  "lexbridge-law": {
    nav: "corporate", hero: "corporate", stats: "dark-band",
    services: "alternating", about: "dark",
    pricing: "dark", testimonials: "full-width",
    team: "avatar-cards", faq: "two-column", cta: "banner", contact: "dark",
  },
  // Accounting: White border → split image → bar → icon grid → light pricing → light
  "cleartax-accounting": {
    nav: "white-border", hero: "split-image", stats: "bar",
    services: "icon-grid", about: "split",
    pricing: "highlight-cards", testimonials: "cards",
    team: "horizontal-list", faq: "accordion", cta: "minimal", contact: "light",
  },
  // Photography: Transparent → editorial → editorial stats → big cards → editorial → light
  "lenscroft-studio": {
    nav: "transparent", hero: "editorial", stats: "editorial",
    services: "big-cards", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "avatar-cards", faq: "two-column", cta: "minimal", contact: "light",
  },
  // Wedding planning: Transparent → editorial → editorial stats → alternating → editorial → light
  "forever-events": {
    nav: "transparent", hero: "editorial", stats: "editorial",
    services: "alternating", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "avatar-cards", faq: "two-column", cta: "minimal", contact: "light",
  },
  // Property agent: White border → split image → bar → alternating → light
  "prime-property": {
    nav: "white-border", hero: "split-image", stats: "bar",
    services: "alternating", about: "split",
    pricing: "highlight-cards", testimonials: "cards",
    team: "avatar-cards", faq: "accordion", cta: "minimal", contact: "light",
  },
  // Property management: Corporate → corporate hero → dark band → numbered → dark
  "propertyvault-mgmt": {
    nav: "corporate", hero: "corporate", stats: "dark-band",
    services: "numbered", about: "dark",
    pricing: "table", testimonials: "full-width",
    team: "horizontal-list", faq: "two-column", cta: "banner", contact: "dark",
  },
  // IT support: Corporate → corporate hero → dark band → icon grid → dark
  "netsupport-it": {
    nav: "corporate", hero: "corporate", stats: "dark-band",
    services: "icon-grid", about: "dark",
    pricing: "dark", testimonials: "ratings",
    team: "avatar-cards", faq: "two-column", cta: "banner", contact: "dark",
  },
  // Digital marketing agency: Editorial → bold dark → editorial stats → big cards → editorial → dark
  "growthlab-agency": {
    nav: "transparent", hero: "editorial", stats: "editorial",
    services: "big-cards", about: "editorial",
    pricing: "highlight-cards", testimonials: "editorial",
    team: "avatar-cards", faq: "two-column", cta: "minimal", contact: "light",
  },
};

// Fallback combo for any template without a specific assignment
const DEFAULT_COMBO: LayoutCombo = {
  nav: "dark-solid", hero: "bold-dark", stats: "bar",
  services: "icon-grid", about: "split",
  pricing: "highlight-cards", testimonials: "cards",
  team: "avatar-cards", faq: "accordion", cta: "banner", contact: "dark",
};

function getCombo(slug: string): LayoutCombo {
  return LAYOUT_COMBOS[slug] ?? DEFAULT_COMBO;
}

// ── Main renderer ─────────────────────────────────────────────────────────────

interface Props {
  template: Template;
  content: TemplateContent;
}

export function TemplateDemoRenderer({ template, content }: Props) {
  const combo = getCombo(template.slug);
  const primary = template.primaryColor;
  const secondary = template.secondaryColor;
  const accent = template.accentColorHex;

  const navData = {
    siteName: template.name,
    navLinks: content.navLinks,
    cta: content.cta,
    primaryColor: primary,
    accentHex: accent,
  };

  const heroData = {
    headline: template.heroHeadline,
    subline: template.heroSubline,
    badge: undefined as string | undefined,
    cta: content.cta,
    ctaSecondary: content.ctaSecondary,
    badges: content.badges ?? [],
    primaryColor: primary,
    secondaryColor: secondary,
    accentHex: accent,
    heroImage: template.heroImage,
    tagline: content.tagline,
  };

  const statsData = { stats: content.stats, primaryColor: primary, accentHex: accent, secondaryColor: secondary };
  const servicesData = { services: content.services, primaryColor: primary, accentHex: accent, secondaryColor: secondary };
  const aboutData = {
    heading: content.about.heading,
    body: content.about.body,
    highlights: content.about.highlights,
    primaryColor: primary,
    accentHex: accent,
    secondaryColor: secondary,
    stat: content.stats[0],
    icon: content.services[0]?.icon,
    image: content.about.image,
  };
  const pricingData = { pricing: content.pricing ?? [], primaryColor: primary, accentHex: accent, secondaryColor: secondary };
  const testimonialsData = { testimonials: content.testimonials, primaryColor: primary, accentHex: accent, secondaryColor: secondary };
  const teamData = { team: content.team ?? [], primaryColor: primary, accentHex: accent };
  const faqData = { faqItems: content.faqItems ?? [], primaryColor: primary, accentHex: accent };
  const ctaData = { cta: content.cta, ctaSecondary: content.ctaSecondary, tagline: content.tagline, primaryColor: primary, accentHex: accent, secondaryColor: secondary };
  const contactData = { phone: content.phone, email: content.email, address: content.address, cta: content.cta, primaryColor: primary, accentHex: accent, secondaryColor: secondary, siteName: template.name };

  const NavComp = {
    "dark-solid": NavDarkSolid,
    "white-border": NavWhiteBorder,
    "transparent": NavTransparent,
    "corporate": NavCorporate,
  }[combo.nav];

  const HeroComp = {
    "bold-dark": HeroBoldDark,
    "split-image": HeroSplitImage,
    "minimal-light": HeroMinimalLight,
    "angled-split": HeroAngledSplit,
    "editorial": HeroEditorial,
    "corporate": HeroCorporate,
  }[combo.hero];

  const StatsComp = {
    "bar": StatsBar,
    "dark-band": StatsDarkBand,
    "cards": StatsCards,
    "editorial": StatsEditorial,
  }[combo.stats];

  const ServicesComp = {
    "icon-grid": ServicesIconGrid,
    "horizontal-list": ServicesHorizontalList,
    "big-cards": ServicesBigCards,
    "alternating": ServicesAlternating,
    "numbered": ServicesNumbered,
  }[combo.services];

  const AboutComp = {
    "split": AboutSplit,
    "color-block": AboutColorBlock,
    "dark": AboutDark,
    "editorial": AboutEditorial,
  }[combo.about];

  const PricingComp = {
    "highlight-cards": PricingHighlightCards,
    "table": PricingTable,
    "dark": PricingDark,
  }[combo.pricing];

  const TestimonialsComp = {
    "cards": TestimonialsCards,
    "full-width": TestimonialsFullWidth,
    "editorial": TestimonialsEditorial,
    "ratings": TestimonialsRatings,
  }[combo.testimonials];

  const TeamComp = {
    "avatar-cards": TeamAvatarCards,
    "horizontal-list": TeamHorizontalList,
  }[combo.team];

  const FaqComp = {
    "accordion": FaqAccordion,
    "two-column": FaqTwoColumn,
  }[combo.faq];

  const CtaComp = {
    "banner": CtaBanner,
    "minimal": CtaMinimal,
  }[combo.cta];

  const ContactComp = {
    "dark": ContactFooterDark,
    "light": ContactFooterLight,
  }[combo.contact];

  const isTransparentNav = combo.nav === "transparent";

  return (
    <div className="min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Nav — transparent sits over hero */}
      {!isTransparentNav && <NavComp d={navData} />}

      {/* Hero — position relative to allow transparent nav overlay */}
      <div className={isTransparentNav ? "relative" : ""}>
        {isTransparentNav && <NavComp d={navData} />}
        <HeroComp d={heroData} />
      </div>

      <StatsComp d={statsData} />
      <ServicesComp d={servicesData} />
      <AboutComp d={aboutData} />
      {pricingData.pricing.length > 0 && <PricingComp d={pricingData} />}
      {teamData.team.length > 0 && <TeamComp d={teamData} />}
      <TestimonialsComp d={testimonialsData} />
      {faqData.faqItems.length > 0 && <FaqComp d={faqData} />}
      <CtaComp d={ctaData} />
      <ContactComp d={contactData} />
    </div>
  );
}
