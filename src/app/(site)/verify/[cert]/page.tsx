import { headers } from "next/headers";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { ShieldX } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { publicView, label, RESULT_FIELDS, CARD_ORDER, VERIFY_FIELDS, type ResultField } from "@/lib/results/fields";
import { findByCertificate, loadSettings, recentMisses } from "@/lib/results/load";
import { ResultCard } from "@/components/blocks/results/result-card";
import { PrintButton } from "./print-button";

interface Props { params: Promise<{ cert: string }> }

export const metadata: Metadata = { title: "Certificate Verification", robots: { index: false, follow: false } };

const WINDOW_MIN = 10;
const MAX_MISSES = 20;

/**
 * /verify/<certificate> — permanent verification link printed as a QR code on
 * certificates. Needs no extra proof, so it only shows VERIFY_FIELDS (name,
 * course, result, dates, photo); personal details stay behind the search
 * block's lookup rules. Misses are throttled per IP like the lookup API.
 */
export default async function VerifyPage({ params }: Props) {
  const cert = decodeURIComponent((await params).cert).slice(0, 100);
  const h = await headers();
  const tenantId = h.get("x-tenant-id");
  if (!tenantId) return <NotFound cert={cert} />;

  const admin = await createAdminClient();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if ((await recentMisses(admin, ip, WINDOW_MIN)) >= MAX_MISSES) return <NotFound cert={cert} throttled />;

  const [settings, row, { data: identity }] = await Promise.all([
    loadSettings(admin, tenantId),
    findByCertificate(admin, tenantId, cert),
    admin.from("site_identity").select("site_name").eq("tenant_id", tenantId).maybeSingle(),
  ]);
  await admin.from("results_lookup_log").insert({ tenant_id: tenantId, ip, found: !!row });
  if (!row) return <NotFound cert={cert} />;

  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const url = `https://${host}/verify/${encodeURIComponent(row.certificate_no.trim())}`;
  const qrSvg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
  const labels = Object.fromEntries(RESULT_FIELDS.map((f) => [f, label(settings, f)])) as Record<ResultField, string>;
  const order = CARD_ORDER.filter((f) => VERIFY_FIELDS.includes(f));

  return (
    <div className="px-4 py-10 sm:py-14 print:p-0">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Certificate Verification</h1>
            <p className="text-sm text-muted-foreground">This record is held by {settings.institute_name || identity?.site_name || "the institute"}.</p>
          </div>
          <PrintButton />
        </div>
        <ResultCard
          result={publicView(row, settings, "verify")}
          labels={labels}
          order={order}
          verified
          qrSvg={qrSvg}
          verifyUrl={url}
          institute={settings.institute_name || identity?.site_name}
          signatory={{ name: settings.signatory_name, title: settings.signatory_title, signature: settings.signature_url }}
        />
        <p className="text-xs text-muted-foreground print:mt-4">Verified on {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} at {host}/verify.</p>
      </div>
    </div>
  );
}

function NotFound({ cert, throttled }: { cert: string; throttled?: boolean }) {
  return (
    <div className="px-4 py-20">
      <div className="max-w-md mx-auto text-center">
        <ShieldX className="w-12 h-12 mx-auto text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">{throttled ? "Too many checks" : "No record found"}</h1>
        <p className="mt-2 text-muted-foreground">
          {throttled ? "Please wait a few minutes and try again." : <>We could not find a certificate numbered <strong>{cert}</strong>. Check the number and try again, or contact the institute.</>}
        </p>
      </div>
    </div>
  );
}
