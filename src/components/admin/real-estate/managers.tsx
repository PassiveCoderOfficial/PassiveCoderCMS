"use client";

import React from "react";
import { EntityManager, type FieldGroup } from "./entity-manager";
import { priceLabel, bedsLabel, titleCase, LISTING_TYPE_LABEL, PROPERTY_TYPES, type ReListingType } from "@/lib/real-estate/format";

type Row = Record<string, unknown> & { id: string };
type Opt = { id: string; name: string };

const CURRENCIES: [string, string][] = [["SAR", "SAR"], ["AED", "AED"], ["USD", "USD"], ["QAR", "QAR"], ["BHD", "BHD"], ["OMR", "OMR"]];

export function PropertiesManager({ initial, communities, developers, defaults }: { initial: Row[]; communities: Opt[]; developers: Opt[]; defaults: { currency: string; unit: string } }) {
  const groups: FieldGroup[] = [
    {
      title: "Basics",
      fields: [
        { key: "title", label: "Title", type: "text", placeholder: "e.g. 3BR Villa with Private Pool in Al Malqa" },
        { key: "listing_type", label: "Listing type", type: "select", half: true, options: [["sale", "For sale"], ["rent", "For rent"], ["offplan", "Off-plan"]] },
        { key: "property_type", label: "Property type", type: "select", half: true, options: PROPERTY_TYPES.map((t) => [t, titleCase(t)]) },
        { key: "status", label: "Status", type: "select", half: true, options: [["available", "Available"], ["reserved", "Reserved"], ["sold", "Sold"], ["rented", "Rented"], ["draft", "Draft (hidden)"]] },
        { key: "featured", label: "Featured", type: "bool", half: true, help: "Shown first and in featured sections" },
        { key: "summary", label: "Short summary", type: "text", placeholder: "One line shown under the title" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "highlights", label: "Key highlights", type: "list", placeholder: "Private pool\n5 min to King Fahd Road" },
      ],
    },
    {
      title: "Price",
      fields: [
        { key: "price", label: "Price (or starting price)", type: "number", half: true },
        { key: "currency", label: "Currency", type: "select", half: true, options: CURRENCIES },
        { key: "price_max", label: "Price up to (optional, for ranges)", type: "number", half: true },
        { key: "price_period", label: "Rent period", type: "select", half: true, options: [["", "—"], ["year", "Per year"], ["month", "Per month"]] },
        { key: "price_on_request", label: "Price on request (hide price)", type: "bool" },
      ],
    },
    {
      title: "Specs",
      fields: [
        { key: "beds", label: "Bedrooms (0 = studio)", type: "number", half: true },
        { key: "beds_max", label: "Bedrooms up to (off-plan ranges)", type: "number", half: true },
        { key: "baths", label: "Bathrooms", type: "number", half: true },
        { key: "area", label: "Built-up area", type: "number", half: true },
        { key: "area_unit", label: "Area unit", type: "select", half: true, options: [["sqm", "sqm"], ["sqft", "sqft"]] },
        { key: "furnishing", label: "Furnishing", type: "select", half: true, options: [["", "—"], ["furnished", "Furnished"], ["semi-furnished", "Semi-furnished"], ["unfurnished", "Unfurnished"]] },
        { key: "amenities", label: "Amenities", type: "list", placeholder: "Swimming pool\nGym\nCovered parking" },
      ],
    },
    {
      title: "Location",
      fields: [
        { key: "community_id", label: "Community / area", type: "select", half: true, options: [["", "—"], ...communities.map((c) => [c.id, c.name] as [string, string])] },
        { key: "city", label: "City", type: "text", half: true },
        { key: "country", label: "Country", type: "text", half: true },
        { key: "address", label: "Address / landmark", type: "text", half: true },
        { key: "location", label: "Map pin (click the map)", type: "location" },
      ],
    },
    {
      title: "Off-plan project",
      fields: [
        { key: "developer_id", label: "Developer", type: "select", half: true, options: [["", "—"], ...developers.map((d) => [d.id, d.name] as [string, string])] },
        { key: "handover", label: "Handover", type: "text", half: true, placeholder: "Q4 2027" },
        { key: "payment_plan", label: "Payment plan", type: "payment_plan" },
      ],
    },
    {
      title: "Media",
      fields: [
        { key: "images", label: "Photos (first = cover)", type: "images" },
        { key: "floor_plans", label: "Floor plans", type: "images" },
        { key: "brochure_url", label: "Brochure PDF", type: "image" },
        { key: "video_url", label: "Video URL (YouTube)", type: "url", half: true },
        { key: "tour_url", label: "360° tour URL", type: "url", half: true },
      ],
    },
    {
      title: "Compliance & SEO",
      fields: [
        { key: "permit_number", label: "Ad licence / permit no. (REGA FAL, DLD Trakheesi)", type: "text", half: true },
        { key: "reference", label: "Internal reference", type: "text", half: true },
        { key: "slug", label: "URL slug", type: "text", half: true, help: "Auto from title when empty" },
        { key: "sort_order", label: "Sort order", type: "number", half: true },
        { key: "seo_title", label: "SEO title", type: "text" },
        { key: "seo_description", label: "SEO description", type: "text" },
      ],
    },
  ];

  return (
    <EntityManager
      entity="properties" title="Properties" singular="Property" initial={initial} groups={groups}
      defaults={{ listing_type: "sale", property_type: "apartment", status: "available", currency: defaults.currency, area_unit: defaults.unit, images: [], amenities: [], highlights: [], payment_plan: [], floor_plans: [] }}
      listTitle={(r) => String(r.title)}
      listSubtitle={(r) => [
        priceLabel(r as never),
        bedsLabel(r.beds as number | null, r.beds_max as number | null),
        (r.community as { name?: string } | null)?.name ?? r.city,
      ].filter(Boolean).join(" · ")}
      listImage={(r) => (r.images as string[] | undefined)?.[0]}
      listBadges={(r) => [LISTING_TYPE_LABEL[r.listing_type as ReListingType], titleCase(String(r.status))]}
      publicPath={(r) => `/properties/${r.slug}`}
    />
  );
}

