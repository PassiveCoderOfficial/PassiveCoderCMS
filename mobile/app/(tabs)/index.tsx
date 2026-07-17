import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList, Pressable, RefreshControl, StyleSheet, Text, View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, type Region } from "react-native-maps";
import * as Location from "expo-location";
import { api } from "../../lib/api";
import { colors, radius, BLOOD_GROUPS, GENDERS, RELIGIONS, availabilityMeta } from "../../lib/theme";
import { BD_DISTRICTS, BD_LOCATIONS } from "../../lib/bd-locations";
import {
  AvailabilityChip, BloodBadge, DonorAvatar, Empty, Input, Loading,
} from "../../components/ui";
import { Select } from "../../components/form";

interface Donor {
  id: string; name: string; blood_group: string;
  district: string | null; police_station: string | null; area: string | null;
  age: number | null; last_donated_on: string | null;
  availability: string; photo_url: string | null;
  lat: number | null; lng: number | null;
}

interface Bounds { sw_lat: number; sw_lng: number; ne_lat: number; ne_lng: number }

const BD_REGION: Region = { latitude: 23.685, longitude: 90.3563, latitudeDelta: 4, longitudeDelta: 4 };

const AVAILABILITY_OPTIONS = [
  { value: "ready", label: "Ready to donate" },
  { value: "soon", label: "Almost ready" },
  { value: "not_ready", label: "Recently donated" },
  { value: "unknown", label: "Unknown" },
  { value: "unavailable", label: "Temporarily unavailable" },
];

const EMPTY_FILTERS = {
  blood_group: "", district: "", police_station: "", area: "",
  gender: "", religion: "", availability: "", q: "",
};
type Filters = typeof EMPTY_FILTERS;

