import { PHONE, PHONE_TEL, WHATSAPP_URL, BRAND, NAVY, GREEN } from './_lib.mjs';

// ─── Imagery ──────────────────────────────────────────────────────────────
// Unsplash source URLs (royalty-free). Sized + cropped via query params so
// the browser never pulls a 4000px original.
const U = (id, w = 1600, h = 1000) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const IMG = {
  heroElectrical: U('1621905251189-08b45d6a269e', 1920, 1080),
  electricianWork: U('1558618666-fcd25c85cd64', 1400, 1000),
  panelWork: U('1581091226825-a6a2a5aee158', 1400, 1000),
  officeFitout: U('1497366754035-f200968a6e72', 1400, 1000),
  aboutTeam: U('1504328345606-18bbc8c9d7d1', 1400, 1000),
  ctaDark: U('1470071459604-3b5ec3a7fe05', 1920, 900),

  svcElectrical: U('1621905251189-08b45d6a269e', 900, 650),
  svcPlumbing: 'https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/freebirdsg/plumbing.jpg',
  svcHandyman: U('1581244277943-fe4a9c777189', 900, 650),
  svcPainting: U('1562259949-e8e7689d7828', 900, 650),
  svcCctv: U('1558002038-1055907df827', 900, 650),
  svcData: U('1544197150-b99a580bb7a8', 900, 650),
  svcGlass: U('1600585154340-be6161a56a0c', 900, 650),
  svcCeiling: U('1607400201889-565b1ee75f8e', 900, 650),
  svcVinyl: U('1613545325278-f24b0cae1224', 900, 650),
  svcTile: U('1584622650111-993a426fbf0a', 900, 650),
  svcWaterproof: 'https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/freebirdsg/waterproofing.jpg',
  svcConstruction: U('1541888946425-d81bb19240f5', 900, 650),
  svcRack: U('1553413077-190dd305871c', 900, 650),

  workElectrical: U('1621905251918-48416bd8575a', 900, 700),
  workRenovation: U('1523413651479-597eb2da0ad6', 900, 700),
  workPainting: U('1589939705384-5185137a7f0f', 900, 700),
  workPlumbing: U('1620626011761-996317b8d101', 900, 700),
  workConstruction: U('1503387762-592deb58ef4e', 900, 700),
  workOffice: U('1524758631624-e2822e304c36', 900, 700),
};

