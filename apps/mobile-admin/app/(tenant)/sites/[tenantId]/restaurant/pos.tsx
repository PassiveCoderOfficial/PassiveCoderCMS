// Mobile POS ring-up — product picker + cart + branch/table select, split
// bill (seat assignment, same UX as the web's pos-client.tsx). Calls the
// real server route (lib/queries/pos.ts -> api/ecommerce/pos) since this is
// the one restaurant-vertical write with real side effects (stock
// decrement, accounting entry, CRM upsert) that can't be reproduced as a
// direct Supabase write.

import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getProducts, ringUpSale, ringUpSplitSale, type PosProduct } from "../../../../../lib/queries/pos";
import { getBranches, getTables, type RestaurantBranch, type RestaurantTable } from "../../../../../lib/queries/restaurant";
import { Card, EmptyState, Screen, SkeletonList } from "../../../../../components/ui";
import { Button, Field, SearchField, TextField, Select } from "../../../../../components/form";
import { spacing, type, radius } from "../../../../../lib/theme";
import { useTheme } from "../../../../../lib/themeContext";
import { useToast } from "../../../../../lib/toast";
import { getTenantCurrency, formatMoney } from "../../../../../lib/currency";

interface CartLine { product_id: string; name: string; price: number; quantity: number }

const PAYMENT_METHODS = ["cash", "bkash", "nagad", "card", "bank"];

