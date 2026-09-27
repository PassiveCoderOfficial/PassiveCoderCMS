import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in dev rather than silently hitting an undefined host.
  // eslint-disable-next-line no-console
  console.warn(
    "EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set — copy .env.example to .env and fill them in."
  );
}

/**
 * SecureStore-backed storage adapter for the Supabase auth session.
 * Supabase session objects (access token + refresh token + user metadata)
 * are well under SecureStore's ~2KB-per-key comfort zone, so no chunking
 * is needed here.
 *
 * SecureStore has no web implementation (there is no OS keychain in a
 * browser) — calling it there throws "getValueWithKeyAsync is not a
 * function" and takes the whole app down before login even renders. Web
 * falls back to AsyncStorage (localStorage-backed), same as Supabase's own
 * default web behavior; it's a lower security bar than the OS keychain, but
 * this app's web target is a dev/preview surface, not the shipped build.
 */
const ExpoSecureStoreAdapter = Platform.OS === "web"
  ? AsyncStorage
  : {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
