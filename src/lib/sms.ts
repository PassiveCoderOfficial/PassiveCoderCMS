// BD Bulk SMS (bdbulksms.net) sender. No-ops with an error when the token
// is unset so flows can surface "SMS not configured" instead of throwing.

export async function sendSms(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.BDBULKSMS_TOKEN;
  if (!token) {
    console.warn("[sms] BDBULKSMS_TOKEN not set — skipping send to", to);
    return { ok: false, error: "sms_not_configured" };
  }

  try {
    const res = await fetch("https://api.bdbulksms.net/api.php?json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token, to, message }),
    });
    const body = await res.text();
    if (!res.ok) return { ok: false, error: `sms_http_${res.status}` };
    try {
      const json = JSON.parse(body);
      const first = Array.isArray(json) ? json[0] : json;
      if (first?.status && String(first.status).toUpperCase() !== "SENT") {
        return { ok: false, error: first.statusmsg ?? "sms_failed" };
      }
    } catch {
      if (/error/i.test(body)) return { ok: false, error: body.slice(0, 120) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "sms_failed" };
  }
}
