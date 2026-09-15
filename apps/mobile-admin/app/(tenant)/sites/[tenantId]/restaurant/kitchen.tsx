// Mobile kitchen board — same fulfillment-aware pipeline as the web's
// kitchen-client.tsx (migration 092, docs/business/06-restaurant-vertical.md):
//   Dine In:  pending -> cooking -> ready -> served
//   Pick Up:  pending -> cooking -> ready_to_pick -> picked_up
//   Delivery: pending -> cooking -> ready_to_pick, then hands off to
//             delivery_status (not shown/advanced here — a rider's own
//             view, not this staff board's job)
// Polls every 8s, same cadence as web, since there's no push-on-new-order
// wired up yet for this app.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getKitchenOrders, advanceKitchenStatus, getBranches, type KitchenOrder, type RestaurantBranch } from "../../../../../lib/queries/restaurant";
import { EmptyState, Screen, SkeletonList, Badge, Card, Pill } from "../../../../../components/ui";
import { Button } from "../../../../../components/form";
import { spacing, type } from "../../../../../lib/theme";
import { useTheme } from "../../../../../lib/themeContext";
import { useToast } from "../../../../../lib/toast";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", cooking: "Cooking", ready: "Ready",
  ready_to_pick: "Ready to Pick", served: "Served on Table", picked_up: "Picked Up", completed: "Completed",
};

function nextStatus(order: KitchenOrder): string | null {
  const type = order.fulfillment_type;
  if (order.kitchen_status === "pending") return "cooking";
  if (order.kitchen_status === "cooking") return type === "dine_in" ? "ready" : "ready_to_pick";
  if (order.kitchen_status === "ready") return "served"; // dine-in only
  if (order.kitchen_status === "ready_to_pick") return type === "pickup" ? "picked_up" : null; // delivery hands off to a rider
  return null;
}

function nextLabel(order: KitchenOrder): string {
  const next = nextStatus(order);
  return next ? `Mark ${STATUS_LABEL[next]}` : "Awaiting rider";
}

export default function KitchenScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const { error: toastError } = useToast();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [branches, setBranches] = useState<RestaurantBranch[]>([]);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const [rows, b] = await Promise.all([getKitchenOrders(tenantId), getBranches(tenantId)]);
      setOrders(rows);
      setBranches(b);
    } catch (e) {
      if (!silent) toastError(e instanceof Error ? e.message : "Failed to load kitchen orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, toastError]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => load(true), 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  const shown = useMemo(
    () => branchFilter === "all" ? orders : orders.filter((o) => o.branch_id === branchFilter),
    [orders, branchFilter],
  );

  async function advance(order: KitchenOrder) {
    const next = nextStatus(order);
    if (!next || !tenantId) return;
    setBusyId(order.id);
    const isTerminal = next === "served" || next === "picked_up";
    const prev = orders;
    // Optimistic, same reasoning as web: a kitchen screen lagging a network
    // round-trip behind a tap reads as broken standing at a hot line.
    setOrders((cur) => isTerminal ? cur.filter((o) => o.id !== order.id) : cur.map((o) => o.id === order.id ? { ...o, kitchen_status: next } : o));
    try {
      await advanceKitchenStatus(order.id, tenantId, next);
    } catch (e) {
      setOrders(prev);
      toastError(e instanceof Error ? e.message : "Failed to update order");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <SkeletonList count={4} />;

  return (
    <Screen scroll={false}>
      {branches.length > 1 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, padding: spacing.lg, paddingBottom: 0 }}>
          <Pill label="All branches" selected={branchFilter === "all"} onPress={() => setBranchFilter("all")} />
          {branches.map((b) => (
            <Pill key={b.id} label={b.name} selected={branchFilter === b.id} onPress={() => setBranchFilter(b.id)} />
          ))}
        </View>
      )}
      <FlatList
        data={shown}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={palette.primary600}
            colors={[palette.primary600]}
          />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.bodyStrong, { color: palette.text }]}>{item.order_number}</Text>
                <Text style={[type.caption, { color: palette.textMuted }]}>{item.customer_name}</Text>
              </View>
              <Badge label={STATUS_LABEL[item.kitchen_status] ?? item.kitchen_status} />
            </View>
            <View style={{ gap: 2, marginTop: spacing.sm }}>
              {item.items.slice(0, 6).map((it, i) => (
                <Text key={i} style={[type.caption, { color: palette.textMuted }]}>{it.quantity}× {it.name}</Text>
              ))}
            </View>
            <Button
              title={nextLabel(item)}
              onPress={() => advance(item)}
              loading={busyId === item.id}
              disabled={!nextStatus(item)}
              size="sm"
              style={{ marginTop: spacing.md }}
            />
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState title="No live orders" subtitle="New dine-in and pickup orders will appear here." icon="🍳" />
        }
      />
    </Screen>
  );
}