// ─── Services (single source of truth) ────────────────────────────────────
// `slug` drives /services/<slug>; every list, nav and footer reads this array,
// so adding a service in one place propagates everywhere.
export const SERVICES = [
  {
    slug: 'electrical-services',
    title: 'Electrical Services',
    icon: 'Zap',
    primary: true,
    image: IMG.svcElectrical,
    short: 'Troubleshooting, repairs, rewiring, lighting and power point installation for homes and businesses.',
    intro: 'Electrical work is our core business. We handle everything from a single faulty power point to full rewiring for offices, shops and residential properties across Singapore.',
    points: [
      'Electrical troubleshooting and fault finding',
      'Electrical repair work',
      'Wiring and rewiring',
      'Lighting installation',
      'Power point and switch installation',
      'Electrical maintenance',
      'General electrical works',
    ],
  },
  {
    slug: 'plumbing-service',
    title: 'Plumbing Service',
    icon: 'Droplets',
    image: IMG.svcPlumbing,
    short: 'Leak repairs, pipe work, sanitary fittings and general plumbing for residential and commercial units.',
    intro: 'Plumbing problems rarely wait. We handle leaks, chokes, pipe replacement and sanitary fitting installation for homes, offices and shops.',
    points: [
      'Leak detection and repair',
      'Pipe installation and replacement',
      'Sanitary ware and fittings',
      'Basin, sink and toilet installation',
      'Water heater installation',
      'General plumbing maintenance',
    ],
  },
  {
    slug: 'handyman-service',
    title: 'Handyman Service',
    icon: 'Wrench',
    image: IMG.svcHandyman,
    short: 'General repairs, mounting, fixtures and the small jobs that keep a property running.',
    intro: 'The jobs that are too small for a contractor but too awkward to do yourself. One team, one call, handled in a single visit where possible.',
    points: [
      'Furniture and fixture assembly',
      'TV and shelf mounting',
      'Door, lock and hinge repair',
      'General patching and touch-ups',
      'Fixture replacement',
      'Odd-job repairs',
    ],
  },
  {
    slug: 'painting-service',
    title: 'Painting Service',
    icon: 'PaintRoller',
    image: IMG.svcPainting,
    short: 'Interior and exterior painting with proper surface preparation and clean finishing.',
    intro: 'Painting that lasts depends on preparation. We prepare surfaces properly, protect the areas around them and finish clean.',
    points: [
      'Interior wall painting',
      'Exterior painting',
      'Surface preparation and patching',
      'Ceiling painting',
      'Office and shop repainting',
      'Post-renovation touch-ups',
    ],
  },
  {
    slug: 'cctv-installation',
    title: 'CCTV Installation',
    icon: 'Cctv',
    image: IMG.svcCctv,
    short: 'Camera supply, positioning, cabling and configuration for homes, shops and offices.',
    intro: 'Practical camera coverage without over-specifying. We advise on placement, run the cabling neatly and configure remote viewing.',
    points: [
      'Camera supply and installation',
      'Coverage planning and positioning',
      'Cabling and power routing',
      'Recorder setup and configuration',
      'Mobile and remote viewing setup',
      'System maintenance',
    ],
  },
  {
    slug: 'data-cabling',
    title: 'Data Cabling',
    icon: 'Network',
    image: IMG.svcData,
    short: 'Structured network cabling, points and tidy containment for offices and commercial spaces.',
    intro: 'Structured cabling done tidily, labelled and tested, so future changes are straightforward instead of guesswork.',
    points: [
      'Network point installation',
      'Structured cabling',
      'Cable containment and trunking',
      'Patch panel and rack termination',
      'Labelling and testing',
      'Office relocation cabling',
    ],
  },
  {
    slug: 'glass-installation',
    title: 'Glass Installation',
    icon: 'RectangleHorizontal',
    image: IMG.svcGlass,
    short: 'Glass panels, partitions, doors and mirrors supplied and installed to measure.',
    intro: 'Glass work measured and installed to fit, for shopfronts, office partitions and residential spaces.',
    points: [
      'Glass partition installation',
      'Glass door supply and fitting',
      'Mirror installation',
      'Shopfront glass work',
      'Glass panel replacement',
      'Made-to-measure glass',
    ],
  },
  {
    slug: 'ceiling-partition',
    title: 'Ceiling & Partition',
    icon: 'LayoutPanelTop',
    image: IMG.svcCeiling,
    short: 'False ceilings, drywall partitions and space division for offices and retail units.',
    intro: 'Ceiling and partition work to divide space, conceal services and finish an interior properly.',
    points: [
      'False ceiling installation',
      'Drywall partition walls',
      'Ceiling repair and patching',
      'Access panel installation',
      'Office space division',
      'Skim coat and finishing',
    ],
  },
  {
    slug: 'vinyl-flooring',
    title: 'Vinyl Flooring',
    icon: 'Layers',
    image: IMG.svcVinyl,
    short: 'Vinyl floor supply and installation with proper subfloor preparation.',
    intro: 'Vinyl flooring installed over a properly prepared subfloor, which is what determines how the finish holds up.',
    points: [
      'Vinyl plank installation',
      'Subfloor preparation and levelling',
      'Existing floor removal',
      'Skirting and trim finishing',
      'Residential and commercial flooring',
      'Floor repair and replacement',
    ],
  },
  {
    slug: 'tile-installation',
    title: 'Tile Installation',
    icon: 'Grid3x3',
    image: IMG.svcTile,
    short: 'Floor and wall tiling, replacement and re-grouting for wet and dry areas.',
    intro: 'Tiling for bathrooms, kitchens, shops and living spaces, including replacement of damaged or hollow tiles.',
    points: [
      'Floor tiling',
      'Wall tiling',
      'Tile replacement and repair',
      'Re-grouting',
      'Bathroom and kitchen tiling',
      'Surface preparation',
    ],
  },
  {
    slug: 'waterproofing',
    title: 'Waterproofing',
    icon: 'ShieldCheck',
    image: IMG.svcWaterproof,
    short: 'Membrane application and leak treatment for bathrooms, balconies and wet areas.',
    intro: 'Waterproofing treats the cause rather than the stain. We prepare the substrate and apply membrane systems to wet areas prone to seepage.',
    points: [
      'Bathroom waterproofing',
      'Balcony and terrace waterproofing',
      'Membrane application',
      'Leak and seepage treatment',
      'Wet area preparation',
      'Post-treatment finishing',
    ],
  },
  {
    slug: 'construction-work',
    title: 'Construction Work',
    icon: 'HardHat',
    image: IMG.svcConstruction,
    short: 'Hacking, masonry, structural alterations and general construction support.',
    intro: 'General construction and alteration work, coordinated alongside the electrical, plumbing and finishing trades we already provide.',
    points: [
      'Hacking and demolition',
      'Masonry and brickwork',
      'Plastering and screeding',
      'Structural alteration support',
      'Site preparation',
      'General building works',
    ],
  },
  {
    slug: 'heavy-duty-boltless-rack',
    title: 'Heavy Duty Boltless Rack',
    icon: 'Package',
    image: IMG.svcRack,
    short: 'Storage rack supply, assembly and installation for warehouses, stores and back-of-house areas.',
    intro: 'Boltless racking supplied and assembled on site, sized to the space and the load it needs to carry.',
    points: [
      'Boltless rack supply',
      'On-site assembly and installation',
      'Warehouse and storeroom racking',
      'Shelving layout planning',
      'Rack relocation and reconfiguration',
      'Load-appropriate specification',
    ],
  },
];

