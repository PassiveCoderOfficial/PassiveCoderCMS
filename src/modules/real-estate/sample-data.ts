/**
 * Sample real estate catalogue: KSA-first with a Dubai section, for demo
 * sites and the "Load sample listings" button. Everything here is clearly
 * illustrative (reference numbers prefixed SAMPLE-) and meant to be replaced
 * by the agent's real inventory. Community names are real districts; the
 * listings themselves are not real offers.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const U = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMG = {
  villa1: U("1613490493576-7fde63acd811"), villa2: U("1580587771525-78b9dba3b914"), villa3: U("1600596542815-ffad4c1539a9"),
  villa4: U("1600585154340-be6161a56a0c"), villa5: U("1512917774080-9991f1c4c750"), villa6: U("1613977257363-707ba9348227"),
  villa7: U("1605276374104-dee2a0ed3cd6"), villa8: U("1564013799919-ab600027ffc6"), villa9: U("1570129477492-45c003edd2be"),
  int1: U("1600607687939-ce8a6c25118c"), int2: U("1600566753190-17f0baa2a6c3"), int3: U("1600210492486-724fe5c67fb0"),
  int4: U("1616594039964-ae9021a400a0"), int5: U("1618221195710-dd6b41faaea6"), int6: U("1600573472550-8090b5e0745e"),
  int7: U("1600607687644-c7171b42498f"), int8: U("1600566752355-35792bedcfea"), int9: U("1560448204-e02f11c3d0e2"),
  int10: U("1560185893-a55cbc8c57e8"), int11: U("1522708323590-d24dbb6b0267"), int12: U("1493809842364-78817add7ffb"),
  int13: U("1554995207-c18c203602cb"), int14: U("1502672260266-1c1ef2d93688"),
  tower1: U("1545324418-cc1a3fa10c00"), tower2: U("1486406146926-c627a92ad1ab"), tower3: U("1582268611958-ebfd161ef9cf"),
  tower4: U("1600047509807-ba8f99d2cdde"), tower5: U("1605146769289-440113cc3d00"),
  dubai1: U("1512453979798-5ea266f8880c"), dubai2: U("1518684079-3c830dcef090"),
  riyadh1: U("1578895101408-1a36b834405b"), riyadh2: U("1586724237569-f3d0c1dee8c6"),
};
export const SAMPLE_IMAGES = IMG;

const DEVELOPERS = [
  { name: "ROSHN", slug: "roshn", description: "PIF-backed national community developer building integrated neighbourhoods across the Kingdom.", website: "https://www.roshn.sa" },
  { name: "Dar Al Arkan", slug: "dar-al-arkan", description: "One of Saudi Arabia's largest listed real estate developers, active in Riyadh, Jeddah and Makkah.", website: "https://www.alarkan.com" },
  { name: "Emaar", slug: "emaar", description: "Developer of Downtown Dubai and Dubai Creek Harbour, with master communities across the region.", website: "https://www.emaar.com" },
  { name: "Sobha Realty", slug: "sobha", description: "Backward-integrated luxury developer known for build quality in Sobha Hartland, Dubai.", website: "https://www.sobharealty.com" },
  { name: "Retal Urban", slug: "retal", description: "Eastern Province and Riyadh developer of mid-to-premium residential communities.", website: "https://retal.com.sa" },
];

const COMMUNITIES = [
  { name: "Al Malqa", slug: "al-malqa", city: "Riyadh", country: "Saudi Arabia", image_url: IMG.villa3, featured: true, avg_price: 3_200_000, currency: "SAR", rental_yield: 6.2, lat: 24.8127, lng: 46.6149,
    summary: "North Riyadh's most sought-after villa district, minutes from King Fahd Road.",
    description: "Al Malqa is where Riyadh's north expansion started, and it remains one of the city's strongest addresses. Wide streets, new-build villas and quick access to King Fahd Road, the airport corridor and the business districts make it a favourite for families and for investors targeting long-term tenants.",
    highlights: ["Close to KAFD and the airport corridor", "Top international schools nearby", "Strong family rental demand", "New-build villa stock"] },
  { name: "Hittin", slug: "hittin", city: "Riyadh", country: "Saudi Arabia", image_url: IMG.villa6, featured: true, avg_price: 4_100_000, currency: "SAR", rental_yield: 5.8, lat: 24.7599, lng: 46.5995,
    summary: "Premium residential district bordering Wadi Hanifa and the Diriyah gateway.",
    description: "Hittin sits at the edge of Riyadh's premium north-west, next to the Diriyah Gate giga-project. Expect larger plots, modern villas and a steady flow of executive tenants.",
    highlights: ["Next to Diriyah Gate giga-project", "Large plots and modern villas", "Executive tenant base"] },
  { name: "KAFD", slug: "kafd", city: "Riyadh", country: "Saudi Arabia", image_url: IMG.riyadh1, featured: true, avg_price: 2_400_000, currency: "SAR", rental_yield: 7.1, lat: 24.7663, lng: 46.6427,
    summary: "King Abdullah Financial District: Riyadh's walkable business and residential hub.",
    description: "KAFD is Riyadh's financial centre and one of the few truly walkable districts in the city. Serviced apartments and branded residences here attract corporate tenants on company leases.",
    highlights: ["Corporate tenants on company leases", "Metro connected", "Branded residences"] },
  { name: "Al Shati", slug: "al-shati", city: "Jeddah", country: "Saudi Arabia", image_url: IMG.villa5, featured: true, avg_price: 3_600_000, currency: "SAR", rental_yield: 6.0, lat: 21.5883, lng: 39.1093,
    summary: "Jeddah's seafront district on the Corniche.",
    description: "Al Shati lines Jeddah's Corniche with sea-view apartments and villas, close to the Jeddah Tower area and the city's best waterfront dining.",
    highlights: ["Corniche and sea views", "Near Jeddah Tower development", "Holiday-home and rental demand"] },
  { name: "Downtown Dubai", slug: "downtown-dubai", city: "Dubai", country: "UAE", image_url: IMG.dubai1, featured: true, avg_price: 3_500_000, currency: "AED", rental_yield: 6.5, lat: 25.1972, lng: 55.2744,
    summary: "Burj Khalifa, Dubai Mall and the city's most liquid apartment market.",
    description: "Downtown Dubai is the reference market for the city: high liquidity, strong short-let demand and global recognition.",
    highlights: ["Most liquid resale market in Dubai", "Strong holiday-home returns", "Golden Visa eligible from AED 2M"] },
  { name: "Dubai Creek Harbour", slug: "dubai-creek-harbour", city: "Dubai", country: "UAE", image_url: IMG.dubai2, featured: false, avg_price: 2_300_000, currency: "AED", rental_yield: 6.8, lat: 25.2016, lng: 55.3469,
    summary: "Emaar's waterfront master community with off-plan launches and flexible payment plans.",
    description: "A waterfront master community ten minutes from Downtown, with a steady pipeline of off-plan launches on post-handover payment plans.",
    highlights: ["Off-plan with post-handover plans", "Waterfront promenade", "10 min to Downtown"] },
];

type P = Record<string, unknown> & { slug: string; title: string; community: string; developer?: string };

const PROPERTIES: P[] = [
  { slug: "modern-5br-villa-al-malqa", title: "Modern 5-Bedroom Villa with Pool in Al Malqa", community: "al-malqa", listing_type: "sale", property_type: "villa", price: 4_850_000, currency: "SAR", beds: 5, baths: 6, area: 520, area_unit: "sqm", city: "Riyadh", country: "Saudi Arabia", lat: 24.8141, lng: 46.6212, furnishing: "unfurnished", featured: true,
    images: [IMG.villa3, IMG.int1, IMG.int2, IMG.int3, IMG.int6], summary: "Brand-new corner villa, private pool, driver's room, minutes from King Fahd Road.",
    highlights: ["Corner plot, 3 street frontage", "Private pool and landscaped garden", "Smart-home ready", "Maid's and driver's rooms"],
    amenities: ["Private pool", "Garden", "Covered parking", "Maid's room", "Driver's room", "Central A/C", "Smart home"] },
  { slug: "hittin-signature-villa", title: "Signature 6-Bedroom Villa near Diriyah Gate", community: "hittin", listing_type: "sale", property_type: "villa", price: 7_900_000, currency: "SAR", beds: 6, baths: 7, area: 780, area_unit: "sqm", city: "Riyadh", country: "Saudi Arabia", lat: 24.7612, lng: 46.6021, featured: true,
    images: [IMG.villa6, IMG.int4, IMG.int5, IMG.int7, IMG.int8], summary: "Architect-designed family villa with basement, cinema and landscaped courtyard.",
    highlights: ["Home cinema and basement majlis", "Double-height reception", "Elevator"], amenities: ["Elevator", "Cinema", "Private pool", "Majlis", "Garden", "Covered parking"] },
  { slug: "kafd-2br-branded-residence", title: "2-Bedroom Branded Residence in KAFD", community: "kafd", listing_type: "sale", property_type: "apartment", price: 2_350_000, currency: "SAR", beds: 2, baths: 3, area: 145, area_unit: "sqm", city: "Riyadh", country: "Saudi Arabia", lat: 24.7671, lng: 46.6441, featured: true,
    images: [IMG.tower1, IMG.int9, IMG.int10, IMG.int11], summary: "Hotel-serviced apartment with skyline views and metro access.",
    highlights: ["Hotel services and concierge", "Walk to KAFD metro", "Corporate rental demand"], amenities: ["Concierge", "Gym", "Infinity pool", "Valet parking", "Metro access"] },
  { slug: "roshn-sedra-townhouse", title: "ROSHN Sedra 4-Bedroom Townhouse", community: "al-malqa", developer: "roshn", listing_type: "offplan", property_type: "townhouse", price: 1_950_000, price_max: 2_600_000, currency: "SAR", beds: 3, beds_max: 4, baths: 4, area: 300, area_unit: "sqm", city: "Riyadh", country: "Saudi Arabia", handover: "Q4 2027", featured: true, lat: 24.8452, lng: 46.7231,
    images: [IMG.villa9, IMG.int12, IMG.int13], summary: "Master-planned family community with parks, schools and mosques inside the gates.",
    payment_plan: [{ label: "On booking", percent: 10 }, { label: "During construction", percent: 40 }, { label: "On handover", percent: 50 }],
    highlights: ["Eligible for Sakani-backed financing (citizens)", "Community parks and schools", "Developer: ROSHN (PIF)"], amenities: ["Community parks", "Schools", "Mosque", "Retail", "Cycling tracks"] },
  { slug: "dar-al-arkan-jeddah-seaview", title: "Sea-View Apartments by Dar Al Arkan, Al Shati", community: "al-shati", developer: "dar-al-arkan", listing_type: "offplan", property_type: "apartment", price: 1_450_000, price_max: 3_900_000, currency: "SAR", beds: 1, beds_max: 4, baths: 2, area: 95, area_unit: "sqm", city: "Jeddah", country: "Saudi Arabia", handover: "Q2 2028", lat: 21.5921, lng: 39.1078,
    images: [IMG.tower3, IMG.int14, IMG.int9], summary: "Corniche-front tower with full sea views and resort amenities.",
    payment_plan: [{ label: "On booking", percent: 20 }, { label: "During construction", percent: 50 }, { label: "On handover", percent: 30 }],
    highlights: ["Direct Corniche frontage", "Resort-style amenities"], amenities: ["Beach access", "Pool", "Gym", "Kids' club", "Concierge"] },
  { slug: "al-shati-family-villa-rent", title: "Furnished 4-Bedroom Villa for Rent, Al Shati", community: "al-shati", listing_type: "rent", property_type: "villa", price: 240_000, price_period: "year", currency: "SAR", beds: 4, baths: 5, area: 420, area_unit: "sqm", city: "Jeddah", country: "Saudi Arabia", furnishing: "furnished", lat: 21.5861, lng: 39.1121,
    images: [IMG.villa5, IMG.int2, IMG.int6], summary: "Compound villa close to the Corniche, available immediately.", amenities: ["Compound pool", "Gym", "Security", "Maid's room"] },
  { slug: "kafd-studio-rent", title: "Serviced 1-Bedroom for Rent in KAFD", community: "kafd", listing_type: "rent", property_type: "apartment", price: 110_000, price_period: "year", currency: "SAR", beds: 1, baths: 2, area: 82, area_unit: "sqm", city: "Riyadh", country: "Saudi Arabia", furnishing: "furnished", lat: 24.7652, lng: 46.6415,
    images: [IMG.int10, IMG.tower2, IMG.int11], summary: "Fully furnished, bills and housekeeping included. Company leases welcome.", amenities: ["Housekeeping", "Gym", "Pool", "Metro access"] },
  { slug: "malqa-villa-rent", title: "5-Bedroom Villa for Rent in Al Malqa", community: "al-malqa", listing_type: "rent", property_type: "villa", price: 190_000, price_period: "year", currency: "SAR", beds: 5, baths: 6, area: 480, area_unit: "sqm", city: "Riyadh", country: "Saudi Arabia", furnishing: "unfurnished", lat: 24.8109, lng: 46.6181,
    images: [IMG.villa8, IMG.int3, IMG.int7], summary: "New villa, never occupied, private entrance and roof terrace.", amenities: ["Roof terrace", "Maid's room", "Driver's room", "Covered parking"] },
  { slug: "downtown-dubai-2br-burj-view", title: "2-Bedroom with Burj Khalifa View, Downtown Dubai", community: "downtown-dubai", developer: "emaar", listing_type: "sale", property_type: "apartment", price: 3_450_000, currency: "AED", beds: 2, baths: 3, area: 1_420, area_unit: "sqft", city: "Dubai", country: "UAE", featured: true, lat: 25.1951, lng: 55.2769,
    images: [IMG.dubai1, IMG.int8, IMG.int4, IMG.int5], summary: "High-floor unit with full Burj and fountain views. Golden Visa eligible.",
    highlights: ["Full Burj Khalifa view", "Golden Visa eligible", "Strong short-let history"], amenities: ["Pool", "Gym", "Concierge", "Dubai Mall access"] },
  { slug: "creek-harbour-offplan", title: "Creek-View Residences, Dubai Creek Harbour", community: "dubai-creek-harbour", developer: "emaar", listing_type: "offplan", property_type: "apartment", price: 1_650_000, price_max: 4_200_000, currency: "AED", beds: 1, beds_max: 3, baths: 2, area: 780, area_unit: "sqft", city: "Dubai", country: "UAE", handover: "Q3 2028", lat: 25.2031, lng: 55.3451,
    images: [IMG.dubai2, IMG.tower4, IMG.int12], summary: "Waterfront launch with a 60/40 post-handover payment plan.",
    payment_plan: [{ label: "On booking", percent: 10 }, { label: "During construction", percent: 50 }, { label: "On handover", percent: 40 }],
    highlights: ["Post-handover payment plan", "Creek and skyline views"], amenities: ["Promenade", "Pool", "Gym", "Retail podium"] },
  { slug: "sobha-hartland-villa", title: "Sobha Hartland II Waterfront Villa", community: "downtown-dubai", developer: "sobha", listing_type: "offplan", property_type: "villa", price: 12_500_000, currency: "AED", beds: 5, baths: 6, area: 7_800, area_unit: "sqft", city: "Dubai", country: "UAE", handover: "Q1 2028", lat: 25.1789, lng: 55.3128,
    images: [IMG.villa4, IMG.int1, IMG.int5], summary: "Lagoon-front villa by Sobha, 10 minutes to Downtown.",
    payment_plan: [{ label: "On booking", percent: 20 }, { label: "During construction", percent: 40 }, { label: "On handover", percent: 40 }],
    amenities: ["Crystal lagoon", "Private pool", "Smart home", "Golf nearby"] },
  { slug: "retal-riyadh-apartments", title: "Retal Riyadh Garden Apartments", community: "hittin", developer: "retal", listing_type: "offplan", property_type: "apartment", price: 980_000, price_max: 1_900_000, currency: "SAR", beds: 2, beds_max: 4, baths: 3, area: 140, area_unit: "sqm", city: "Riyadh", country: "Saudi Arabia", handover: "Q1 2028", lat: 24.7581, lng: 46.5942,
    images: [IMG.tower5, IMG.int13, IMG.int14], summary: "Low-rise garden apartments, ideal first investment in north-west Riyadh.",
    payment_plan: [{ label: "On booking", percent: 10 }, { label: "During construction", percent: 60 }, { label: "On handover", percent: 30 }],
    amenities: ["Landscaped gardens", "Pool", "Gym", "Kids' play area"] },
];

/** Inserts the sample catalogue. Skips if the tenant already has any
 *  properties, so it never mixes with real inventory. */
