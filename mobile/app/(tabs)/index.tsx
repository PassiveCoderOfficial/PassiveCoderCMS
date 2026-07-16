import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { api } from "../../lib/api";
import { colors, radius, BLOOD_GROUPS, availabilityMeta } from "../../lib/theme";
import {
  AvailabilityChip, BloodBadge, DonorAvatar, Empty, Input, Loading,
} from "../../components/ui";

interface Donor {
  id: string; name: string; blood_group: string;
  district: string | null; police_station: string | null; area: string | null;
  age: number | null; last_donated_on: string | null;
  availability: string; photo_url: string | null;
  lat: number | null; lng: number | null;
}

const BD_REGION = { latitude: 23.685, longitude: 90.3563, latitudeDelta: 4, longitudeDelta: 4 };

export default function HomeScreen() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [group, setGroup] = useState("");
  const [q, setQ] = useState("");
  const [showMap, setShowMap] = useState(true);

  const load = useCallback(async (g: string, search: string) => {
    const p = new URLSearchParams({ page: "0" });
    if (g) p.set("blood_group", g);
    if (search) p.set("q", search);
    const r = await api<{ donors: Donor[]; total: number }>(
      `/api/donors?${p}`, "GET", undefined, { cache: true });
    if (r.ok) { setDonors(r.data.donors ?? []); setTotal(r.data.total ?? 0); }
    setLoading(false); setRefreshing(false);
  }, []);

  const loadCounts = useCallback(async () => {
    const r = await api<{ counts: Record<string, number> }>(
      "/api/donors/meta?what=stats", "GET", undefined, { cache: true });
    if (r.ok) setCounts(r.data.counts ?? {});
  }, []);

  useEffect(() => { load(group, q); }, [load, group]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  // Debounce the name search so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => load(group, q), 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const pinned = useMemo(() => donors.filter(d => d.lat != null && d.lng != null), [donors]);

  return (
    <FlatList
      data={donors}
      keyExtractor={(d) => d.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true); load(group, q); loadCounts();
        }} tintColor={colors.red600} />
      }
      ListHeaderComponent={
        <View style={{ padding: 16, gap: 14 }}>
          {/* Blood group cards — tap to filter, same as the site */}
          <View>
            <Text style={styles.h2}>Find Donors by Blood Group</Text>
            <View style={styles.groupGrid}>
              {BLOOD_GROUPS.map((g) => {
                const active = group === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => setGroup(active ? "" : g)}
                    style={[styles.groupCard, active && { borderColor: colors.red600, borderWidth: 2 }]}
                  >
                    <Ionicons name="water" size={18} color={colors.white} />
                    <Text style={styles.groupText}>{g}</Text>
                    <Text style={styles.groupCount}>{counts[g] ?? 0} donors</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Input placeholder="Search name…" value={q} onChangeText={setQ} />
            </View>
            <Pressable onPress={() => setShowMap(v => !v)} style={styles.mapToggle}>
              <Ionicons name={showMap ? "list" : "map"} size={18} color={colors.text} />
            </Pressable>
          </View>

          {showMap && (
            <View style={styles.mapWrap}>
              <MapView style={{ flex: 1 }} initialRegion={BD_REGION}>
                {pinned.map((d) => (
                  <Marker
                    key={d.id}
                    coordinate={{ latitude: d.lat!, longitude: d.lng! }}
                    pinColor={availabilityMeta[d.availability]?.dot ?? colors.red600}
                    title={d.name}
                    description={`${d.blood_group} · ${[d.area, d.district].filter(Boolean).join(", ")}`}
                    onCalloutPress={() => router.push(`/donor/${d.id}`)}
                  />
                ))}
              </MapView>
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={styles.h2}>Donors <Text style={styles.count}>({total})</Text></Text>
            <Pressable onPress={() => router.push("/add")} style={styles.addBtn}>
              <Ionicons name="add" size={16} color={colors.white} />
              <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>Add Donor</Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/donor/${item.id}`)} style={styles.row}>
          <DonorAvatar photoUrl={item.photo_url} name={item.name} size={44} />
          <BloodBadge group={item.blood_group} size={38} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.loc} numberOfLines={1}>
              {[item.area, item.police_station, item.district].filter(Boolean).join(", ") || "Location not set"}
            </Text>
          </View>
          <AvailabilityChip availability={item.availability} lastDonatedOn={item.last_donated_on} />
        </Pressable>
      )}
      ListEmptyComponent={loading ? <Loading /> : <Empty text="No donors match these filters yet." />}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 8 },
  count: { fontSize: 13, fontWeight: "400", color: colors.textMuted },
  groupGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  groupCard: {
    width: "23%", aspectRatio: 0.95, backgroundColor: colors.red600,
    borderRadius: radius.md, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "transparent",
  },
  groupText: { color: colors.white, fontSize: 16, fontWeight: "800", marginTop: 2 },
  groupCount: { color: "rgba(255,255,255,0.85)", fontSize: 9 },
  mapWrap: {
    height: 240, borderRadius: radius.lg, overflow: "hidden",
    borderWidth: 1, borderColor: colors.border,
  },
  mapToggle: {
    borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md,
    padding: 11, backgroundColor: colors.white,
  },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.red600, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.md,
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  loc: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
});
