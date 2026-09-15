// Table reservations — next 30 days, chronological (same window/order as
// the web's reservations-client.tsx). Deliberately simple: time slot +
// party size against one branch, staff confirm/cancel by eye — matches
// the web's own "simplest workable first cut" decision, no specific-table
// assignment.

import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
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
      // v1: books "now + 1 hour" as a placeholder time — a proper date/time
      // picker is a fast-follow, flagged rather than silently shipped as
      // "done"; staff can still adjust by cancelling and re-adding for now.
      const reservedAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const reservation = await createReservation(tenantId, branchId, {
        customer_name: customerName, customer_phone: phone, party_size: Number(partySize) || 1, reserved_at: reservedAt,
      });
      setReservations((prev) => [...prev, reservation].sort((a, b) => a.reserved_at.localeCompare(b.reserved_at)));
      setCustomerName(""); setPhone(""); setPartySize("2"); setShowAdd(false);
      success("Reservation added");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to add reservation");
    } finally {
      setSaving(false);
    }
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
            <Text style={[type.caption, { color: palette.textMuted, marginTop: -4, marginBottom: 4 }]}>
              Books for 1 hour from now — adjust the exact time on the web dashboard.
            </Text>
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
