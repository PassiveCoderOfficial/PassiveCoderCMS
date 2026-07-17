import { useState } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { colors, radius, BLOOD_GROUPS } from "../lib/theme";
import { Button, Card, Field, Input, PasswordInput } from "../components/ui";

type Mode = "login" | "signup" | "forgot" | "reset";

const TITLES: Record<Mode, string> = {
  login: "Log in", signup: "Create account", forgot: "Forgot password", reset: "Set new password",
};

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const params = useLocalSearchParams<{ next?: string }>();
  const [mode, setMode] = useState<Mode>("login");
  const [f, setF] = useState({ phone: "", password: "", name: "", blood_group: "O+", code: "" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  function done() {
    if (params.next) router.replace(params.next as never);
    else router.replace("/(tabs)");
  }

  async function submit() {
    setBusy(true);
    try {
      if (mode === "login") {
        const r = await login(f.phone, f.password);
        if (r.ok) return done();
        Alert.alert("Login failed", r.error ?? "Try again");
      } else if (mode === "signup") {
        const r = await signup({ name: f.name, phone: f.phone, password: f.password, blood_group: f.blood_group });
        if (r.ok) return done();
        Alert.alert("Signup failed", r.error ?? "Try again");
      } else if (mode === "forgot") {
        const r = await api("/api/donors/auth/forgot", "POST", { phone: f.phone });
        if (r.ok) { setMode("reset"); setNotice("Code sent — enter it with your new password."); }
        else Alert.alert("Error", r.data.error ?? "Try again");
      } else {
        const r = await api("/api/donors/auth/reset", "POST", { phone: f.phone, code: f.code, password: f.password });
        if (r.ok) { setNotice(null); return done(); }
        Alert.alert("Error", r.data.error ?? "Try again");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, flexGrow: 1, justifyContent: "center" }}>
      <View style={{ alignItems: "center", gap: 6 }}>
        <Ionicons name="water" size={40} color={colors.red600} />
        <Text style={styles.title}>{TITLES[mode]}</Text>
        {notice && <Text style={{ color: colors.green700, fontSize: 12 }}>{notice}</Text>}
      </View>

      <Card style={{ gap: 12 }}>
        {mode === "signup" && (
          <>
            <Field label="Your name" required>
              <Input value={f.name} onChangeText={(v) => set("name", v)} />
            </Field>
            <Field label="Your blood group" required>
              <View style={styles.groupGrid}>
                {BLOOD_GROUPS.map((g) => {
                  const active = f.blood_group === g;
                  return (
                    <Pressable key={g} onPress={() => set("blood_group", g)}
                      style={[styles.groupBtn, active && { backgroundColor: colors.red600, borderColor: colors.red600 }]}>
                      <Text style={{ fontWeight: "700", color: active ? colors.white : colors.text }}>{g}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>
          </>
        )}

        {mode !== "reset" && (
          <Field label="Phone number" required>
            <View style={{ flexDirection: "row" }}>
              <View style={styles.prefix}><Text style={{ color: colors.textMuted }}>+88</Text></View>
              <Input style={{ flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                placeholder="01XXXXXXXXX" keyboardType="number-pad" maxLength={11}
                value={f.phone} onChangeText={(v) => set("phone", v.replace(/\D/g, ""))} />
            </View>
          </Field>
        )}

        {mode === "reset" && (
          <Field label="6-digit code" required>
            <Input placeholder="123456" keyboardType="number-pad" maxLength={6}
              value={f.code} onChangeText={(v) => set("code", v.replace(/\D/g, ""))}
              style={{ textAlign: "center", letterSpacing: 8, fontWeight: "700" }} />
          </Field>
        )}

        {mode !== "forgot" && (
          <Field label={mode === "reset" ? "New password" : "Password"} required>
            <PasswordInput value={f.password} onChangeText={(v) => set("password", v)} />
          </Field>
        )}

        <Button title={TITLES[mode]} onPress={submit} loading={busy} />
      </Card>

      <View style={{ alignItems: "center", gap: 6 }}>
        {mode === "login" && (
          <>
            <Pressable onPress={() => setMode("signup")}>
              <Text style={styles.link}>New here? Create an account</Text>
            </Pressable>
            <Pressable onPress={() => setMode("forgot")}>
              <Text style={styles.linkMuted}>Forgot password?</Text>
            </Pressable>
          </>
        )}
        {mode !== "login" && (
          <Pressable onPress={() => { setMode("login"); setNotice(null); }}>
            <Text style={styles.link}>Back to login</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  groupGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  groupBtn: {
    width: "23%", paddingVertical: 8, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.borderStrong, alignItems: "center", backgroundColor: colors.white,
  },
  prefix: {
    justifyContent: "center", paddingHorizontal: 12,
    borderWidth: 1, borderRightWidth: 0, borderColor: colors.borderStrong,
    borderTopLeftRadius: radius.md, borderBottomLeftRadius: radius.md, backgroundColor: "#f9fafb",
  },
  link: { color: colors.red600, fontWeight: "600", fontSize: 14 },
  linkMuted: { color: colors.textMuted, fontSize: 14, textDecorationLine: "underline" },
});
