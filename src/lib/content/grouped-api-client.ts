"use client";

import { toast } from "sonner";

/**
 * Fetch helper for the grouped content managers. A failed save used to be
 * ignored, so the editor showed the change as saved when the server had
 * refused it. Now the server's message is shown and the call throws, which
 * stops the caller's optimistic update.
 */
export function groupedApi(base: string) {
  return async function api(method: string, body?: unknown, params?: Record<string, string>): Promise<Response> {
    const url = params ? `${base}?${new URLSearchParams(params)}` : base;
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.clone().json().catch(() => ({})) as { error?: string };
      const msg = res.status === 403 ? "You don't have permission to change this site's content." : data.error ?? `Couldn't save (${res.status})`;
      toast.error(msg);
      throw new Error(msg);
    }
    return res;
  };
}
