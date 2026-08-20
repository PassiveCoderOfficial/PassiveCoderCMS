import { blk, upsertPage, PHONE, PHONE_TEL, WHATSAPP_URL, GREEN } from './_lib.mjs';
import {
  SERVICES, PRIMARY, svcUrl, IMG, TRUST_ITEMS, WHY_ITEMS, CONTACT_FIELDS,
} from './_content.mjs';
import { FAQ_ITEMS } from './build-home.mjs';

const LIGHT = { type: 'color', color: '#f8fafc' };

const bannerHero = (title, subtitle, image) =>
  blk('hero', {
    layout: 'left',
    title,
    subtitle,
    primaryButton: { label: 'Get a Free Quote', url: '/contact', variant: 'primary' },
    secondaryButton: { label: 'WhatsApp Us', url: WHATSAPP_URL, variant: 'outline' },
    imageUrl: image,
    imageAlt: title,
    overlayOpacity: 0.66,
    overlayColor: '#0f172a',
    overlayColorTo: '#020617',
    accentColor: GREEN,
    compact: true,
    typography: { titleSize: '5xl', titleColor: '#ffffff', subtitleColor: '#e2e8f0', descColor: GREEN },
  }, { templateVariant: 'fullscreen-overlay', padding: { top: 0, right: 0, bottom: 0, left: 0 } });

const darkCta = () =>
  blk('cta', {
    title: 'Need Electrical or Property Services?',
    description: 'Tell us what you need and our team will get back to you.',
    primaryButton: { label: 'Get a Free Quote', url: '/contact' },
    secondaryButton: { label: 'WhatsApp Us', url: WHATSAPP_URL },
    layout: 'centered',
  }, {
    background: {
      type: 'image', imageUrl: IMG.ctaDark, imageOverlay: '#0f172a',
      imageOverlayTo: '#020617', imageOverlayOpacity: 0.88,
    },
    padding: { top: 88, right: 0, bottom: 88, left: 0 },
  });

const contactBlock = (title, subtitle) =>
  blk('contact', {
    title, subtitle,
    layout: 'split',
    showMap: false,
    fields: CONTACT_FIELDS,
    submitLabel: 'Request a Free Quote',
    successMessage: 'Thanks — we have received your enquiry and will be in touch shortly.',
    showContactInfo: true,
    phone: PHONE,
    address: 'Singapore-wide service',
  });

