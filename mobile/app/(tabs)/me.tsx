import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { colors, radius, availabilityMeta } from "../../lib/theme";
import { BloodBadge, Button, DonorAvatar, Empty, Loading } from "../../components/ui";

interface Entry {
  id: string; name: string; blood_group: string;
  district: string | null; area: string | null;
  availability: string; is_available: boolean;
  is_claimed: boolean; has_password: boolean;
}

export default function MeScreen() {
  const { me, logout } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const r = await api<{ entries: Entry[] }>("/api/donors/meta?what=mine", "GET", undefined, { cache: true });
    if (r.ok) setEntries(r.data.entries ?? []);
    setLoading(false); setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { if (me) load(); }, [me, load]));

  async function toggleAvail(e: Entry) {
    await api(`/api/donors/${e.id}`, "PATCH", { is_available: !e.is_available });
    load();
  }

  if (me === undefined) return <Loading />;
  if (!me) {
    return (
      <View style={styles.center}>
        <Ionicons name="water" size={40} color={colors.red600} />
        <Text style={{ color: colors.textMuted, textAlign: "center" }}>
          Log in to manage your profile and entries.
        </Text>
        <Button title="Log in / Sign up" onPress={() => router.push("/auth?next=/(tabs)/me")} style={{ width: 220 }} />
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(e) => e.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.red600} />}
      ListHeaderComponent={
        <View style={{ padding: 16, gap: 14 }}>
          <View style={styles.profileCard}>
            <DonorAvatar photoUrl={me.photo_url} name={me.name} size={52} />
            <BloodBadge group={me.blood_group} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{me.name}</Text>
              <Text style={styles.phone}>{me.phone}</Text>
            </View>
            <Pressable onPress={() => router.push(`/donor/${me.id}`)}>
              <Text style={{ color: colors.red600, fontWeight: "600", fontSize: 13 }}>My profile</Text>
            </Pressable>
          </View>


          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={styles.h2}>My entries ({entries.length})</Text>
            <Pressable onPress={() => router.push("/add")}>
              <Text style={{ color: colors.red600, fontWeight: "700", fontSize: 13 }}>+ Add donor</Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const meta = availabilityMeta[item.availability] ?? availabilityMeta.unknown;
        return (
          <View style={styles.entry}>
            <BloodBadge group={item.blood_group} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Pressable onPress={() => router.push(`/donor/${item.id}`)}>
                <Text style={styles.entryName} numberOfLines={1}>{item.name}</Text>
              </Pressable>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ backgroundColor: meta.bg, borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 1 }}>
                  <Text style={{ color: meta.text, fontSize: 10, fontWeight: "700" }}>{meta.label}</Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textMuted }} numberOfLines={1}>
                  {[item.area, item.district].filter(Boolean).join(", ")}
                </Text>
              </View>
            </View>
            <Switch value={!item.is_available} onValueChange={() => toggleAvail(item)}
              trackColor={{ true: "#9ca3af", false: "#e5e7eb" }} thumbColor={colors.white} />
            <Pressable onPress={() => router.push(`/donor/edit/${item.id}`)} style={{ padding: 6 }}>
              <Ionicons name="pencil" size={16} color={colors.textFaint} />
            </Pressable>
            {!item.is_claimed && (
              <Pressable onPress={() => setPassword(item, load)} style={{ padding: 6 }}>
                <Ionicons name="key-outline" size={16} color={colors.red600} />
              </Pressable>
            )}
          </View>
        );
      }}
      ListEmptyComponent={loading ? <Loading /> : <Empty text="You haven't added any donors yet." />}
      ListFooterComponent={
        <View style={{ padding: 24, alignItems: "center" }}>
          <Pressable onPress={async () => { await logout(); router.replace("/(tabs)"); }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>Log out</Text>
          </Pressable>
        </View>
      }
    />
  );
}

/** Creator sets a starter password to hand off to the donor. */
function setPassword(entry: Entry, onDone: () => void) {
  Alert.prompt?.(
    `Password for ${entry.name}`,
    "Share this with the donor so they can take over the profile.",
    async (pw) => {
      if (!pw || pw.length < 6) { Alert.alert("Too short", "Use at least 6 characters."); return; }
      const r = await api(`/api/donors/${entry.id}`, "POST", { action: "set-password", password: pw });
      if (r.ok) { Alert.alert("Done", "Password set. Share it with the donor."); onDone(); }
      else Alert.alert("Failed", r.data.error ?? "Try again");
    },
    "plain-text",
  ) ?? Alert.alert("Set password", "Open this donor on the website to set a password.");
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14,
  },
  name: { fontWeight: "800", fontSize: 15, color: colors.text },
  phone: { fontSize: 13, color: colors.textMuted },
  h2: { fontSize: 16, fontWeight: "800", color: colors.text },
  entry: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  entryName: { fontWeight: "700", fontSize: 14, color: colors.text },
});
