import { NextResponse } from "next/server";

const PLANS = [
  {
    id: "standard",
    name: "Standard",
    price_yearly: 199,
    storage_gb: 5,
    features: [
      "1 website",
      "5 GB storage",
      "Custom subdomain",
      "All templates",
      "Page builder",
      "Contact forms",
      "Email support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price_yearly: 399,
    storage_gb: 20,
    features: [
      "1 website",
      "20 GB storage",
      "Custom domain",
      "All templates",
      "Page builder",
      "Contact forms",
      "Bookings & appointments",
      "Priority support",
      "Analytics dashboard",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    price_yearly: 0,
    storage_gb: 100,
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
