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
