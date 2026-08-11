import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Store, ArrowRight, Banknote, Truck, LineChart, ShieldCheck, Headset,
  UserPlus, PackagePlus, Wallet, Check,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { currentVendor } from "@/lib/marketplace-ecom/vendor-auth";

export const metadata = {
  title: "Sell with us",
  description: "Open your shop and reach buyers across Bangladesh. No monthly fee.",
};

const BENEFITS = [
  { icon: Banknote, title: "No monthly fee", body: "You only pay commission on what you actually sell. Nothing upfront, nothing if you sell nothing." },
  { icon: Truck, title: "We handle delivery rates", body: "Flat, predictable delivery charges nationwide. Book any courier and add the tracking number." },
  { icon: Wallet, title: "Paid by bKash", body: "Earnings land in your bKash after each order clears its return window. Every taka is itemised." },
  { icon: LineChart, title: "Your own dashboard", body: "Track orders, stock and earnings in one place. See exactly what you earned on every sale." },
  { icon: ShieldCheck, title: "Verified marketplace", body: "Every shop is checked before it goes live, so buyers trust what they see." },
  { icon: Headset, title: "Support in Bangla", body: "Real people on the phone when an order or a payout needs sorting out." },
];

const STEPS = [
  { icon: UserPlus, title: "Apply", body: "Tell us about your shop — name, contact, pickup address and trade licence." },
  { icon: ShieldCheck, title: "Get verified", body: "We check your details, usually within one to two working days." },
  { icon: PackagePlus, title: "List products", body: "Add your products with photos and prices. Our team approves each listing." },
  { icon: Wallet, title: "Sell and get paid", body: "Pack, ship and get paid to bKash after delivery." },
];

export default async function VendorLandingPage() {
  const tenantId = (await headers()).get("x-tenant-id");

  // An approved seller who lands here wants their shop, not the pitch.
  const vendor = await currentVendor();
  if (vendor) redirect("/vendor/dashboard");

  const admin = await createAdminClient();
  const [{ count: sellerCount }, { data: identity }, { data: rates }] = await Promise.all([
    admin
      .from("vendors")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId ?? "")
      .eq("status", "approved")
      .contains("capabilities", ["ecommerce"]),
    admin.from("site_identity").select("site_name").eq("tenant_id", tenantId ?? "").maybeSingle(),
    admin
      .from("vendors")
      .select("commission_rate")
      .eq("tenant_id", tenantId ?? "")
      .eq("status", "approved")
      .contains("capabilities", ["ecommerce"]),
  ]);

  const siteName = identity?.site_name ?? "our marketplace";
  // Quote the real floor rather than inventing a number — sellers compare this
  // against Daraz's published rates.
  const lowestCommission = (rates ?? []).length
    ? Math.min(...(rates ?? []).map((r) => Number(r.commission_rate)))
    : 12;

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[#1A1330]">
        <div aria-hidden className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#FF5A1F]/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-24 w-[380px] h-[380px] rounded-full bg-[#FF5A1F]/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur">
              <Store className="w-3.5 h-3.5 text-[#FF9A6C]" />
              {sellerCount ?? 0} shops already selling
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Sell to buyers
              <br />
              <span className="text-[#FF7A45]">all over Bangladesh</span>
            </h1>
            <p className="mt-5 text-white/70 text-lg max-w-lg leading-relaxed">
              Open your shop on {siteName} in minutes. No monthly fee, no setup cost —
              commission from just {lowestCommission}% on what you sell.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/vendor/signup"
                className="inline-flex items-center gap-2 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-7 py-3.5 rounded-full font-semibold transition-colors"
              >
                Start selling <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/vendor/dashboard"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-7 py-3.5 rounded-full font-semibold backdrop-blur transition-colors"
              >
                Seller login
              </Link>
            </div>

            <ul className="mt-8 space-y-2 text-sm text-white/70">
              {["No monthly or listing fees", "Payouts to your bKash", "Cash on delivery handled for you"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#FF9A6C] shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block">
            <div className="ml-auto max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
              <p className="text-xs font-semibold text-[#FF5A1F] uppercase tracking-wide">
                What you keep
              </p>
              <p className="mt-3 text-sm text-[#667085]">On a ৳2,000 sale at {lowestCommission}% commission</p>
              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-[#1A1330]">
                  <span>Item price</span><span className="font-medium">৳2,000</span>
                </div>
                <div className="flex justify-between text-[#667085]">
                  <span>Commission ({lowestCommission}%)</span>
                  <span>−৳{Math.round(2000 * (lowestCommission / 100)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-[#EAECF0] pt-2.5 text-[#1A1330] font-bold text-base">
                  <span>You earn</span>
                  <span>৳{(2000 - Math.round(2000 * (lowestCommission / 100))).toLocaleString()}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-[#98A2B3] leading-relaxed">
                Delivery is charged to the buyer separately. COD collection fees are shown
                on every order before payout.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1330]">Why sell with us</h2>
          <p className="text-[#667085] mt-2">
            Everything you need to run a shop online, without the overhead.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-[#EAECF0] p-6 hover:border-[#FF5A1F]/50 hover:shadow-lg transition-all">
              <span className="w-11 h-11 rounded-xl bg-[#FFF6F2] flex items-center justify-center">
                <b.icon className="w-5 h-5 text-[#FF5A1F]" />
              </span>
              <h3 className="mt-4 font-semibold text-[#1A1330]">{b.title}</h3>
              <p className="mt-1.5 text-sm text-[#667085] leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[#FFF6F2] border-y border-[#FFE4D6] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-[#1A1330]">How it works</h2>
            <p className="text-[#667085] mt-2">From application to your first payout.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl bg-white border border-[#FFE4D6] p-6">
                <span className="absolute top-5 right-5 text-3xl font-extrabold text-[#FFE4D6]">
                  {i + 1}
                </span>
                <span className="w-11 h-11 rounded-xl bg-[#FFF6F2] flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-[#FF5A1F]" />
                </span>
                <h3 className="mt-4 font-semibold text-[#1A1330]">{s.title}</h3>
                <p className="mt-1.5 text-sm text-[#667085] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="rounded-3xl bg-[#1A1330] px-6 sm:px-12 py-14 text-center relative overflow-hidden">
          <div aria-hidden className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full bg-[#FF5A1F]/20 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to open your shop?
            </h2>
            <p className="text-white/70 mt-3 max-w-xl mx-auto">
              Apply in a few minutes. We check your details and get you selling, usually
              within one to two working days.
            </p>
            <Link
              href="/vendor/signup"
              className="inline-flex items-center gap-2 mt-8 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-8 py-4 rounded-full font-semibold transition-colors"
            >
              <Store className="w-4 h-4" /> Create your seller account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
