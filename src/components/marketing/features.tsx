import {
  Globe, ShoppingBag, Image, BarChart3, Shield, Zap,
  Smartphone, Mail, Archive, Palette, FormInput, HeadphonesIcon,
} from "lucide-react";

const FEATURES = [
  { icon: Globe, title: "Custom Domain", desc: "Connect your own domain or get one through us with one click." },
  { icon: Palette, title: "Visual Page Builder", desc: "Drag-and-drop editor. Build any layout without touching code." },
  { icon: ShoppingBag, title: "Built-in Ecommerce", desc: "Sell products and services. Payments, orders, delivery — all included." },
  { icon: FormInput, title: "Contact Forms", desc: "Capture leads with custom forms. Submissions go straight to your inbox." },
  { icon: Image, title: "Media Manager", desc: "Upload, organize, and use your images and files from one place." },
  { icon: Smartphone, title: "Mobile Responsive", desc: "Every template looks perfect on phones, tablets, and desktops." },
  { icon: Archive, title: "Daily Backups", desc: "7-day rolling backups. Restore with one click if anything goes wrong." },
  { icon: Shield, title: "SSL & Security", desc: "Free SSL certificate. Your site is always secure and trusted by browsers." },
  { icon: Zap, title: "Fast by Default", desc: "Optimized images, global CDN, and A+ performance scores out of the box." },
  { icon: BarChart3, title: "Analytics Ready", desc: "Plug in Google Analytics, Plausible, or any tracking code with ease." },
  { icon: Mail, title: "DNS Management", desc: "Manage all DNS records — add MX, SPF, DKIM for any email provider." },
  { icon: HeadphonesIcon, title: "Real Support", desc: "Actual humans who know your business. Not just a knowledge base." },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Everything your business needs</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            One platform. No plugins, no extra costs, no technical headaches.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group p-6 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md hover:shadow-orange-50 transition-all">
              <div className="w-10 h-10 bg-orange-50 group-hover:bg-orange-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                <Icon className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
