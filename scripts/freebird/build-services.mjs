import { blk, upsertPage, PHONE, PHONE_TEL, WHATSAPP_URL, NAVY, GREEN } from './_lib.mjs';
import { SERVICES, PRIMARY, svcUrl, IMG, TRUST_ITEMS, CONTACT_FIELDS } from './_content.mjs';

const LIGHT = { type: 'color', color: '#f8fafc' };

/** Related services: the primary first (unless we are on it), then neighbours,
 *  so every service page links deeper into the set instead of dead-ending. */
function relatedTo(svc) {
  const others = SERVICES.filter((s) => s.slug !== svc.slug);
  const withPrimary = svc.primary ? others : [PRIMARY, ...others.filter((s) => !s.primary)];
  const idx = SERVICES.findIndex((s) => s.slug === svc.slug);
  const rotated = [...withPrimary.slice(idx % withPrimary.length), ...withPrimary.slice(0, idx % withPrimary.length)];
  return rotated.slice(0, 6);
}

function servicePageBlocks(svc) {
  const related = relatedTo(svc);
  return [
    blk('hero', {
      layout: 'left',
      badge: svc.primary ? 'Our Primary Service' : 'Singapore Service',
      badgeBgColor: 'rgba(34,197,94,0.15)',
      badgeTextColor: GREEN,
      title: `${svc.title} in Singapore`,
      subtitle: svc.short,
      primaryButton: { label: 'Get a Free Quote', url: '/contact', variant: 'primary' },
      secondaryButton: { label: 'WhatsApp Us', url: WHATSAPP_URL, variant: 'outline' },
      imageUrl: svc.image,
      imageAlt: `${svc.title} work carried out in a Singapore property`,
      overlayOpacity: 0.66,
      overlayColor: '#0f172a',
      overlayColorTo: '#020617',
      accentColor: GREEN,
      compact: true,
      typography: { titleSize: '5xl', titleColor: '#ffffff', subtitleColor: '#e2e8f0', descColor: GREEN },
    }, {
      templateVariant: 'fullscreen-overlay',
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    }),

    blk('features', {
      layout: 'grid',
      columns: 4,
      style: 'minimal',
      items: TRUST_ITEMS,
    }, { background: LIGHT, padding: { top: 40, right: 0, bottom: 40, left: 0 } }),

    // What the service covers
    blk('features', {
      title: `What Our ${svc.title} Covers`,
      subtitle: svc.intro,
      layout: 'grid',
      columns: 3,
      style: 'card',
      items: svc.points.map((p, i) => ({
        id: `${svc.slug}-p${i}`,
        icon: svc.icon,
        title: p,
        description: '',
      })),
    }, { animation: 'slide-up' }),

    blk('cta', {
      title: `Need ${svc.title}?`,
      description: 'Tell us about the property and the work involved, and we will advise on the next step.',
      primaryButton: { label: 'Request a Free Quote', url: '/contact' },
      secondaryButton: { label: `Call ${PHONE}`, url: `tel:${PHONE_TEL}` },
      layout: 'split',
    }, { templateVariant: 'navy-banner', padding: { top: 56, right: 0, bottom: 56, left: 0 } }),

    // Who it is for
    blk('features', {
      title: 'Residential and Commercial Properties',
      subtitle: `We carry out ${svc.title.toLowerCase()} for homes and businesses across Singapore.`,
      layout: 'grid',
      columns: 3,
      style: 'card',
      items: [
        { id: `${svc.slug}-a1`, icon: 'Home', title: 'Homes', description: 'HDB flats, condominiums and landed properties.' },
        { id: `${svc.slug}-a2`, icon: 'Store', title: 'Shops and outlets', description: 'Retail units, F&B premises and showrooms.' },
        { id: `${svc.slug}-a3`, icon: 'Building2', title: 'Offices and commercial', description: 'Offices, warehouses and industrial units.' },
      ],
    }),

    // Cross-links to the rest of the catalogue
    blk('services', {
      title: 'Other Services We Provide',
      subtitle: 'One team covering the trades most properties need.',
      layout: 'grid',
      columns: 3,
      cardStyle: 'bordered',
      items: related.map((s) => ({
        id: `rel-${svc.slug}-${s.slug}`,
        icon: s.icon,
        iconType: 'lucide',
        imageUrl: s.image,
        title: s.title,
        description: s.short,
        link: svcUrl(s),
        linkLabel: 'Learn More',
      })),
    }, { background: LIGHT }),

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
      padding: { top: 88, right: 0, bottom: 88, left: 0 },
    }),

    blk('contact', {
      title: `Request a Quote for ${svc.title}`,
      subtitle: 'Share a short description of the work and we will get back to you.',
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

const results = [];
for (const [i, svc] of SERVICES.entries()) {
  const res = await upsertPage({
    slug: `services/${svc.slug}`,
    title: svc.title,
    blocks: servicePageBlocks(svc),
    seoTitle: `${svc.title} in Singapore | Free Bird SG`,
    seoDescription: `${svc.short} Free Bird SG provides ${svc.title.toLowerCase()} for homes, offices, shops and commercial properties across Singapore. Request a free quote.`,
    keywords: `${svc.title.toLowerCase()} singapore, ${svc.title.toLowerCase()}, property services singapore`,
    orderIndex: 20 + i,
  });
  results.push(res);
  console.log('SERVICE', res.action, res.slug);
}
console.log(`\n${results.length} service pages seeded.`);
