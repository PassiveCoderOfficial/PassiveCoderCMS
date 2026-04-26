import { Suspense } from "react";
import ContactForm from "./contact-form";
import MarketingNav from "@/components/marketing/nav";
import FooterSection from "@/components/marketing/footer";

export const metadata = { title: "Contact — CMS Studio" };

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">Get in touch</h1>
          <p className="mt-3 text-gray-600">Questions about pricing? Need a custom plan? We're here to help.</p>
        </div>
        <Suspense fallback={<div className="h-96" />}>
          <ContactForm />
        </Suspense>
      </main>
      <FooterSection />
    </div>
  );
}
