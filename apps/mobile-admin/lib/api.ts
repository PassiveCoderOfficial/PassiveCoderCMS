// Thin fetch wrapper for the Next.js backend's Bearer-authed routes (domain
// connect/disconnect, and any future privileged endpoints this app calls).
// Unlike cms/mobile/lib/api.ts, there's no offline GET cache here — v1
// domain calls are POST-only, mutating, privileged actions with no useful
// offline story.

import { supabase } from "./supabase";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "https://passivecoder.com";

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {}
): Promise<ApiResult<T>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {};
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json as T };
  } catch {
    return { ok: false, status: 0, data: { error: "You appear to be offline" } as T };
  }
}
