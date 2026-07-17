import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { api, uploadPhoto } from "../lib/api";
import { useAuth } from "../lib/auth";
import { colors, radius, BLOOD_GROUPS, GENDERS, RELIGIONS } from "../lib/theme";
import { BD_DISTRICTS, BD_LOCATIONS } from "../lib/bd-locations";
import { Button, Card, Field, Input } from "../components/ui";
import { LocationPicker, Select } from "../components/form";

export default function AddDonor() {
  const { me } = useAuth();
  const [f, setF] = useState({
    name: "", phone: "", same_whatsapp: true, whatsapp: "",
    blood_group: "", gender: "", religion: "",
    district: "", police_station: "", area: "",
    age_years: "", last_donated_on: "", never_donated: false,
  });
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me) router.replace("/auth?next=/add");
  }, [me]);

  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const thanas = f.district ? BD_LOCATIONS[f.district] ?? [] : [];

  async function pickPhoto(fromCamera: boolean) {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed", "Allow access to add a photo."); return; }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  }

  async function submit() {
    if (!f.name.trim() || !f.phone || !f.blood_group) {
      Alert.alert("Missing info", "Name, phone and blood group are required."); return;
    }
    setBusy(true);
    const r = await api("/api/donors", "POST", {
      ...f, age_years: f.age_years || "",
      last_donated_on: f.never_donated ? "" : f.last_donated_on,
      lat: geo?.lat, lng: geo?.lng,
    });
    if (!r.ok) { setBusy(false); Alert.alert("Failed", r.data.error ?? "Try again"); return; }
    if (photo && r.data.id) await uploadPhoto(photo, r.data.id);
    setBusy(false);
    Alert.alert("Donor added", "You can set a password from My entries so they can take over.", [
      { text: "Add another", onPress: () => { setF((p) => ({ ...p, name: "", phone: "", area: "", age_years: "" })); setPhoto(null); setGeo(null); } },
      { text: "View", onPress: () => router.replace(`/donor/${r.data.id}`) },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ alignItems: "center", gap: 8 }}>
        <Pressable onPress={() => Alert.alert("Photo", undefined, [
          { text: "Take a photo", onPress: () => pickPhoto(true) },
          { text: "Choose from gallery", onPress: () => pickPhoto(false) },
          { text: "Cancel", style: "cancel" },
        ])}>
          <View style={styles.photo}>
            {photo
              ? <Image source={{ uri: photo }} style={{ width: 84, height: 84, borderRadius: 42 }} />
              : <Ionicons name="camera" size={28} color={colors.red600} />}
          </View>
        </Pressable>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>Tap to add a photo (optional)</Text>
      </View>

      <Card style={{ gap: 12 }}>
        <Field label="Donor name" required><Input value={f.name} onChangeText={(v) => set("name", v)} /></Field>

        <Field label="Phone number" required>
          <PhoneInput value={f.phone} onChange={(v) => set("phone", v)} />
        </Field>

        <Pressable onPress={() => set("same_whatsapp", !f.same_whatsapp)} style={styles.check}>
          <Ionicons name={f.same_whatsapp ? "checkbox" : "square-outline"} size={20} color={colors.red600} />
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>WhatsApp is the same number</Text>
        </Pressable>
        {!f.same_whatsapp && (
          <Field label="WhatsApp number"><PhoneInput value={f.whatsapp} onChange={(v) => set("whatsapp", v)} /></Field>
        )}

        <Field label="Blood group" required>
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
          <View style={{ flex: 1 }}><Field label="Gender">
            <Select value={f.gender} placeholder="—" options={GENDERS} onChange={(v) => set("gender", v)} />
          </Field></View>
          <View style={{ flex: 1 }}><Field label="Religion">
            <Select value={f.religion} placeholder="—" options={RELIGIONS} onChange={(v) => set("religion", v)} />
          </Field></View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="District">
            <Select value={f.district} placeholder="—" options={BD_DISTRICTS}
              onChange={(v) => setF((p) => ({ ...p, district: v, police_station: "" }))} />
          </Field></View>
          <View style={{ flex: 1 }}><Field label="Thana">
            <Select value={f.police_station} placeholder="—" options={thanas} disabled={!f.district}
              onChange={(v) => set("police_station", v)} />
          </Field></View>
        </View>

        <Field label="Area"><Input value={f.area} onChangeText={(v) => set("area", v)} placeholder="e.g. Mirpur DOHS" /></Field>

        <Field label="Pin the location">
          <LocationPicker value={geo} onChange={setGeo} autoGps={!geo} />
        </Field>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Age">
            <Input value={f.age_years} onChangeText={(v) => set("age_years", v.replace(/\D/g, ""))} keyboardType="number-pad" placeholder="e.g. 27" />
          </Field></View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>Never donated</Text>
          <Switch value={f.never_donated} onValueChange={(v) => set("never_donated", v)}
            trackColor={{ true: colors.green600, false: "#e5e7eb" }} thumbColor={colors.white} />
        </View>
        {!f.never_donated && (
          <Field label="Last donated (YYYY-MM-DD)">
            <Input value={f.last_donated_on} onChangeText={(v) => set("last_donated_on", v)} placeholder="2025-01-15" />
          </Field>
        )}

        <Button title="Save donor" onPress={submit} loading={busy} />
      </Card>
    </ScrollView>
  );
}

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: "row" }}>
      <View style={styles.prefix}><Text style={{ color: colors.textMuted }}>+88</Text></View>
      <Input style={{ flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
        placeholder="01XXXXXXXXX" keyboardType="number-pad" maxLength={11}
        value={value} onChangeText={(v) => onChange(v.replace(/\D/g, ""))} />
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: colors.red50,
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.red100,
  },
  check: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  groupBtn: {
    width: "23%", paddingVertical: 10, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.borderStrong, alignItems: "center", backgroundColor: colors.white,
  },
  prefix: {
    justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderRightWidth: 0,
    borderColor: colors.borderStrong, borderTopLeftRadius: radius.md, borderBottomLeftRadius: radius.md, backgroundColor: "#f9fafb",
  },
});
