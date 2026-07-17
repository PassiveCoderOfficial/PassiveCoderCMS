import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, radius, BLOOD_GROUPS } from "../../lib/theme";
import { BD_DISTRICTS, BD_LOCATIONS } from "../../lib/bd-locations";
import { Button, Card, Field, Input } from "../../components/ui";
import { LocationPicker, Select } from "../../components/form";

const RADII = ["5", "10", "15", "25", "50"];

export default function NewRequest() {
  const { me } = useAuth();
  const [f, setF] = useState({
    patient_name: "", blood_group: "", bags_needed: "1", hospital: "",
    district: "", police_station: "", area: "", contact_phone: "",
    note: "", radius_km: "10", hours: "6",
  });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (me === null) router.replace("/auth?next=/requests/new");
    if (me?.phone) setF((p) => ({ ...p, contact_phone: me.phone.replace(/^\+88/, "") }));
  }, [me]);

  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const thanas = f.district ? BD_LOCATIONS[f.district] ?? [] : [];

  async function submit() {
    if (!f.blood_group || !f.contact_phone) {
      Alert.alert("Missing info", "Blood group and contact number are required."); return;
    }
    setBusy(true);
    const neededBy = new Date(Date.now() + (Number(f.hours) || 6) * 3600_000).toISOString();
    const r = await api("/api/donors/requests", "POST", {
      ...f, bags_needed: Number(f.bags_needed) || 1, radius_km: Number(f.radius_km) || 10,
      needed_by: neededBy, lat: geo?.lat, lng: geo?.lng,
    });
    setBusy(false);
    if (!r.ok) { Alert.alert("Failed", r.data.error ?? "Try again"); return; }
    Alert.alert("Request posted",
      r.data.notified > 0 ? `${r.data.notified} nearby donor(s) notified.` : "It's now listed for donors.",
      [{ text: "OK", onPress: () => router.replace("/(tabs)/requests") }]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ alignItems: "center", gap: 4 }}>
        <Ionicons name="alert-circle" size={34} color={colors.red600} />
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>Post an Urgent Request</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted }}>Nearby eligible donors get notified instantly.</Text>
      </View>

      <Card style={{ gap: 12 }}>
        <Field label="Blood group needed" required>
          <View style={styles.groupGrid}>
            {BLOOD_GROUPS.map((g) => {
              const active = f.blood_group === g;
              return (
                <Pressable key={g} onPress={() => set("blood_group", g)}
                  style={[styles.groupBtn, active && { backgroundColor: colors.red600, borderColor: colors.red600 }]}>
                  <Text style={{ fontWeight: "800", color: active ? colors.white : colors.text }}>{g}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Patient name"><Input value={f.patient_name} onChangeText={(v) => set("patient_name", v)} /></Field></View>
          <View style={{ width: 90 }}><Field label="Bags"><Input value={f.bags_needed} onChangeText={(v) => set("bags_needed", v.replace(/\D/g, ""))} keyboardType="number-pad" /></Field></View>
        </View>

        <Field label="Hospital / place"><Input value={f.hospital} onChangeText={(v) => set("hospital", v)} /></Field>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="District">
            <Select value={f.district} placeholder="—" options={BD_DISTRICTS} onChange={(v) => setF((p) => ({ ...p, district: v, police_station: "" }))} />
          </Field></View>
          <View style={{ flex: 1 }}><Field label="Thana">
            <Select value={f.police_station} placeholder="—" options={thanas} disabled={!f.district} onChange={(v) => set("police_station", v)} />
          </Field></View>
        </View>

        <Field label="Area"><Input value={f.area} onChangeText={(v) => set("area", v)} /></Field>

        <Field label="Pin the location"><LocationPicker value={geo} onChange={setGeo} autoGps={!geo} /></Field>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Notify within (km)">
            <Select value={f.radius_km} placeholder="10" options={RADII} onChange={(v) => set("radius_km", v)} />
          </Field></View>
          <View style={{ flex: 1 }}><Field label="Needed within (hours)">
            <Input value={f.hours} onChangeText={(v) => set("hours", v.replace(/\D/g, ""))} keyboardType="number-pad" />
          </Field></View>
        </View>

        <Field label="Contact number" required>
          <View style={{ flexDirection: "row" }}>
            <View style={styles.prefix}><Text style={{ color: colors.textMuted }}>+88</Text></View>
            <Input style={{ flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} placeholder="01XXXXXXXXX"
              keyboardType="number-pad" maxLength={11} value={f.contact_phone}
              onChangeText={(v) => set("contact_phone", v.replace(/\D/g, ""))} />
          </View>
        </Field>

        <Field label="Note"><Input value={f.note} onChangeText={(v) => set("note", v)} multiline /></Field>

        <Button title="Post request & notify donors" onPress={submit} loading={busy} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  groupGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  groupBtn: { width: "23%", paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", backgroundColor: colors.white },
  prefix: { justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderRightWidth: 0, borderColor: colors.borderStrong, borderTopLeftRadius: radius.md, borderBottomLeftRadius: radius.md, backgroundColor: "#f9fafb" },
});