const pages = [
  // ── Services index ──────────────────────────────────────────────────────
  {
    slug: 'services', title: 'Services', orderIndex: 2,
    seoTitle: 'Electrical, Plumbing & Property Services in Singapore | Free Bird SG',
    seoDescription: 'Full range of services from Free Bird SG: electrical services, plumbing, handyman, painting, CCTV installation, data cabling, glass, ceiling and partition, flooring, tiling, waterproofing and construction work across Singapore.',
    blocks: [
      bannerHero('Our Services', 'Professional electrical, maintenance, renovation and construction solutions for your property.', IMG.panelWork),
      blk('features', { layout: 'grid', columns: 4, style: 'minimal', items: TRUST_ITEMS },
        { background: LIGHT, padding: { top: 40, right: 0, bottom: 40, left: 0 } }),
      blk('services', {
        title: 'Electrical Services',
        subtitle: 'Our primary service, covering fault finding, repairs, installation and maintenance.',
        layout: 'grid', columns: 1, cardStyle: 'gradient',
        items: [{
          id: 'svc-primary', icon: PRIMARY.icon, iconType: 'lucide', imageUrl: PRIMARY.image,
          title: PRIMARY.title, description: PRIMARY.intro,
          link: svcUrl(PRIMARY), linkLabel: 'View Electrical Services',
        }],
      }),
      blk('services', {
        title: 'All Services',
        subtitle: 'One team covering the trades most homes and businesses need.',
        layout: 'grid', columns: 3, cardStyle: 'elevated',
        items: SERVICES.map((s) => ({
          id: `all-${s.slug}`, icon: s.icon, iconType: 'lucide', imageUrl: s.image,
          title: s.title, description: s.short,
          link: svcUrl(s), linkLabel: s.primary ? 'Get a Quote' : 'Learn More',
        })),
      }, { background: LIGHT, animation: 'slide-up' }),
      darkCta(),
      contactBlock('Request a Quote', 'Tell us which service you need and we will get back to you.'),
    ],
  },

  // ── About ───────────────────────────────────────────────────────────────
  {
    slug: 'about', title: 'About Us', orderIndex: 3,
    seoTitle: 'About Free Bird SG | Property Services in Singapore',
    seoDescription: 'Free Bird SG is a Singapore property services provider specialising in electrical work, supported by plumbing, handyman, renovation and construction services for homes and businesses.',
    blocks: [
      bannerHero('Your Reliable Property Service Partner in Singapore', 'Electrical-led property services for homes, offices, shops and commercial premises.', IMG.aboutTeam),
      blk('features', {
        title: 'What We Do',
        subtitle: 'Free Bird SG provides practical property services across electrical, maintenance, renovation and construction work. Electrical services are our primary focus, and we support them with the trades that most jobs end up needing, so a single enquiry can cover the whole scope instead of coordinating several contractors.',
        description: 'We work with homeowners, offices, shops and commercial properties throughout Singapore, on everything from one-off repairs to planned installation and fit-out work.',
        layout: 'grid', columns: 3, style: 'card',
        items: [
          { id: 'ab1', icon: 'Zap', title: 'Electrical-led', description: 'Electrical work is our core trade and the majority of what we do.' },
          { id: 'ab2', icon: 'Layers', title: 'Multi-trade support', description: 'Plumbing, handyman, painting, flooring and construction work under one team.' },
          { id: 'ab3', icon: 'Building2', title: 'Homes and businesses', description: 'Residential units, offices, shops and commercial premises.' },
        ],
      }),
      blk('features', {
        layout: 'alternating', columns: 2, style: 'minimal',
        items: [{
          id: 'ab-photo', icon: 'Zap',
          title: 'Electrical-led, multi-trade support',
          description: 'Electrical services are our primary focus. We support them with plumbing, handyman, renovation and construction work, so one enquiry can cover the whole scope.',
          imageUrl: IMG.electricianWork,
        }],
      }),
      blk('features', {
        title: 'Why Choose Free Bird SG?',
        subtitle: 'One team covering the trades most properties need.',
        layout: 'grid', columns: 4, style: 'card', items: WHY_ITEMS,
      }, { background: LIGHT }),
      blk('services', {
        title: 'Services We Provide',
        layout: 'grid', columns: 3, cardStyle: 'bordered',
        items: SERVICES.slice(0, 6).map((s) => ({
          id: `ab-${s.slug}`, icon: s.icon, iconType: 'lucide',
          title: s.title, description: s.short, link: svcUrl(s), linkLabel: 'Learn More',
        })),
      }),
      darkCta(),
      contactBlock('Get in Touch With Free Bird SG', 'Tell us what you need and we will get back to you.'),
    ],
  },

  // ── Our Work ────────────────────────────────────────────────────────────
  {
    slug: 'our-work', title: 'Our Work', orderIndex: 4,
    seoTitle: 'Our Work | Electrical, Renovation & Construction Projects | Free Bird SG',
    seoDescription: 'A look at the electrical, renovation, painting, plumbing and construction work Free Bird SG carries out for residential and commercial properties across Singapore.',
    blocks: [
      bannerHero('Our Work', 'Electrical, renovation, painting, plumbing and construction work across Singapore.', IMG.workRenovation),
      blk('gallery', {
        title: 'Electrical',
        layout: 'grid', columns: 3, gap: 'md', lightbox: true,
        images: [
          { id: 'e1', url: IMG.workElectrical, alt: 'Electrical installation work', caption: 'Electrical installation' },
          { id: 'e2', url: IMG.panelWork, alt: 'Distribution board work', caption: 'Distribution board' },
          { id: 'e3', url: IMG.electricianWork, alt: 'Electrician on site', caption: 'On-site electrical work' },
        ],
      }),
      blk('gallery', {
        title: 'Renovation & Painting',
        layout: 'grid', columns: 3, gap: 'md', lightbox: true,
        images: [
          { id: 'r1', url: IMG.workRenovation, alt: 'Interior renovation project', caption: 'Interior renovation' },
          { id: 'r2', url: IMG.workPainting, alt: 'Interior painting work', caption: 'Painting' },
          { id: 'r3', url: IMG.svcVinyl, alt: 'Vinyl flooring installation', caption: 'Flooring' },
        ],
      }, { background: LIGHT }),
      blk('gallery', {
        title: 'Plumbing & Construction',
        layout: 'grid', columns: 3, gap: 'md', lightbox: true,
        images: [
          { id: 'p1', url: IMG.workPlumbing, alt: 'Plumbing installation work', caption: 'Plumbing' },
          { id: 'p2', url: IMG.workConstruction, alt: 'Construction and alteration work', caption: 'Construction' },
          { id: 'p3', url: IMG.workOffice, alt: 'Commercial office fit-out', caption: 'Commercial fit-out' },
        ],
      }),
      blk('services', {
        title: 'Services Behind This Work',
        layout: 'grid', columns: 3, cardStyle: 'bordered',
        items: SERVICES.slice(0, 6).map((s) => ({
          id: `ow-${s.slug}`, icon: s.icon, iconType: 'lucide',
          title: s.title, description: s.short, link: svcUrl(s), linkLabel: 'Learn More',
        })),
      }, { background: LIGHT }),
      darkCta(),
    ],
  },

  // ── FAQ ─────────────────────────────────────────────────────────────────
  {
    slug: 'faq', title: 'FAQ', orderIndex: 5,
    seoTitle: 'Frequently Asked Questions | Free Bird SG',
    seoDescription: 'Answers to common questions about the electrical, plumbing, handyman, CCTV, data cabling and renovation services Free Bird SG provides in Singapore, and how to request a quotation.',
    blocks: [
      bannerHero('Frequently Asked Questions', 'Common questions about our services and how to get a quotation.', IMG.officeFitout),
      blk('faq', {
        title: '', subtitle: '',
        layout: 'accordion', allowMultiple: false, items: FAQ_ITEMS,
      }),
      blk('services', {
        title: 'Explore Our Services',
        layout: 'grid', columns: 3, cardStyle: 'bordered',
        items: SERVICES.slice(0, 6).map((s) => ({
          id: `fq-${s.slug}`, icon: s.icon, iconType: 'lucide',
          title: s.title, description: s.short, link: svcUrl(s), linkLabel: 'Learn More',
        })),
      }, { background: LIGHT }),
      darkCta(),
      contactBlock('Still Have a Question?', 'Send us the details and we will get back to you.'),
    ],
  },

  // ── Contact ─────────────────────────────────────────────────────────────
  {
    slug: 'contact', title: 'Contact', orderIndex: 6,
    seoTitle: 'Contact Free Bird SG | Request a Free Quote in Singapore',
    seoDescription: 'Contact Free Bird SG for electrical services, plumbing, handyman work, CCTV installation, data cabling and renovation services in Singapore. Call, WhatsApp or request a free quote online.',
    blocks: [
      bannerHero('Get in Touch With Free Bird SG', 'Tell us what you need and our team will get back to you.', IMG.electricianWork),
      blk('features', {
        layout: 'grid', columns: 3, style: 'card',
        items: [
          { id: 'c1', icon: 'Phone', title: 'Call Us', description: PHONE },
          { id: 'c2', icon: 'MessageCircle', title: 'WhatsApp', description: 'Message us for a fast reply.' },
          { id: 'c3', icon: 'MapPin', title: 'Service Area', description: 'Serving customers across Singapore.' },
        ],
      }, { background: LIGHT, padding: { top: 48, right: 0, bottom: 48, left: 0 } }),
      contactBlock('Request a Free Quote', 'Share a short description of the work, the property type and your preferred timing.'),
      blk('faq', {
        title: 'Before You Enquire',
        subtitle: 'A few things that help us respond accurately.',
        layout: 'accordion', allowMultiple: false,
        items: FAQ_ITEMS.slice(5),
      }, { background: LIGHT }),
      darkCta(),
    ],
  },

  // ── Legal ───────────────────────────────────────────────────────────────
  {
    slug: 'privacy-policy', title: 'Privacy Policy', orderIndex: 90,
    seoTitle: 'Privacy Policy | Free Bird SG',
    seoDescription: 'How Free Bird SG collects, uses and protects the personal information submitted through enquiry forms on this website.',
    blocks: [
      bannerHero('Privacy Policy', 'How we handle the information you share with us.', IMG.officeFitout),
      blk('text', {
        content: `<h2>Information we collect</h2><p>When you submit an enquiry through this website, we collect the details you provide, which may include your name, phone number, email address, the service you are enquiring about and any description of the work you share with us.</p><h2>How we use your information</h2><p>We use these details only to respond to your enquiry, prepare a quotation and carry out any work you engage us for. We may contact you by phone, WhatsApp or email in connection with your enquiry.</p><h2>Sharing your information</h2><p>We do not sell your personal information. We may share details with team members or trade partners where this is necessary to respond to your enquiry or carry out the work requested.</p><h2>Retention</h2><p>We keep enquiry records for as long as needed to respond to you, complete any work and meet our business and record-keeping requirements.</p><h2>Your choices</h2><p>You may ask us to correct or delete the personal information you have submitted, or ask us to stop contacting you, by getting in touch using the contact details on this website.</p><h2>Changes to this policy</h2><p>We may update this policy from time to time. The version published on this page is the current one.</p><h2>Contact</h2><p>For any questions about this policy or the information we hold, please contact us through the enquiry form or by phone at ${PHONE}.</p>`,
        alignment: 'left',
        columns: 1,
        typography: { lineHeight: '1.8' },
      }, { width: 'narrow' }),
      darkCta(),
    ],
  },
  {
    slug: 'terms-conditions', title: 'Terms & Conditions', orderIndex: 91,
    seoTitle: 'Terms & Conditions | Free Bird SG',
    seoDescription: 'The terms that apply to the use of the Free Bird SG website and to enquiries and quotations submitted through it.',
    blocks: [
      bannerHero('Terms & Conditions', 'The terms that apply to this website and to our quotations.', IMG.panelWork),
      blk('text', {
        content: `<h2>About these terms</h2><p>These terms apply to your use of this website and to enquiries submitted through it. By using this website you accept these terms.</p><h2>Website content</h2><p>The information on this website describes the services we provide in general terms. It is provided for information only and does not form part of any contract or quotation.</p><h2>Enquiries and quotations</h2><p>Submitting an enquiry does not create a contract. Any quotation we provide is based on the information you give us and on what we can assess before starting work. Where the actual scope, site conditions or materials differ from what was described, the quotation may need to be revised, and we will confirm any change with you before proceeding.</p><h2>Carrying out work</h2><p>Work is carried out on the basis agreed in the accepted quotation. Access to the property, and any approvals required from a building management or relevant authority, are the responsibility of the customer unless we have agreed otherwise in writing.</p><h2>Payment</h2><p>Payment terms are as stated in the quotation or invoice issued for the work.</p><h2>Liability</h2><p>Nothing in these terms excludes any liability that cannot be excluded under Singapore law. Subject to that, our liability in connection with this website is limited to the fullest extent permitted by law.</p><h2>Governing law</h2><p>These terms are governed by the laws of Singapore.</p><h2>Contact</h2><p>For questions about these terms, please contact us through the enquiry form or by phone at ${PHONE}.</p>`,
        alignment: 'left',
        columns: 1,
        typography: { lineHeight: '1.8' },
      }, { width: 'narrow' }),
      darkCta(),
    ],
  },
];

for (const p of pages) {
  const res = await upsertPage(p);
  console.log('PAGE', res.action, res.slug);
}
console.log(`\n${pages.length} pages seeded.`);
