// API client for the donor site. Mirrors the web's donorApi(), but carries
// the session as a Bearer token (native can't use httpOnly cookies) and
// caches GETs so the app still opens usefully with no connectivity.

import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_BASE: string =
  (Constants.expoConfig?.extra as { apiBase?: string })?.apiBase ??
  "https://blood.passivecoder.com";

const TOKEN_KEY = "donor_session_token";
const CACHE_PREFIX = "cache:";

let memoryToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return memoryToken;
}

export async function setToken(token: string | null) {
  memoryToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

export async function api<T = any>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
  opts: { cache?: boolean } = {},
): Promise<ApiResult<T>> {
  const token = await getToken();
  const headers: Record<string, string> = { "X-Client": "app" };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));

    // Cache successful GETs for offline reads.
    if (opts.cache && method === "GET" && res.ok) {
      AsyncStorage.setItem(CACHE_PREFIX + path, JSON.stringify(data)).catch(() => {});
    }
    return { ok: res.ok, status: res.status, data: data as T };
  } catch {
    // Offline: fall back to the last good response for this exact path.
    if (opts.cache && method === "GET") {
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + path).catch(() => null);
      if (cached) {
        return { ok: true, status: 200, data: JSON.parse(cached) as T, };
      }
    }
    return { ok: false, status: 0, data: { error: "You appear to be offline" } as T };
  }
}

/** Multipart upload (profile photos) — fetch handles the boundary itself. */
export async function uploadPhoto(uri: string, donorId?: string): Promise<ApiResult> {
  const token = await getToken();
  const form = new FormData();
  const name = uri.split("/").pop() ?? "photo.jpg";
  const ext = name.split(".").pop()?.toLowerCase();
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  // RN's FormData takes this shape for files.
  form.append("file", { uri, name, type } as unknown as Blob);
  if (donorId) form.append("donor_id", donorId);

  try {
    const res = await fetch(`${API_BASE}/api/donors/photo`, {
      method: "POST",
      headers: {
        "X-Client": "app",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Upload failed — check your connection" } };
  }
}

export { API_BASE };
