import Link from "next/link";

const LOGO = "https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1777257556858_Passive_Coder_Web_logo.png";

export default function FooterSection() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <a href="https://passivecoder.com">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO} alt="Passive Coder" className="h-9 w-auto brightness-0 invert" />
              </a>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Professional website builder for local service businesses. Built and trusted by teams across 8 countries.
            </p>
            <p className="text-xs mt-4 text-gray-600">passivecoder.com</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="hover:text-orange-400 transition-colors">Features</a></li>
              <li><a href="#templates" className="hover:text-orange-400 transition-colors">Templates</a></li>
              <li><a href="#pricing" className="hover:text-orange-400 transition-colors">Pricing</a></li>
              <li><Link href="/onboarding" className="hover:text-orange-400 transition-colors">Get Started</Link></li>
              <li><Link href="/dashboard" className="hover:text-orange-400 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#clients" className="hover:text-orange-400 transition-colors">Our Clients</a></li>
              <li><Link href="/contact" className="hover:text-orange-400 transition-colors">Contact</Link></li>
              <li><Link href="/contact?dept=sales" className="hover:text-orange-400 transition-colors">Sales</Link></li>
              <li><a href="#faq" className="hover:text-orange-400 transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-orange-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-orange-400 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>© {new Date().getFullYear()} Passive Coder. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
