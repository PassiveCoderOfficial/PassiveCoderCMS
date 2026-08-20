import { blk, upsertPage, PHONE, PHONE_TEL, WHATSAPP_URL, NAVY, GREEN } from './_lib.mjs';
import {
  SERVICES, PRIMARY, svcUrl, IMG, TRUST_ITEMS, WHY_ITEMS, CONTACT_FIELDS,
} from './_content.mjs';

const DARK_SECTION = { type: 'color', color: NAVY };
const LIGHT_SECTION = { type: 'color', color: '#f8fafc' };

export function homeBlocks() {
  return [
    // ── Hero ──────────────────────────────────────────────────────────────
    blk('hero', {
      layout: 'left',
      badge: 'Electrical Specialists · Singapore',
      badgeBgColor: 'rgba(34,197,94,0.15)',
      badgeTextColor: GREEN,
      title: 'Professional Electrical Services in Singapore',
      subtitle:
        'Reliable electrical solutions for homes, offices, shops and commercial spaces, backed by professional workmanship and responsive service.',
      description: 'Serving Residential & Commercial Customers Across Singapore',
      primaryButton: { label: 'Get a Free Quote', url: '/contact', variant: 'primary' },
      secondaryButton: { label: 'WhatsApp Us', url: WHATSAPP_URL, variant: 'outline' },
      imageUrl: IMG.heroElectrical,
      imageAlt: 'Electrician working on a distribution board in a modern Singapore property',
      overlayOpacity: 0.62,
      overlayColor: '#0f172a',
      overlayColorTo: '#020617',
      accentColor: GREEN,
      typography: { titleSize: '6xl', titleColor: '#ffffff', subtitleColor: '#e2e8f0', descColor: GREEN },
    }, {
      templateVariant: 'fullscreen-overlay',
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    }),

    // ── Trust strip ───────────────────────────────────────────────────────
    blk('features', {
      layout: 'grid',
      columns: 4,
      style: 'minimal',
      items: TRUST_ITEMS,
    }, {
      background: LIGHT_SECTION,
      padding: { top: 44, right: 0, bottom: 44, left: 0 },
    }),

    // ── Services grid ─────────────────────────────────────────────────────
    blk('services', {
      title: 'Our Services',
      subtitle:
        'Professional electrical, maintenance, renovation and construction solutions for your property.',
      layout: 'grid',
      columns: 3,
      cardStyle: 'elevated',
      items: SERVICES.map((s) => ({
        id: `svc-${s.slug}`,
        icon: s.icon,
        iconType: 'lucide',
        imageUrl: s.image,
        title: s.title,
        description: s.short,
        link: svcUrl(s),
        linkLabel: s.primary ? 'Get a Quote' : 'Learn More',
      })),
    }, { animation: 'slide-up' }),

    // ── Primary electrical section ────────────────────────────────────────
    blk('features', {
      title: 'Professional Electrical Services You Can Rely On',
      subtitle:
        'Electrical work is our primary focus, covering fault finding, repairs, installation and ongoing maintenance for residential and commercial properties.',
      layout: 'grid',
      columns: 3,
      style: 'card',
      items: PRIMARY.points.map((p, i) => ({
        id: `ep-${i}`,
        icon: 'Zap',
        title: p,
        description: '',
      })),
    }, { background: LIGHT_SECTION }),

    blk('features', {
      layout: 'alternating',
      columns: 2,
      style: 'minimal',
      items: [{
        id: 'ep-photo',
        icon: 'Zap',
        title: 'Hands-on electrical work, done properly',
        description:
          'From a single faulty power point to full rewiring, our electricians work carefully and leave the site tidy.',
        imageUrl: IMG.electricianWork,
      }],
    }),

    blk('cta', {
      title: 'Speak to Our Electrical Team',
      description:
        'Describe the electrical issue or installation you need and we will advise on the next step.',
      primaryButton: { label: 'Talk to an Electrician', url: `tel:${PHONE_TEL}` },
      secondaryButton: { label: 'View Electrical Services', url: svcUrl(PRIMARY) },
      layout: 'split',
    }, {
      templateVariant: 'navy-banner',
      padding: { top: 56, right: 0, bottom: 56, left: 0 },
    }),

    // ── Why choose us ─────────────────────────────────────────────────────
    blk('features', {
      title: 'Why Choose Free Bird SG?',
      subtitle: 'One team covering the trades most properties need.',
      layout: 'grid',
      columns: 4,
      style: 'card',
      items: WHY_ITEMS,
    }, { animation: 'slide-up' }),

    // ── About ─────────────────────────────────────────────────────────────
    blk('features', {
      title: 'Your Reliable Property Service Partner in Singapore',
      subtitle:
        'Free Bird SG provides practical property services across electrical, maintenance, renovation and construction work. Electrical services are our primary focus, and we support them with the trades that most jobs end up needing, so a single enquiry can cover the whole scope instead of coordinating several contractors.',
      description:
        'We work with homeowners, offices, shops and commercial properties throughout Singapore, on everything from one-off repairs to planned installation and fit-out work.',
      layout: 'grid',
      columns: 3,
      style: 'card',
      items: [
        { id: 'ab1', icon: 'Zap', title: 'Electrical-led', description: 'Electrical work is our core trade and the majority of what we do.' },
        { id: 'ab2', icon: 'Layers', title: 'Multi-trade support', description: 'Plumbing, handyman, painting, flooring and construction work under one team.' },
        { id: 'ab3', icon: 'Building2', title: 'Homes and businesses', description: 'Residential units, offices, shops and commercial premises.' },
      ],
    }, { background: LIGHT_SECTION }),

    blk('features', {
      layout: 'alternating',
      columns: 2,
      style: 'minimal',
      items: [{
        id: 'ab-photo',
        icon: 'Building2',
        title: 'A team homeowners and businesses can call directly',
        description: 'We work with homeowners, offices, shops and commercial properties throughout Singapore, on everything from one-off repairs to planned installation and fit-out work.',
        imageUrl: IMG.aboutTeam,
      }],
    }),

    // ── Our work ──────────────────────────────────────────────────────────
    blk('gallery', {
      title: 'Our Work',
      layout: 'grid',
      columns: 3,
      gap: 'md',
      lightbox: true,
      images: [
        { id: 'g1', url: IMG.workElectrical, alt: 'Electrical installation work', caption: 'Electrical' },
        { id: 'g2', url: IMG.workRenovation, alt: 'Interior renovation project', caption: 'Renovation' },
        { id: 'g3', url: IMG.workPainting, alt: 'Interior painting work', caption: 'Painting' },
        { id: 'g4', url: IMG.workPlumbing, alt: 'Plumbing installation work', caption: 'Plumbing' },
        { id: 'g5', url: IMG.workConstruction, alt: 'Construction and alteration work', caption: 'Construction' },
        { id: 'g6', url: IMG.workOffice, alt: 'Commercial office fit-out', caption: 'Commercial' },
      ],
    }),

    // ── Dark CTA banner ───────────────────────────────────────────────────
    blk('cta', {
      title: 'Need Electrical or Property Services?',
      description: 'Tell us what you need and our team will get back to you.',
      primaryButton: { label: 'Get a Free Quote', url: '/contact' },
      secondaryButton: { label: 'WhatsApp Us', url: WHATSAPP_URL },
      layout: 'centered',
    }, {
      background: {
        type: 'image',
        imageUrl: IMG.ctaDark,
        imageOverlay: '#0f172a',
        imageOverlayTo: '#020617',
        imageOverlayOpacity: 0.88,
      },
      padding: { top: 96, right: 0, bottom: 96, left: 0 },
    }),

    // ── Service area ──────────────────────────────────────────────────────
    blk('features', {
      title: 'Serving Customers Across Singapore',
      subtitle:
        'Free Bird SG serves residential and commercial customers throughout Singapore, including HDB flats, condominiums, landed homes, offices, shops and commercial premises.',
      layout: 'centered',
      columns: 3,
      style: 'minimal',
      items: [
        { id: 'sa1', icon: 'Home', title: 'Residential', description: 'HDB, condominium and landed properties.' },
        { id: 'sa2', icon: 'Store', title: 'Retail & F&B', description: 'Shops, outlets and food premises.' },
        { id: 'sa3', icon: 'Building2', title: 'Commercial', description: 'Offices, warehouses and industrial units.' },
      ],
    }),

    // ── FAQ ───────────────────────────────────────────────────────────────
    blk('faq', {
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions about our services and how to get a quotation.',
      layout: 'accordion',
      allowMultiple: false,
      items: FAQ_ITEMS,
    }, { background: LIGHT_SECTION }),

    // ── Contact ───────────────────────────────────────────────────────────
    blk('contact', {
      title: 'Get in Touch With Free Bird SG',
      subtitle:
        'Tell us what you need and we will get back to you with the next step. For urgent electrical issues, call or WhatsApp us directly.',
      layout: 'split',
      showMap: false,
      fields: CONTACT_FIELDS,
      submitLabel: 'Request a Free Quote',
      successMessage: 'Thanks — we have received your enquiry and will be in touch shortly.',
      showContactInfo: true,
      phone: PHONE,
      address: 'Singapore-wide service',
    }),
  ];
}