export default function PosScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const { error: toastError, success } = useToast();

  const [products, setProducts] = useState<PosProduct[]>([]);
  const [branches, setBranches] = useState<RestaurantBranch[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [branchId, setBranchId] = useState("");
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [method, setMethod] = useState("cash");
  const [checkingOut, setCheckingOut] = useState(false);
  const [currency, setCurrency] = useState("USD");

  // Split-bill (same shape as web's pos-client.tsx): seatOf maps
  // product_id -> seat index (0-based), a line not present defaults to
  // seat 0 the first time the sheet opens.
  const [showSplit, setShowSplit] = useState(false);
  const [seatCount, setSeatCount] = useState(2);
  const [seatOf, setSeatOf] = useState<Record<string, number>>({});
  const [splitting, setSplitting] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      try {
        const [p, b, c] = await Promise.all([getProducts(tenantId), getBranches(tenantId), getTenantCurrency(tenantId)]);
        setProducts(p);
        setBranches(b);
        setCurrency(c);
        if (b[0]) setBranchId(b[0].id);
      } catch (e) {
        toastError(e instanceof Error ? e.message : "Failed to load POS data");
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantId, toastError]);

  useEffect(() => {
    if (!branchId) { setTables([]); setTableId(""); return; }
    getTables(branchId).then(setTables).catch(() => setTables([]));
  }, [branchId]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(q));
  }, [products, query]);

  function addToCart(p: PosProduct) {
    setCart((c) => {
      const line = c.find((l) => l.product_id === p.id);
      if (line) return c.map((l) => l.product_id === p.id ? { ...l, quantity: l.quantity + 1 } : l);
      return [...c, { product_id: p.id, name: p.name, price: Number(p.price), quantity: 1 }];
    });
  }
  function setQty(id: string, qty: number) {
    setCart((c) => qty <= 0 ? c.filter((l) => l.product_id !== id) : c.map((l) => l.product_id === id ? { ...l, quantity: qty } : l));
  }

  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);

  function resetSale() {
    setCart([]); setCustomerName(""); setTableId("");
  }

  async function checkout() {
    if (!tenantId || !cart.length) return;
    setCheckingOut(true);
    try {
      const res = await ringUpSale(tenantId, {
        items: cart, discount: 0, payment_method: method,
        customer_name: customerName || undefined,
        branch_id: branchId || undefined, table_id: tableId || undefined,
      });
      if (!res.ok) { toastError(res.error ?? "Sale failed"); return; }
      success(`Sale complete — ${res.orderNumber}`);
      resetSale();
    } finally {
      setCheckingOut(false);
    }
  }

  function openSplit() {
    setSeatOf((prev) => {
      const next: Record<string, number> = {};
      for (const l of cart) next[l.product_id] = prev[l.product_id] ?? 0;
      return next;
    });
    setShowSplit(true);
  }

  function seatLines(seat: number): CartLine[] {
    return cart.filter((l) => (seatOf[l.product_id] ?? 0) === seat);
  }
  function seatTotal(seat: number): number {
    return seatLines(seat).reduce((s, l) => s + l.price * l.quantity, 0);
  }

  async function checkoutSplit() {
    if (!tenantId) return;
    setSplitting(true);
    try {
      const seats = Array.from({ length: seatCount }, (_, i) => ({ items: seatLines(i), discount: 0 }));
      const res = await ringUpSplitSale(tenantId, seats, {
        payment_method: method, customer_name: customerName || undefined,
        branch_id: branchId || undefined, table_id: tableId || undefined,
      });
      if (!res.ok) { toastError(res.error ?? "Split checkout failed"); return; }
      success(`${res.seatsCharged} split bills — ${res.lastOrderNumber}`);
      setShowSplit(false);
      setSeatOf({});
      resetSale();
    } finally {
      setSplitting(false);
    }
  }

  if (loading) return <SkeletonList count={4} />;

  return (
    <Screen scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search products…" />
        {branches.length > 0 && (
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Select value={branchId} placeholder="Branch" onChange={setBranchId} options={branches.map((b) => ({ label: b.name, value: b.id }))} />
            </View>
            <View style={{ flex: 1 }}>
              <Select
                value={tableId}
                placeholder="Takeaway / pickup"
                onChange={setTableId}
                options={tables.map((t) => ({ label: `Table ${t.table_number}`, value: t.id }))}
              />
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(p) => p.id}
        numColumns={2}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        columnWrapperStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
        renderItem={({ item }) => {
          const out = item.track_inventory && (item.stock_quantity ?? 0) <= 0;
          return (
            <Pressable
              onPress={() => !out && addToCart(item)}
              disabled={out}
              style={{
                flex: 1, backgroundColor: palette.bgElevated, borderWidth: 1, borderColor: palette.border,
                borderRadius: radius.md, padding: spacing.md, opacity: out ? 0.4 : 1,
              }}
            >
              <Text style={[type.bodyStrong, { color: palette.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[type.caption, { color: palette.textMuted, marginTop: 2 }]}>{formatMoney(Number(item.price), currency)}</Text>
              {out && <Text style={[type.caption, { color: palette.red600, marginTop: 2 }]}>Out of stock</Text>}
            </Pressable>
          );
        }}
        ListEmptyComponent={<EmptyState title="No products" subtitle="Add products in the dashboard first." icon="📦" />}
      />

      {cart.length > 0 && (
        <Card style={{ margin: spacing.lg, gap: spacing.sm, maxHeight: "60%" }}>
          <ScrollView style={{ maxHeight: 160 }} contentContainerStyle={{ gap: spacing.sm }} showsVerticalScrollIndicator={false}>
            {cart.map((l) => (
              <View key={l.product_id} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Text style={[type.body, { color: palette.text, flex: 1 }]} numberOfLines={1}>{l.name}</Text>
                <Pressable onPress={() => setQty(l.product_id, l.quantity - 1)} style={{ padding: 6 }}>
                  <Text style={{ color: palette.text, fontSize: 16 }}>−</Text>
                </Pressable>
                <Text style={[type.bodyStrong, { color: palette.text, width: 20, textAlign: "center" }]}>{l.quantity}</Text>
                <Pressable onPress={() => setQty(l.product_id, l.quantity + 1)} style={{ padding: 6 }}>
                  <Text style={{ color: palette.text, fontSize: 16 }}>+</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <Field label="Customer (optional)">
            <TextField value={customerName} onChangeText={setCustomerName} placeholder="Walk-in" />
          </Field>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m}
                onPress={() => setMethod(m)}
                style={{
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full,
                  backgroundColor: method === m ? palette.primary600 : "transparent",
                  borderWidth: 1, borderColor: method === m ? palette.primary600 : palette.border,
                }}
              >
                <Text style={{ color: method === m ? palette.onPrimary : palette.textMuted, fontSize: 12, textTransform: "capitalize" }}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[type.bodyStrong, { color: palette.text }]}>Total</Text>
            <Text style={[type.bodyStrong, { color: palette.text }]}>{formatMoney(subtotal, currency)}</Text>
          </View>
          <Button title="Complete sale" onPress={checkout} loading={checkingOut} disabled={splitting} />
          {/* Split-bill only makes sense for a dine-in table with more than
              one item — a takeaway or single-item sale has nothing to divide. */}
          {tableId && cart.length > 1 && (
            <Button title="Split bill" variant="outline" size="sm" onPress={openSplit} disabled={checkingOut} />
          )}
        </Card>
      )}

      <Modal visible={showSplit} animationType="slide" transparent onRequestClose={() => setShowSplit(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: palette.overlay }]} onPress={() => setShowSplit(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: palette.bgElevated }]} onPress={() => {}}>
            <Text style={[type.heading, { color: palette.text, marginBottom: spacing.md }]}>Split bill</Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
              <Text style={[type.caption, { color: palette.textMuted }]}>Seats</Text>
              <Pressable onPress={() => setSeatCount((n) => Math.max(2, n - 1))} style={{ padding: 8, backgroundColor: palette.bg, borderRadius: radius.sm }}>
                <Text style={{ color: palette.text, fontSize: 14 }}>−</Text>
              </Pressable>
              <Text style={[type.bodyStrong, { color: palette.text, width: 24, textAlign: "center" }]}>{seatCount}</Text>
              <Pressable onPress={() => setSeatCount((n) => Math.min(8, n + 1))} style={{ padding: 8, backgroundColor: palette.bg, borderRadius: radius.sm }}>
                <Text style={{ color: palette.text, fontSize: 14 }}>+</Text>
              </Pressable>
              <Text style={[type.caption, { color: palette.textFaint, flex: 1 }]}>Tap a seat next to each item</Text>
            </View>

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {cart.map((l) => (
                <View key={l.product_id} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.body, { color: palette.text }]} numberOfLines={1}>{l.quantity}× {l.name}</Text>
                    <Text style={[type.caption, { color: palette.textMuted }]}>{formatMoney(l.price * l.quantity, currency)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    {Array.from({ length: seatCount }, (_, seat) => (
                      <Pressable
                        key={seat}
                        onPress={() => setSeatOf((prev) => ({ ...prev, [l.product_id]: seat }))}
                        style={{
                          width: 28, height: 28, borderRadius: radius.sm, alignItems: "center", justifyContent: "center",
                          backgroundColor: (seatOf[l.product_id] ?? 0) === seat ? palette.primary600 : palette.bg,
                        }}
                      >
                        <Text style={{ color: (seatOf[l.product_id] ?? 0) === seat ? palette.onPrimary : palette.textMuted, fontSize: 12, fontWeight: "700" }}>
                          {seat + 1}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={{ marginTop: spacing.md, gap: 4 }}>
              {Array.from({ length: seatCount }, (_, seat) => {
                const lines = seatLines(seat);
                if (lines.length === 0) return null;
                return (
                  <View key={seat} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={[type.caption, { color: palette.textMuted }]}>Seat {seat + 1} ({lines.length} item{lines.length === 1 ? "" : "s"})</Text>
                    <Text style={[type.caption, { color: palette.text }]}>{formatMoney(seatTotal(seat), currency)}</Text>
                  </View>
                );
              })}
            </View>

            <Button title="Charge all seats" onPress={checkoutSplit} loading={splitting} style={{ marginTop: spacing.md }} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "80%",
    padding: spacing.lg,
  },
});
