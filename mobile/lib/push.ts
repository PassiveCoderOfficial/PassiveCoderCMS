import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, API_BASE } from "./api";

const TOKEN_CACHE = "expo_push_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Ask for permission, get this install's Expo push token, and register it
 * against the logged-in donor so urgent requests nearby can reach them.
 * Safe to call repeatedly — the server upserts on the token.
 */
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;   // simulators can't get a token

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("urgent", {
      name: "Urgent blood requests",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#dc2626",
    });
  }

  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } })?.eas?.projectId;
  const tokenRes = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenRes.data;
  await AsyncStorage.setItem(TOKEN_CACHE, token);

  await api("/api/donors/devices", "POST", { expo_token: token, platform: Platform.OS });
  return token;
}

/** Stop this device receiving pushes for the account that's logging out. */
export async function unregisterPush() {
  const token = await AsyncStorage.getItem(TOKEN_CACHE);
  if (!token) return;
  await fetch(`${API_BASE}/api/donors/devices?expo_token=${encodeURIComponent(token)}`, {
    method: "DELETE",
    headers: { "X-Client": "app" },
  }).catch(() => {});
}