export const PRIMARY = SERVICES[0];
export const svcUrl = (s) => `/services/${s.slug}`;

// ─── Global nav + footer ──────────────────────────────────────────────────
export const NAV_ITEMS = [
  { id: 'n-home', label: 'Home', url: '/' },
  {
    id: 'n-services',
    label: 'Services',
    url: '/services',
    children: SERVICES.map((s, i) => ({ id: `n-s${i}`, label: s.title, url: svcUrl(s) })),
  },
  { id: 'n-about', label: 'About Us', url: '/about' },
  { id: 'n-work', label: 'Our Work', url: '/our-work' },
  { id: 'n-faq', label: 'FAQ', url: '/faq' },
  { id: 'n-contact', label: 'Contact', url: '/contact' },
];

export const GLOBAL_HEADER = {
  id: 'nav-freebird',
  type: 'navigation',
  order: 0,
  visible: true,
  width: 'full',
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  background: { type: 'none' },
  data: {
    logoText: 'FREE BIRD SG',
    logoUrl: '/',
    // No logo file supplied — render the platform's coded SVG brand mark
    // (crisp at any size, no asset upload) in Free Bird SG's own colors
    // instead of falling back to plain text.
    useBrandMark: true,
    items: NAV_ITEMS,
    sticky: true,
    transparent: false,
    style: 'split',
    colorMode: 'token',
    activeColor: NAVY,
    scrollAware: true,
    glass: true,
    shadow: true,
    borderBottom: false,
    showCta: true,
    ctaLabel: 'Get a Free Quote',
    ctaUrl: '/contact',
    ctaVariant: 'solid',
    showCart: false,
  },
};

