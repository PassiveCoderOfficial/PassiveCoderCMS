"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Siren, Loader2, ArrowRight } from "lucide-react";
import type { DonorRequestsBlockProps } from "@/types/cms";
import { donorApi } from "@/app/(site)/donors/ui";
import { RequestCard, type BloodRequest } from "@/components/donors/request-card";

const SHOW = 4;

/** Home-page teaser: the latest open urgent requests, 2-up on phones, 3-up on desktop. */
export function DonorRequestsBlock({ block }: { block: DonorRequestsBlockProps }) {
  const { data } = block;
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await donorApi("/api/donors/requests?view=open", "GET");
    if (r.ok) setRequests(r.data.requests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Nothing urgent? Don't take up space on the homepage.
  if (!loading && requests.length === 0) return null;

  const shown = requests.slice(0, SHOW);

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="text-center mb-5">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Siren className="w-6 h-6 text-red-600" /> {data.title || "Urgent Blood Requests"}
        </h2>
        {data.subtitle && <p className="text-sm text-muted-foreground mt-1">{data.subtitle}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {shown.map((r) => (
            <RequestCard key={r.id} req={r} compact onChanged={load} />
          ))}
        </div>
      )}

      {requests.length > SHOW && (
        <div className="mt-5 text-center">
          <Link href="/donors/requests"
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50">
            More Requests <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
