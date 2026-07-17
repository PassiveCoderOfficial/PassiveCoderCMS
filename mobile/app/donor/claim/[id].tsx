import { useState } from "react";
import { ScrollView, Text, View, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, setToken } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { colors } from "../../../lib/theme";
import { Button, Card, Field, Input, PasswordInput } from "../../../components/ui";

export default function ClaimScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refresh } = useAuth();
  const [step, setStep] = useState<"start" | "verify">("start");
  const [hint, setHint] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    const r = await api("/api/donors/auth/claim", "POST", { donor_id: id });
    setBusy(false);
    if (!r.ok) { Alert.alert("Error", r.data.error ?? "Try again"); return; }
    setHint(r.data.phone_hint ?? ""); setStep("verify");
  }
  async function verify() {
    setBusy(true);
    const r = await api<{ token?: string }>("/api/donors/auth/verify-claim", "POST", { donor_id: id, code, password });
    setBusy(false);
    if (!r.ok) { Alert.alert("Error", (r.data as any).error ?? "Try again"); return; }
    if (r.data.token) await setToken(r.data.token);
    await refresh();
    router.replace(`/donor/${id}`);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, flexGrow: 1, justifyContent: "center" }}>
      <View style={{ alignItems: "center", gap: 6 }}>
        <Ionicons name="key" size={38} color={colors.red600} />
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>Claim your profile</Text>
      </View>
      <Card style={{ gap: 12 }}>
        {step === "start" ? (
          <>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>
              We&apos;ll text a 6-digit code to the phone number on this profile. Enter it to take control and set your own password.
            </Text>
            <Button title="Send code" onPress={start} loading={busy} />
          </>
        ) : (
          <>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>Code sent to the number ending in {hint}.</Text>
            <Field label="6-digit code" required>
              <Input value={code} onChangeText={(v) => setCode(v.replace(/\D/g, ""))} keyboardType="number-pad" maxLength={6}
                style={{ textAlign: "center", letterSpacing: 8, fontWeight: "700" }} />
            </Field>
            <Field label="Your new password" required>
              <PasswordInput value={password} onChangeText={setPassword} />
            </Field>
            <Button title="Claim profile" onPress={verify} loading={busy} />
          </>
        )}
      </Card>
    </ScrollView>
  );
}
