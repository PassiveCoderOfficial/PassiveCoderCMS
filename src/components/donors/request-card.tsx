"use client";

import { useState } from "react";
import { Phone, MapPin, Clock, Check, X, Archive, RotateCcw, AlertTriangle } from "lucide-react";
import { donorApi } from "@/app/(site)/donors/ui";

export interface BloodRequest {
  id: string; patient_name: string | null; blood_group: string;
  bags_needed: number; hospital: string | null;
  district: string | null; police_station: string | null; area: string | null;
  contact_phone: string; note: string | null;
  needed_by: string | null; status: string;
  deadline_over?: boolean; is_mine?: boolean;
  archived_at?: string | null; created_at: string;
}

export function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

/**
 * One urgent request. `compact` is the home-page grid variant; the full
 * variant adds the note and (for the creator only) status actions.
 */
export function RequestCard({ req, compact, onChanged }: {
  req: BloodRequest; compact?: boolean; onChanged?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const where = [req.hospital, req.area, req.police_station, req.district].filter(Boolean).join(", ");
  const over = !!req.deadline_over;
  const archived = req.status === "archived";

  async function setStatus(status: "fulfilled" | "cancelled" | "archived" | "open") {
    setBusy(true);
    const r = await donorApi("/api/donors/requests", "PATCH", { id: req.id, status });
    setBusy(false);
    if (r.ok) onChanged?.();
    else alert(r.data.error ?? "Failed");
  }

  return (
    <div className={`rounded-2xl border bg-white p-4 space-y-2 ${
      over ? "border-red-300 ring-1 ring-red-200" : "border-red-100"
    } ${archived ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <span className={`flex items-center justify-center rounded-full font-extrabold text-white shrink-0 ${
          compact ? "w-10 h-10 text-xs" : "w-12 h-12 text-sm"
        } ${over ? "bg-red-700" : "bg-red-600"}`}>
          {req.blood_group}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-bold text-gray-900 ${compact ? "text-sm" : ""}`}>
            {req.bags_needed} bag{req.bags_needed > 1 ? "s" : ""} needed
            {req.patient_name ? ` for ${req.patient_name}` : ""}
          </p>
          {where && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 shrink-0" /> {where}
            </p>
          )}
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 shrink-0" /> {timeAgo(req.created_at)}
          </p>
        </div>
      </div>

      {over && (
        <p className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
          <AlertTriangle className="w-3 h-3" /> Deadline over
        </p>
      )}
      {archived && (
        <p className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">
          <Archive className="w-3 h-3" /> Archived
        </p>
      )}

      {!compact && req.note && <p className="text-sm text-gray-600">{req.note}</p>}

      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <a href={`tel:${req.contact_phone}`}
          className={`inline-flex items-center gap-1.5 rounded-lg bg-red-600 font-semibold text-white transition-colors hover:bg-red-700 ${
            compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
          }`}>
          <Phone className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} /> Call
        </a>
        <a href={`https://wa.me/${req.contact_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-lg bg-green-600 font-semibold text-white transition-colors hover:bg-green-700 ${
            compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
          }`}>
          WhatsApp
        </a>

        {/* Status actions belong to the person who posted it — never public. */}
        {!compact && req.is_mine && (
          <div className="ml-auto flex items-center gap-1.5">
            {archived ? (
              <button onClick={() => setStatus("open")} disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs text-green-700 hover:bg-green-50">
                <RotateCcw className="w-3.5 h-3.5" /> Unarchive
              </button>
            ) : (
              <>
                <button onClick={() => setStatus("fulfilled")} disabled={busy}
                  className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs text-green-700 hover:bg-green-50">
                  <Check className="w-3.5 h-3.5" /> Fulfilled
                </button>
                <button onClick={() => setStatus("archived")} disabled={busy}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
                <button onClick={() => setStatus("cancelled")} disabled={busy}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
