// Table reservations — next 30 days, chronological (same window/order as
// the web's reservations-client.tsx). Deliberately simple: time slot +
// party size against one branch, staff confirm/cancel by eye — matches
// the web's own "simplest workable first cut" decision, no specific-table
// assignment.

import { useCallback, useEffect, useState } from "react";
import { FlatList, Platform, Pressable, RefreshControl, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  getBranches, getReservations, createReservation, updateReservationStatus,
  type RestaurantBranch, type Reservation,
} from "../../../../../lib/queries/restaurant";
import { Card, EmptyState, Screen, SkeletonList, Badge } from "../../../../../components/ui";
import { Button, Field, TextField, Select } from "../../../../../components/form";
import { spacing, type } from "../../../../../lib/theme";
import { useTheme } from "../../../../../lib/themeContext";
import { useToast } from "../../../../../lib/toast";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const datePart = sameDay ? "Today" : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
}

export default function ReservationsScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const { error: toastError, success } = useToast();
  const [branches, setBranches] = useState<RestaurantBranch[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [saving, setSaving] = useState(false);
  // Defaults to +1hr from now, same starting point as the old placeholder —
  // now actually adjustable instead of fixed.
  const [reservedAt, setReservedAt] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const now = new Date();
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      const [b, r] = await Promise.all([
        getBranches(tenantId),
        getReservations(tenantId, now.toISOString(), in30.toISOString()),
      ]);
      setBranches(b);
      setReservations(r);
      if (!branchId && b[0]) setBranchId(b[0].id);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to load reservations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, toastError]);

  useEffect(() => { load(); }, [load]);

  async function addReservation() {
    if (!tenantId || !branchId || !customerName.trim() || !phone.trim()) return;
    setSaving(true);
    try {
      const reservation = await createReservation(tenantId, branchId, {
        customer_name: customerName, customer_phone: phone, party_size: Number(partySize) || 1, reserved_at: reservedAt.toISOString(),
      });
      setReservations((prev) => [...prev, reservation].sort((a, b) => a.reserved_at.localeCompare(b.reserved_at)));
      setCustomerName(""); setPhone(""); setPartySize("2"); setShowAdd(false);
      setReservedAt(new Date(Date.now() + 60 * 60 * 1000));
      success("Reservation added");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to add reservation");
    } finally {
      setSaving(false);
    }
  }

  function onPickDate(event: DateTimePickerEvent, picked?: Date) {
    // Android's picker dismisses itself after one tap; iOS stays open as an
    // inline/spinner control until the caller closes it — same asymmetry
    // handled the same way as every other native-picker usage in RN.
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event.type === "dismissed" || !picked) return;
    setReservedAt((prev) => {
      const next = new Date(prev);
      next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      return next;
    });
  }

  function onPickTime(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (event.type === "dismissed" || !picked) return;
    setReservedAt((prev) => {
      const next = new Date(prev);
      next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      return next;
    });
  }

  async function setStatus(id: string, status: Reservation["status"]) {
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    try {
      await updateReservationStatus(id, status);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to update");
      load();
    }
  }

  if (loading) return <SkeletonList count={4} />;

  return (
    <Screen scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {showAdd ? (
          <Card>
            {branches.length > 1 && (
              <Field label="Branch">
                <Select value={branchId} placeholder="Choose a branch" onChange={setBranchId} options={branches.map((b) => ({ label: b.name, value: b.id }))} />
              </Field>
            )}
            <Field label="Customer name">
              <TextField value={customerName} onChangeText={setCustomerName} placeholder="Full name" autoFocus />
            </Field>
            <Field label="Phone">
              <TextField value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
            </Field>
            <Field label="Party size">
              <TextField value={partySize} onChangeText={setPartySize} placeholder="2" keyboardType="number-pad" />
            </Field>
            <Field label="Date & time">
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={{ flex: 1, borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14 }}
                >
                  <Text style={[type.body, { color: palette.text }]}>
                    {reservedAt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowTimePicker(true)}
                  style={{ flex: 1, borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14 }}
                >
                  <Text style={[type.body, { color: palette.text }]}>
                    {reservedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </Text>
                </Pressable>
              </View>
            </Field>
            {showDatePicker && (
              <DateTimePicker value={reservedAt} mode="date" minimumDate={new Date()} onChange={onPickDate} />
            )}
            {showTimePicker && (
              <DateTimePicker value={reservedAt} mode="time" onChange={onPickTime} />
            )}
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button title="Cancel" variant="outline" onPress={() => setShowAdd(false)} style={{ flex: 1 }} />
              <Button title="Add" onPress={addReservation} loading={saving} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <Button title="New reservation" icon="➕" variant="outline" onPress={() => setShowAdd(true)} disabled={branches.length === 0} />
        )}
      </View>

      <FlatList
        data={reservations}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={palette.primary600} colors={[palette.primary600]} />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ gap: 2, flex: 1 }}>
                <Text style={[type.bodyStrong, { color: palette.text }]}>{formatWhen(item.reserved_at)}</Text>
                <Text style={[type.caption, { color: palette.textMuted }]}>{item.customer_name} · {item.party_size} guests · {item.customer_phone}</Text>
              </View>
              <Badge label={item.status.replace("_", " ")} />
            </View>
            {(item.status === "pending" || item.status === "confirmed") && (
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                {item.status === "pending" && <Button title="Confirm" size="sm" onPress={() => setStatus(item.id, "confirmed")} style={{ flex: 1 }} />}
                <Button title="Cancel" size="sm" variant="danger" onPress={() => setStatus(item.id, "cancelled")} style={{ flex: 1 }} />
              </View>
            )}
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState title="No reservations" subtitle="Bookings for the next 30 days will appear here." icon="📅" />
        }
      />
    </Screen>
  );
}
