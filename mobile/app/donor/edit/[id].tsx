import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { colors, radius, BLOOD_GROUPS } from "../../../lib/theme";
import { BD_DISTRICTS, BD_LOCATIONS } from "../../../lib/bd-locations";
import { Button, Card, Field, Input, Loading, PasswordInput } from "../../../components/ui";
import { LocationPicker, Select } from "../../../components/form";

export default function EditDonor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useAuth();
  const [ready, setReady] = useState(false);
  const [own, setOwn] = useState(false);
  const [verified, setVerified] = useState(false);
  const [f, setF] = useState({ name: "", blood_group: "O+", district: "", police_station: "", area: "", last_donated_on: "", never_donated: false });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await api(`/api/donors/${id}`, "GET");
    if (r.ok && r.data.viewer?.can_manage) {
      const p = r.data.donor;
      setOwn(r.data.viewer.id === p.id);
      setVerified(!!p.phone_verified);
      setF({
        name: p.name, blood_group: p.blood_group, district: p.district ?? "",
        police_station: p.police_station ?? "", area: p.area ?? "",
        last_donated_on: p.last_donated_on ?? "", never_donated: !!p.never_donated,
      });
      if (p.lat != null && p.lng != null) setGeo({ lat: p.lat, lng: p.lng });
      setReady(true);
    } else {
      Alert.alert("Not allowed", "You can't edit this profile.");
      router.back();
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const thanas = f.district ? BD_LOCATIONS[f.district] ?? [] : [];

  async function save() {
    setBusy(true);
    const r = await api(`/api/donors/${id}`, "PATCH", {
      ...f, last_donated_on: f.never_donated ? "" : f.last_donated_on,
      ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
    });
    setBusy(false);
    if (!r.ok) { Alert.alert("Failed", r.data.error ?? "Try again"); return; }
    router.replace(`/donor/${id}`);
  }

  if (!ready) return <Loading />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {own && <VerifyPhoneCard verified={verified} onDone={load} />}
      {own && <ChangePasswordCard />}
      <Card style={{ gap: 12 }}>
        <Field label="Name"><Input value={f.name} onChangeText={(v) => set("name", v)} /></Field>
        <Field label="Blood group">
          <Select value={f.blood_group} placeholder="O+" options={BLOOD_GROUPS} onChange={(v) => set("blood_group", v)} />
        </Field>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="District">
            <Select value={f.district} placeholder="—" options={BD_DISTRICTS} onChange={(v) => setF((p) => ({ ...p, district: v, police_station: "" }))} />
          </Field></View>
          <View style={{ flex: 1 }}><Field label="Thana">
            <Select value={f.police_station} placeholder="—" options={thanas} disabled={!f.district} onChange={(v) => set("police_station", v)} />
          </Field></View>
        </View>
        <Field label="Area"><Input value={f.area} onChangeText={(v) => set("area", v)} /></Field>
        <Field label="Pin location"><LocationPicker value={geo} onChange={setGeo} /></Field>
        <Field label="Last donated (YYYY-MM-DD)">
          <Input value={f.last_donated_on} onChangeText={(v) => set("last_donated_on", v)} placeholder="2025-01-15" editable={!f.never_donated} />
        </Field>
        <Pressable onPress={() => set("never_donated", !f.never_donated)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name={f.never_donated ? "checkbox" : "square-outline"} size={20} color={colors.green600} />
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>Never donated</Text>
        </Pressable>
        <Button title="Save changes" onPress={save} loading={busy} />
      </Card>
    </ScrollView>
  );
}

function VerifyPhoneCard({ verified, onDone }: { verified: boolean; onDone: () => void }) {
  const [step, setStep] = useState<"idle" | "sent">("idle");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (verified) {
    return <Card style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.green50, borderColor: "#bbf7d0" }}>
      <Ionicons name="shield-checkmark" size={16} color={colors.green700} />
      <Text style={{ color: colors.green700, fontSize: 14 }}>Your phone is verified.</Text>
    </Card>;
  }
  return (
    <Card style={{ gap: 10, backgroundColor: "#fffbeb", borderColor: "#fde68a" }}>
      <Text style={{ color: "#92400e", fontSize: 14 }}>Verify your phone to get a verified badge.</Text>
      {step === "idle" ? (
        <Button title="Send code" loading={busy} onPress={async () => {
          setBusy(true);
          const r = await api("/api/donors/auth/verify-phone", "POST", {});
          setBusy(false);
          if (r.ok) setStep("sent"); else Alert.alert("Error", r.data.error ?? "Try again");
        }} />
      ) : (
        <>
          <Input value={code} onChangeText={(v) => setCode(v.replace(/\D/g, ""))} keyboardType="number-pad" maxLength={6}
            placeholder="6-digit code" style={{ textAlign: "center", letterSpacing: 8 }} />
          <Button title="Verify" loading={busy} onPress={async () => {
            setBusy(true);
            const r = await api("/api/donors/auth/confirm-phone", "POST", { code });
            setBusy(false);
            if (r.ok) onDone(); else Alert.alert("Error", r.data.error ?? "Wrong code");
          }} />
        </>
      )}
    </Card>
  );
}

function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) {
    return <Pressable onPress={() => setOpen(true)}>
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="key-outline" size={16} color={colors.textMuted} />
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>Change password</Text>
      </Card>
    </Pressable>;
  }
  return (
    <Card style={{ gap: 10 }}>
      <Field label="Current password" required><PasswordInput value={cur} onChangeText={setCur} /></Field>
      <Field label="New password (6+)" required><PasswordInput value={next} onChangeText={setNext} /></Field>
      <Button title="Update password" loading={busy} onPress={async () => {
        setBusy(true);
        const r = await api("/api/donors/auth/change-password", "POST", { current_password: cur, new_password: next });
        setBusy(false);
        if (r.ok) { Alert.alert("Done", "Password updated."); setOpen(false); setCur(""); setNext(""); }
        else Alert.alert("Failed", r.data.error ?? "Try again");
      }} />
    </Card>
  );
}

const styles = StyleSheet.create({});
