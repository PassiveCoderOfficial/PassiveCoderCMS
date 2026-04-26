import { MousePointerClick, Paintbrush, Rocket } from "lucide-react";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Pick your plan",
    desc: "Choose Standard or Premium. Start with a 24-hour trial — no payment required to test drive.",
  },
  {
    icon: Paintbrush,
    title: "Customize your site",
    desc: "Choose a template built for your industry. Add your logo, colors, content, and services in minutes.",
  },
  {
    icon: Rocket,
    title: "Go live",
    desc: "Connect your domain (or get one from us). Your site is published and ready for customers instantly.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Up and running in minutes</h2>
          <p className="mt-4 text-lg text-gray-600">Three steps and your business is online.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-[33%] right-[33%] h-0.5 bg-gradient-to-r from-orange-200 via-rose-300 to-orange-200" />

          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative text-center">
              <div className="relative inline-flex">
                <div className="w-20 h-20 bg-white border-2 border-orange-200 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <Icon className="w-8 h-8 text-orange-500" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-orange-500 to-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-bold text-gray-900 text-lg">{title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