export default function HomeScreen() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showMap, setShowMap] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const mapRef = useRef<MapView>(null);
  const userMovedMap = useRef(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (f: Filters, b: Bounds | null) => {
    setLoading(true);
    const p = new URLSearchParams({ page: "0" });
    Object.entries(f).forEach(([k, v]) => v && p.set(k, v));
    if (b) {
      p.set("sw_lat", String(b.sw_lat)); p.set("sw_lng", String(b.sw_lng));
      p.set("ne_lat", String(b.ne_lat)); p.set("ne_lng", String(b.ne_lng));
    }
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

  useEffect(() => { load(filters, bounds); }, [load, filters.blood_group, filters.district, filters.police_station, filters.gender, filters.religion, filters.availability]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadCounts(); }, [loadCounts]);

  // Debounce free-text fields (name search, area) so we don't hit the API on every keystroke.
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(filters, bounds), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [filters.q, filters.area]); // eslint-disable-line react-hooks/exhaustive-deps

  function set(key: keyof Filters, value: string) {
    setFilters((f) => {
      const next = { ...f, [key]: value };
      if (key === "district") next.police_station = "";
      return next;
    });
  }

  function resetAll() {
    setFilters(EMPTY_FILTERS);
    setBounds(null);
    load(EMPTY_FILTERS, null);
  }

  function toggleGroup(g: string) {
    set("blood_group", filters.blood_group === g ? "" : g);
  }

  // Map pan/zoom acts as one more filter, ANDed with the dropdowns above —
  // mirrors the web's onBoundsChanged behavior.
  function onRegionChangeComplete(region: Region) {
    if (!userMovedMap.current) return;
    const b: Bounds = {
      sw_lat: region.latitude - region.latitudeDelta / 2,
      sw_lng: region.longitude - region.longitudeDelta / 2,
      ne_lat: region.latitude + region.latitudeDelta / 2,
      ne_lng: region.longitude + region.longitudeDelta / 2,
    };
    setBounds(b);
    load(filters, b);
  }

  async function findMe() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const pos = await Location.getCurrentPositionAsync({});
    const region = {
      latitude: pos.coords.latitude, longitude: pos.coords.longitude,
      latitudeDelta: 0.3, longitudeDelta: 0.3,
    };
    userMovedMap.current = false;
    mapRef.current?.animateToRegion(region, 500);
    setTimeout(() => onRegionChangeComplete(region), 550);
  }

  function clearMapBounds() {
    setBounds(null);
    userMovedMap.current = false;
    mapRef.current?.animateToRegion(BD_REGION, 400);
    load(filters, null);
  }

  const pinned = useMemo(() => donors.filter(d => d.lat != null && d.lng != null), [donors]);
  const thanas = filters.district ? BD_LOCATIONS[filters.district] ?? [] : [];
  const activeCount = Object.values(filters).filter(Boolean).length + (bounds ? 1 : 0);

  return (
    <FlatList
      data={donors}
      keyExtractor={(d) => d.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true); load(filters, bounds); loadCounts();
        }} tintColor={colors.red600} />
      }
      ListHeaderComponent={
        <View style={{ padding: 16, gap: 14 }}>
          {/* Blood group cards — tap to filter, same as the site */}
          <View>
            <Text style={styles.h2}>Find Donors by Blood Group</Text>
            <View style={styles.groupGrid}>
              {BLOOD_GROUPS.map((g) => {
                const active = filters.blood_group === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => toggleGroup(g)}
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
              <Input placeholder="Search name…" value={filters.q} onChangeText={(v) => set("q", v)} />
            </View>
            <Pressable onPress={() => setShowFilters(v => !v)} style={[styles.iconToggle, activeCount > 0 && { borderColor: colors.red600 }]}>
              <Ionicons name="options" size={18} color={activeCount > 0 ? colors.red600 : colors.text} />
              {activeCount > 0 && <View style={styles.badgeDot}><Text style={styles.badgeDotText}>{activeCount}</Text></View>}
            </Pressable>
            <Pressable onPress={() => setShowMap(v => !v)} style={styles.iconToggle}>
              <Ionicons name={showMap ? "list" : "map"} size={18} color={colors.text} />
            </Pressable>
          </View>

          {showFilters && (
            <View style={styles.filterPanel}>
              <View style={styles.filterGrid}>
                <View style={styles.filterHalf}><Select value={filters.district} placeholder="All districts" options={BD_DISTRICTS} onChange={(v) => set("district", v)} /></View>
                <View style={styles.filterHalf}><Select value={filters.police_station} placeholder={filters.district ? "All thanas" : "Pick district first"} options={thanas} disabled={!filters.district} onChange={(v) => set("police_station", v)} /></View>
                <View style={styles.filterHalf}><Select value={filters.availability} placeholder="Any status" options={AVAILABILITY_OPTIONS.map(o => o.label)} onChange={(label) => set("availability", AVAILABILITY_OPTIONS.find(o => o.label === label)?.value ?? "")} /></View>
                <View style={styles.filterHalf}><Select value={filters.gender ? filters.gender[0].toUpperCase() + filters.gender.slice(1) : ""} placeholder="Any gender" options={GENDERS.map(g => g[0].toUpperCase() + g.slice(1))} onChange={(v) => set("gender", v.toLowerCase())} /></View>
                <View style={styles.filterHalf}><Select value={filters.religion ? filters.religion[0].toUpperCase() + filters.religion.slice(1) : ""} placeholder="Any religion" options={RELIGIONS.map(r => r[0].toUpperCase() + r.slice(1))} onChange={(v) => set("religion", v.toLowerCase())} /></View>
                <View style={styles.filterHalf}><Input placeholder="Location…" value={filters.area} onChangeText={(v) => set("area", v)} /></View>
              </View>
              {activeCount > 0 && (
                <Pressable onPress={resetAll} style={styles.resetBtn}>
                  <Ionicons name="refresh" size={13} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600" }}>Reset all filters</Text>
                </Pressable>
              )}
            </View>
          )}

          {showMap && (
            <View style={styles.mapWrap}>
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={BD_REGION}
                onPanDrag={() => { userMovedMap.current = true; }}
                onRegionChangeComplete={onRegionChangeComplete}
              >
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
              <Pressable onPress={findMe} style={styles.findMeBtn}>
                <Ionicons name="locate" size={16} color={colors.white} />
                <Text style={{ color: colors.white, fontWeight: "700", fontSize: 12 }}>Find donors near me</Text>
              </Pressable>
              {bounds && (
                <Pressable onPress={clearMapBounds} style={styles.mapFilterChip}>
                  <Text style={{ color: "#1d4ed8", fontSize: 11, fontWeight: "600" }}>Filtering by map view</Text>
                  <Ionicons name="close" size={13} color="#1d4ed8" />
                </Pressable>
              )}
            </View>
          )}
          {showMap && (
            <Text style={styles.mapHint}>
              Pan or zoom the map — the list below updates to donors in view. Pin colors show readiness.
            </Text>
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
    height: 260, borderRadius: radius.lg, overflow: "hidden",
    borderWidth: 1, borderColor: colors.border,
  },
  mapHint: { fontSize: 11, color: colors.textFaint, marginTop: -6 },
  findMeBtn: {
    position: "absolute", left: 10, top: 10, flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.red600, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full,
    elevation: 3, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4,
  },
  mapFilterChip: {
    position: "absolute", right: 10, top: 10, flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full,
  },
  iconToggle: {
    borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md,
    padding: 11, backgroundColor: colors.white, position: "relative",
  },
  badgeDot: {
    position: "absolute", top: -5, right: -5, backgroundColor: colors.red600,
    borderRadius: radius.full, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeDotText: { color: colors.white, fontSize: 9, fontWeight: "800" },
  filterPanel: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: 12, gap: 8,
  },
  filterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterHalf: { width: "48%" },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
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
