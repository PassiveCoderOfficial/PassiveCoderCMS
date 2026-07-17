import { useCallback, useState } from "react";
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, radius, BLOOD_GROUPS } from "../../lib/theme";
import { BD_DISTRICTS } from "../../lib/bd-locations";
import { Button, Empty, Loading } from "../../components/ui";
import { Select } from "../../components/form";

type View_ = "open" | "deadline_over" | "mine";

interface Req {
  id: string; patient_name: string | null; blood_group: string;
  bags_needed: number; hospital: string | null;
  district: string | null; police_station: string | null; area: string | null;
  contact_phone: string; note: string | null; needed_by: string | null;
  status: string; deadline_over?: boolean; is_mine?: boolean; created_at: string;
}

const TABS: Array<{ id: View_; label: string }> = [
  { id: "open", label: "Open" },
  { id: "deadline_over", label: "Deadline over" },
  { id: "mine", label: "My requests" },
];

export default function RequestsTab() {
  const { me } = useAuth();
  const [view, setView] = useState<View_>("open");
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [group, setGroup] = useState("");
  const [district, setDistrict] = useState("");

  const load = useCallback(async () => {
    const p = new URLSearchParams({ view });
    if (group) p.set("blood_group", group);
    if (district) p.set("district", district);
    const r = await api<{ requests: Req[] }>(`/api/donors/requests?${p}`, "GET", undefined, { cache: view === "open" });
    if (r.ok) setReqs(r.data.requests ?? []);
    else if (r.status === 401) setReqs([]);
    setLoading(false); setRefreshing(false);
  }, [view, group, district]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  async function setStatus(req: Req, status: string) {
    const r = await api("/api/donors/requests", "PATCH", { id: req.id, status });
    if (r.ok) load(); else Alert.alert("Failed", r.data.error ?? "Try again");
  }

  return (
    <FlatList
      data={reqs}
      keyExtractor={(r) => r.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.red600} />}
      ListHeaderComponent={
        <View style={{ padding: 16, gap: 12 }}>
          <Button title="Post a request" icon="add" onPress={() => router.push("/requests/new")} />
          <View style={styles.tabs}>
            {TABS.map((t) => (
              <Pressable key={t.id} onPress={() => setView(t.id)}
                style={[styles.tab, view === t.id && styles.tabActive]}>
                <Text style={{ color: view === t.id ? colors.red700 : colors.textMuted, fontWeight: "600", fontSize: 13 }}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Select value={group} placeholder="All groups" options={BLOOD_GROUPS} onChange={setGroup} />
            </View>
            <View style={{ flex: 1 }}>
              <Select value={district} placeholder="All districts" options={BD_DISTRICTS} onChange={setDistrict} />
            </View>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const over = !!item.deadline_over;
        const where = [item.hospital, item.area, item.police_station, item.district].filter(Boolean).join(", ");
        return (
          <View style={[styles.card, over && styles.cardOver, item.status === "archived" && { opacity: 0.6 }]}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={[styles.badge, over && { backgroundColor: colors.red700 }]}>
                <Text style={{ color: colors.white, fontWeight: "800" }}>{item.blood_group}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reqTitle}>
                  {item.bags_needed} bag{item.bags_needed > 1 ? "s" : ""}{item.patient_name ? ` for ${item.patient_name}` : ""}
                </Text>
                {!!where && <Text style={styles.reqLoc} numberOfLines={1}>{where}</Text>}
              </View>
            </View>
            {over && <Text style={styles.overTag}>⚠ Deadline over</Text>}
            {item.status === "archived" && <Text style={styles.archTag}>Archived</Text>}
            {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Button title="Call" icon="call" onPress={() => Linking.openURL(`tel:${item.contact_phone}`)} style={{ paddingHorizontal: 16, flexGrow: 0 }} />
              <Button title="WhatsApp" variant="green" onPress={() => Linking.openURL(`https://wa.me/${item.contact_phone.replace(/\D/g, "")}`)} style={{ paddingHorizontal: 16, flexGrow: 0 }} />
            </View>
            {item.is_mine && (
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <MiniBtn icon="pencil" label="Edit" onPress={() => router.push(`/requests/edit/${item.id}`)} />
                {item.status === "archived"
                  ? <MiniBtn icon="refresh" label="Unarchive" onPress={() => setStatus(item, "open")} />
                  : <>
                      <MiniBtn icon="checkmark" label="Fulfilled" onPress={() => setStatus(item, "fulfilled")} />
                      <MiniBtn icon="archive-outline" label="Archive" onPress={() => setStatus(item, "archived")} />
                    </>}
              </View>
            )}
          </View>
        );
      }}
      ListEmptyComponent={loading ? <Loading /> :
        <Empty text={view === "mine" && !me ? "Log in to see your requests."
          : view === "mine" ? "You haven't posted any requests."
          : view === "deadline_over" ? "Nothing past its deadline."
          : "No open requests right now."} />}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}

function MiniBtn({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.mini}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: colors.red600 },
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.red100, padding: 14, gap: 8 },
  cardOver: { borderColor: "#fca5a5" },
  badge: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.red600, alignItems: "center", justifyContent: "center" },
  reqTitle: { fontWeight: "800", color: colors.text, fontSize: 15 },
  reqLoc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  overTag: { alignSelf: "flex-start", backgroundColor: colors.red100, color: colors.red700, fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  archTag: { alignSelf: "flex-start", backgroundColor: "#f3f4f6", color: "#4b5563", fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  note: { fontSize: 13, color: colors.textMuted },
  mini: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6 },
});