export const FAQ_ITEMS = [
  { id: 'q1', question: 'What electrical services do you provide?', answer: 'We handle electrical troubleshooting and fault finding, electrical repairs, wiring and rewiring, lighting installation, power point and switch installation, electrical maintenance and general electrical works for both residential and commercial properties.' },
  { id: 'q2', question: 'Do you provide services for commercial properties?', answer: 'Yes. We work with offices, shops, F&B outlets, warehouses and other commercial premises, as well as residential properties including HDB flats, condominiums and landed homes.' },
  { id: 'q3', question: 'Do you handle plumbing and handyman work?', answer: 'Yes. Alongside electrical work we provide plumbing services and general handyman work, which means a single enquiry can often cover several jobs in one visit rather than booking separate contractors.' },
  { id: 'q4', question: 'Can you help with renovation-related work?', answer: 'Yes. We provide painting, tiling, vinyl flooring, ceiling and partition work, glass installation, waterproofing and general construction work that commonly forms part of a renovation.' },
  { id: 'q5', question: 'Do you provide CCTV and data cabling installation?', answer: 'Yes. We supply and install CCTV systems including camera positioning, cabling, recorder configuration and remote viewing setup, and we carry out structured data cabling for offices and commercial spaces.' },
  { id: 'q6', question: 'How can I request a quotation?', answer: 'Submit the enquiry form on this page with a short description of the work, or call or WhatsApp us directly. The more detail you can share about the property and the scope, the more accurately we can advise.' },
  { id: 'q7', question: 'Which areas in Singapore do you serve?', answer: 'We serve residential and commercial customers across Singapore.' },
];

if (process.argv[1] && process.argv[1].includes('build-home')) {
  const res = await upsertPage({
    slug: 'home',
    title: 'Home',
    blocks: homeBlocks(),
    seoTitle: 'Professional Electrical Services in Singapore | Free Bird SG',
    seoDescription:
      'Free Bird SG provides professional electrical services in Singapore, along with plumbing, handyman, CCTV installation, data cabling, painting, renovation and construction work for homes, offices, shops and commercial properties. Request a free quote.',
    keywords:
      'electrical services singapore, electrician singapore, plumbing service singapore, handyman singapore, cctv installation, data cabling, renovation services singapore',
    orderIndex: 0,
  });
  console.log('HOME', res);
}
