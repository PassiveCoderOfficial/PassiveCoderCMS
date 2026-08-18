// Server-only — push booking lifecycle to ExpertNear.Me so a completed job
// triggers ENM's review-request follow-up sequence. One direction: PC owns the
// booking, ENM owns follow-up.

const ENM_BASE_URL = (process.env.ENM_BASE_URL ?? "https://expertnear.me").replace(/\/$/, "");

export type PcBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type EnmBookingSyncInput = {
  appointmentId: string;
  tenantId: string;
  status: PcBookingStatus;
  scheduledAt?: string;
  endsAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  message?: string;
  value?: number;
};

/**
 * Fire-and-forget. A tenant without an ENM API key simply has no sync, which is
 * the normal case — never let this path affect the booking write.
 */
export async function syncBookingToENM(
  apiKey: string | null | undefined,
  input: EnmBookingSyncInput
): Promise<void> {
  if (!apiKey) return;

  try {
    const res = await fetch(`${ENM_BASE_URL}/api/public/bookings/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(
        `ENM booking sync failed (${res.status}) for appointment ${input.appointmentId}`
      );
    }
  } catch (err) {
    console.error("ENM booking sync error:", err);
  }
}
