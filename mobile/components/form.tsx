import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, type MapPressEvent } from "react-native-maps";
import * as Location from "expo-location";
import { colors, radius } from "../lib/theme";

const BD_REGION = { latitude: 23.685, longitude: 90.3563, latitudeDelta: 3, longitudeDelta: 3 };

/** Dropdown that opens a searchable modal list — RN has no native <select>. */
export function Select({ value, placeholder, options, onChange, disabled }: {
  value: string; placeholder: string; options: readonly string[];
  onChange: (v: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable disabled={disabled} onPress={() => setOpen(true)}
        style={[styles.select, disabled && { opacity: 0.5 }]}>
        <Text style={{ color: value ? colors.text : colors.textFaint, fontSize: 14 }}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textFaint} />
      </Pressable>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <ScrollView>
              <Pressable style={styles.opt} onPress={() => { onChange(""); setOpen(false); }}>
                <Text style={{ color: colors.textMuted }}>{placeholder}</Text>
              </Pressable>
              {options.map((o) => (
                <Pressable key={o} style={styles.opt} onPress={() => { onChange(o); setOpen(false); }}>
                  <Text style={{ color: colors.text, fontWeight: value === o ? "700" : "400" }}>{o}</Text>
                  {value === o && <Ionicons name="checkmark" size={18} color={colors.red600} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/** Tap-to-pin map with a "use my location" button. `autoGps` seeds it once. */
export function LocationPicker({ value, onChange, autoGps }: {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
  autoGps?: boolean;
}) {
  const mapRef = useRef<MapView>(null);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!autoGps || seeded || value) return;
    setSeeded(true);
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({});
      const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      onChange(point);
      mapRef.current?.animateToRegion({ ...toRegion(point), latitudeDelta: 0.02, longitudeDelta: 0.02 });
    })();
  }, [autoGps, seeded, value, onChange]);

  async function useMyLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const pos = await Location.getCurrentPositionAsync({});
    const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    onChange(point);
    mapRef.current?.animateToRegion({ ...toRegion(point), latitudeDelta: 0.02, longitudeDelta: 0.02 });
  }

  return (
    <View>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={value ? { ...toRegion(value), latitudeDelta: 0.02, longitudeDelta: 0.02 } : BD_REGION}
          onPress={(e: MapPressEvent) => {
            const c = e.nativeEvent.coordinate;
            onChange({ lat: c.latitude, lng: c.longitude });
          }}
        >
          {value && <Marker coordinate={toRegion(value)} pinColor={colors.red600} />}
        </MapView>
        <Pressable onPress={useMyLocation} style={styles.gpsBtn}>
          <Ionicons name="locate" size={18} color={colors.red600} />
        </Pressable>
      </View>
      <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 4 }}>
        Tap the map to set the location, or use the crosshair for your GPS.
      </Text>
    </View>
  );
}

function toRegion(v: { lat: number; lng: number }) {
  return { latitude: v.lat, longitude: v.lng };
}

const styles = StyleSheet.create({
  select: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: colors.white,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingVertical: 8 },
  opt: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  mapWrap: { height: 200, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  gpsBtn: {
    position: "absolute", right: 10, top: 10, width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.white, alignItems: "center", justifyContent: "center", elevation: 3,
  },
});