export async function seedRealEstateSample(admin: SupabaseClient, tenantId: string): Promise<{ inserted: number }> {
  const { count } = await admin.from("re_properties").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId);
  if ((count ?? 0) > 0) return { inserted: 0 };

  const { data: devs } = await admin.from("re_developers")
    .upsert(DEVELOPERS.map((d, i) => ({ ...d, tenant_id: tenantId, sort_order: i })), { onConflict: "tenant_id,slug" })
    .select("id, slug");
  const { data: comms } = await admin.from("re_communities")
    .upsert(COMMUNITIES.map((c, i) => ({ ...c, tenant_id: tenantId, sort_order: i })), { onConflict: "tenant_id,slug" })
    .select("id, slug");
  const devId = new Map((devs ?? []).map((d) => [d.slug, d.id]));
  const commId = new Map((comms ?? []).map((c) => [c.slug, c.id]));

  // Bulk insert sends one column set for all rows, so keys a row omits
  // arrive as NULL; give the NOT NULL array columns explicit empties.
  const rows = PROPERTIES.map(({ community, developer, ...p }, i) => ({
    payment_plan: [], amenities: [], highlights: [], images: [], floor_plans: [], featured: false, price_on_request: false,
    ...p,
    tenant_id: tenantId,
    community_id: commId.get(community) ?? null,
    developer_id: developer ? devId.get(developer) ?? null : null,
    reference: `SAMPLE-${String(i + 1).padStart(3, "0")}`,
    sort_order: i,
    status: "available",
    description: p.description ?? `${p.summary}\n\nThis is a sample listing to show how the site works. Replace it with real inventory from Dashboard → Real Estate → Properties.`,
  }));
  const { error } = await admin.from("re_properties").insert(rows);
  if (error) throw new Error(error.message);
  return { inserted: rows.length };
}
