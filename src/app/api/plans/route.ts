import { NextResponse } from "next/server";

const PLANS = [
  {
    id: "standard",
    name: "Basic",
    price_yearly: 290,
    price_monthly: 49,
    storage_gb: 10,
    visitor_limit_monthly: 5000,
    overage_cents_per_1k: 200,
    features: [
      "DIY website builder",
      "Free .com/.org/.net TLD domain (1 year)",
      "10 GB storage",
      "5,000 visitors/month included",
      "$2 per 1,000 extra visitors",
      "Page builder",
      "SSL certificate",
      "Daily backups",
      "Uptime monitoring",
      "Email support",
    ],
  },
  {
    id: "premium",
    name: "Pro",
    price_yearly: 449,
    price_monthly: 79,
    storage_gb: 50,
    visitor_limit_monthly: 25000,
    overage_cents_per_1k: 100,
    features: [
      "DIY website builder",
      "Free .com/.org/.net TLD domain (1 year)",
      "50 GB storage",
      "25,000 visitors/month included",
      "$1 per 1,000 extra visitors",
      "Full design & layout support",
      "Configuration assistance",
      "E-Commerce functionality",
      "ExpertNear.Me Pro subscription (free)",
      "SSL certificate",
      "Daily backups",
      "VIP priority support",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    price_yearly: 0,
    price_monthly: 0,
    storage_gb: 100,
    visitor_limit_monthly: 0,
    overage_cents_per_1k: 0,
    features: [
      "Multiple websites",
      "100 GB storage",
      "Custom domain",
      "White-label option",
      "All features",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
];

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}