export function CommunitiesManager({ initial }: { initial: Row[] }) {
  const groups: FieldGroup[] = [
    {
      title: "Area guide",
      fields: [
        { key: "name", label: "Name", type: "text", half: true, placeholder: "Al Malqa" },
        { key: "city", label: "City", type: "text", half: true },
        { key: "country", label: "Country", type: "text", half: true },
        { key: "featured", label: "Featured on home page", type: "bool", half: true },
        { key: "image_url", label: "Cover image", type: "image" },
        { key: "summary", label: "One-line summary", type: "text" },
        { key: "description", label: "Guide", type: "textarea" },
        { key: "highlights", label: "Why live / invest here", type: "list" },
      ],
    },
    {
      title: "Market data",
      fields: [
        { key: "avg_price", label: "Average price", type: "number", half: true },
        { key: "currency", label: "Currency", type: "select", half: true, options: CURRENCIES },
        { key: "rental_yield", label: "Gross rental yield %", type: "number", half: true },
        { key: "sort_order", label: "Sort order", type: "number", half: true },
        { key: "location", label: "Map pin", type: "location" },
        { key: "slug", label: "URL slug", type: "text", half: true },
      ],
    },
  ];
  return (
    <EntityManager
      entity="communities" title="Communities" singular="Community" initial={initial} groups={groups}
      defaults={{ currency: "SAR", highlights: [] }}
      listTitle={(r) => String(r.name)}
      listSubtitle={(r) => [r.city, r.country].filter(Boolean).join(", ")}
      listImage={(r) => r.image_url as string | null}
      publicPath={(r) => `/communities/${r.slug}`}
    />
  );
}

export function DevelopersManager({ initial }: { initial: Row[] }) {
  const groups: FieldGroup[] = [
    {
      title: "Developer",
      fields: [
        { key: "name", label: "Name", type: "text", half: true },
        { key: "website", label: "Website", type: "url", half: true },
        { key: "logo_url", label: "Logo", type: "image" },
        { key: "description", label: "About", type: "textarea" },
        { key: "sort_order", label: "Sort order", type: "number", half: true },
        { key: "slug", label: "URL slug", type: "text", half: true },
      ],
    },
  ];
  return (
    <EntityManager
      entity="developers" title="Developers" singular="Developer" initial={initial} groups={groups}
      defaults={{}}
      listTitle={(r) => String(r.name)}
      listSubtitle={(r) => String(r.website ?? "")}
      listImage={(r) => r.logo_url as string | null}
      publicPath={(r) => `/properties?developer=${r.slug}`}
    />
  );
}
