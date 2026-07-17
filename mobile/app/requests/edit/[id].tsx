import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../lib/api";
import { colors, BLOOD_GROUPS } from "../../../lib/theme";
import { BD_DISTRICTS, BD_LOCATIONS } from "../../../lib/bd-locations";
import { Button, Card, Field, Input, Loading } from "../../../components/ui";
import { LocationPicker, Select } from "../../../components/form";

export default function EditRequest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ready, setReady] = useState(false);
  const [f, setF] = useState({
    patient_name: "", blood_group: "", bags_needed: "1", hospital: "",
    district: "", police_station: "", area: "", contact_phone: "", note: "", radius_km: "10",
  });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await api("/api/donors/requests?view=mine", "GET");
    const mine = r.data?.requests ?? [];
    const x = mine.find((q: any) => q.id === id);
    if (!x) { Alert.alert("Not allowed", "You can only edit your own requests."); router.back(); return; }
    setF({
      patient_name: x.patient_name ?? "", blood_group: x.blood_group, bags_needed: String(x.bags_needed ?? 1),
      hospital: x.hospital ?? "", district: x.district ?? "", police_station: x.police_station ?? "",
      area: x.area ?? "", contact_phone: (x.contact_phone ?? "").replace(/^\+88/, ""), note: x.note ?? "",
      radius_km: String(x.radius_km ?? 10),
    });
    if (x.lat != null && x.lng != null) setGeo({ lat: x.lat, lng: x.lng });
    setReady(true);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const thanas = f.district ? BD_LOCATIONS[f.district] ?? [] : [];

  async function save() {
    setBusy(true);
    const r = await api("/api/donors/requests", "PATCH", {
      id, ...f, bags_needed: Number(f.bags_needed) || 1, radius_km: Number(f.radius_km) || 10,
      ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
    });
    setBusy(false);
    if (!r.ok) { Alert.alert("Failed", r.data.error ?? "Try again"); return; }
    router.replace("/(tabs)/requests");
  }

  if (!ready) return <Loading />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ alignItems: "center", gap: 4 }}>
        <Ionicons name="alert-circle" size={34} color={colors.red600} />
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>Edit Request</Text>
      </View>
      <Card style={{ gap: 12 }}>
        <Field label="Blood group"><Select value={f.blood_group} placeholder="—" options={BLOOD_GROUPS} onChange={(v) => set("blood_group", v)} /></Field>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Patient"><Input value={f.patient_name} onChangeText={(v) => set("patient_name", v)} /></Field></View>
          <View style={{ width: 90 }}><Field label="Bags"><Input value={f.bags_needed} onChangeText={(v) => set("bags_needed", v.replace(/\D/g, ""))} keyboardType="number-pad" /></Field></View>
        </View>
        <Field label="Hospital"><Input value={f.hospital} onChangeText={(v) => set("hospital", v)} /></Field>
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
        <Field label="Notify within (km)"><Select value={f.radius_km} placeholder="10" options={["5", "10", "15", "25", "50"]} onChange={(v) => set("radius_km", v)} /></Field>
        <Field label="Note"><Input value={f.note} onChangeText={(v) => set("note", v)} multiline /></Field>
        <Button title="Save changes" onPress={save} loading={busy} />
      </Card>
    </ScrollView>
  );
}
