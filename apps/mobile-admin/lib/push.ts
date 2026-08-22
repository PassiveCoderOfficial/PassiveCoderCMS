// Expo push registration. Modeled on cms/mobile/lib/push.ts's shape, but
// this app's device endpoint (/api/mobile-admin/devices) is Bearer-authed
// via lib/api.ts's apiFetch rather than a custom X-Client fetch helper, and
// this app has no per-category notification channel (no "urgent" concept
// here — deeplinks route to a specific tenant/contact instead).

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "./api";

const TOKEN_CACHE = "expo_push_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Ask for permission, get this install's Expo push token, and register it
 * against the logged-in user via POST /api/mobile-admin/devices. Safe to call
 * repeatedly — the server upserts on the token (see devices/route.ts).
 * Never throws — called fire-and-forget from login() and must not block or
 * fail the login flow if push permissions are denied or registration fails.
 */
export async function registerForPush(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null; // simulators can't get a token

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== "granted") return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } })?.eas?.projectId;
    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenRes.data;
    await AsyncStorage.setItem(TOKEN_CACHE, token);

    await apiFetch("/api/mobile-admin/devices", {
      method: "POST",
      body: { expo_token: token, platform: Platform.OS },
    });
    return token;
  } catch {
    // Best-effort — push registration failures must never surface to the
    // login flow.
    return null;
  }
}

/** Best-effort unregister on logout so a shared/reset device stops getting
 * this user's pushes. Must be called BEFORE supabase.auth.signOut() while
 * the Bearer token used by apiFetch is still valid. */
export async function unregisterPush(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_CACHE);
    if (!token) return;
    await apiFetch(`/api/mobile-admin/devices?expo_token=${encodeURIComponent(token)}`, {
      method: "DELETE",
    });
    await AsyncStorage.removeItem(TOKEN_CACHE);
  } catch {
    // Best-effort — logout must proceed regardless.
  }
}