export const GLOBAL_FOOTER = {
  id: 'footer-freebird',
  type: 'footer',
  order: 99,
  visible: true,
  width: 'full',
  padding: { top: 72, right: 0, bottom: 32, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  background: { type: 'none' },
  data: {
    logoText: 'FREE BIRD SG',
    tagline:
      'Professional electrical, property maintenance, renovation and construction services in Singapore.',
    style: 'dark',
    backgroundColor: NAVY,
    accentColor: GREEN,
    columns: [
      {
        id: 'fc-pages',
        title: 'Company',
        links: [
          { id: 'fl-home', label: 'Home', url: '/' },
          { id: 'fl-services', label: 'Services', url: '/services' },
          { id: 'fl-about', label: 'About Us', url: '/about' },
          { id: 'fl-work', label: 'Our Work', url: '/our-work' },
          { id: 'fl-faq', label: 'FAQ', url: '/faq' },
          { id: 'fl-contact', label: 'Contact', url: '/contact' },
        ],
      },
      {
        id: 'fc-svc',
        title: 'Services',
        links: SERVICES.slice(0, 7).map((s, i) => ({ id: `fs-${i}`, label: s.title, url: svcUrl(s) })),
      },
      {
        id: 'fc-more',
        title: 'More Services',
        links: SERVICES.slice(7).map((s, i) => ({ id: `fm-${i}`, label: s.title, url: svcUrl(s) })),
      },
      {
        id: 'fc-contact',
        title: 'Contact',
        links: [
          { id: 'fc-ph', label: PHONE, url: `tel:${PHONE_TEL}` },
          { id: 'fc-wa', label: 'WhatsApp Us', url: WHATSAPP_URL },
          { id: 'fc-quote', label: 'Request a Quote', url: '/contact' },
          { id: 'fc-area', label: 'Singapore-wide service', url: '/contact' },
        ],
      },
    ],
    copyrightText: `© ${new Date().getFullYear()} ${BRAND}. All rights reserved.`,
    copyrightYear: false,
    bottomLinks: [
      { id: 'bl-privacy', label: 'Privacy Policy', url: '/privacy-policy' },
      { id: 'bl-terms', label: 'Terms & Conditions', url: '/terms-conditions' },
    ],
  },
};

// ─── Reusable content ─────────────────────────────────────────────────────
export const TRUST_ITEMS = [
  { id: 't1', icon: 'BadgeCheck', title: 'Professional Workmanship', description: 'Quality-focused work with attention to detail.' },
  { id: 't2', icon: 'Building2', title: 'Residential & Commercial', description: 'Homes, offices, shops and commercial properties.' },
  { id: 't3', icon: 'Clock', title: 'Responsive Service', description: 'Clear communication and prompt replies to enquiries.' },
  { id: 't4', icon: 'MapPin', title: 'Singapore-Wide Service', description: 'Serving customers across Singapore.' },
];

export const WHY_ITEMS = [
  { id: 'w1', icon: 'BadgeCheck', title: 'Professional Workmanship', description: 'Quality-focused work with attention to detail.' },
  { id: 'w2', icon: 'Users', title: 'One Team for Multiple Services', description: 'Electrical, plumbing, handyman, renovation and construction services under one roof.' },
  { id: 'w3', icon: 'Building2', title: 'Residential & Commercial', description: 'Solutions for homes, offices, shops and commercial properties.' },
  { id: 'w4', icon: 'MessageCircle', title: 'Reliable & Responsive', description: 'Clear communication and prompt response to service enquiries.' },
];

export const CONTACT_FIELDS = [
  { id: 'f-name', label: 'Name', type: 'text', required: true },
  { id: 'f-phone', label: 'Phone Number', type: 'tel', required: true },
  { id: 'f-email', label: 'Email', type: 'email', required: false },
  {
    id: 'f-service',
    label: 'Service Required',
    type: 'select',
    required: true,
    options: SERVICES.map((s) => s.title).concat('Other / Not sure'),
  },
  { id: 'f-msg', label: 'Message', type: 'textarea', required: true },
];

export { PHONE, PHONE_TEL, WHATSAPP_URL, BRAND, NAVY, GREEN };
