import type { Metadata } from "next";
import { DEMO_SALES_WHATSAPP, waLink } from "@/modules/demo/links";

export const metadata: Metadata = { title: "Demo paused", robots: { index: false, follow: false } };

export default async function DemoPausedPage({ searchParams }: { searchParams: Promise<{ name?: string }> }) {
  const { name } = await searchParams;
  const site = name?.slice(0, 80) || "this business";
  const href = waLink(DEMO_SALES_WHATSAPP, `Hi Passive Coder, the demo website for ${site} is paused. I want to make it live.`);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-white">Demo paused</h1>
        <p className="text-gray-400">
          The demo website for <span className="text-white font-semibold">{site}</span> has been paused.
          Everything is saved. Message us on WhatsApp to make it live on your own domain.
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-[#25D366] hover:brightness-110 text-white font-bold px-6 py-3.5 rounded-xl"
        >
          Make it live on WhatsApp
        </a>
        <p className="text-xs text-gray-600">Built by Passive Coder</p>
      </div>
    </div>
  );
}
