// Mobile POS ring-up — product picker + cart + branch/table select, mirrors
// the web's pos-client.tsx feature set for v1 minus split-bill (flagged
// below as a fast-follow rather than silently dropped). Calls the real
// server route (lib/queries/pos.ts -> api/ecommerce/pos) since this is the
// one restaurant-vertical write with real side effects (stock decrement,
// accounting entry, CRM upsert) that can't be reproduced as a direct
// Supabase write.

import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getProducts, ringUpSale, type PosProduct } from "../../../../../lib/queries/pos";
import { getBranches, getTables, type RestaurantBranch, type RestaurantTable } from "../../../../../lib/queries/restaurant";
import { Card, EmptyState, Screen, SkeletonList } from "../../../../../components/ui";
import { Button, Field, SearchField, TextField, Select } from "../../../../../components/form";
import { spacing, type, radius } from "../../../../../lib/theme";
import { useTheme } from "../../../../../lib/themeContext";
import { useToast } from "../../../../../lib/toast";

interface CartLine { product_id: string; name: string; price: number; quantity: number }

const PAYMENT_METHODS = ["cash", "bkash", "nagad", "card", "bank"];

function money(n: number): string {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n); }
  catch { return `$${n.toFixed(2)}`; }
}

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

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      try {
        const [p, b] = await Promise.all([getProducts(tenantId), getBranches(tenantId)]);
        setProducts(p);
        setBranches(b);
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
      setCart([]); setCustomerName(""); setTableId("");
    } finally {
      setCheckingOut(false);
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
              <Text style={[type.caption, { color: palette.textMuted, marginTop: 2 }]}>{money(Number(item.price))}</Text>
              {out && <Text style={[type.caption, { color: palette.red600, marginTop: 2 }]}>Out of stock</Text>}
            </Pressable>
          );
        }}
        ListEmptyComponent={<EmptyState title="No products" subtitle="Add products in the dashboard first." icon="📦" />}
      />

      {cart.length > 0 && (
        <Card style={{ margin: spacing.lg, gap: spacing.sm }}>
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
            <Text style={[type.bodyStrong, { color: palette.text }]}>{money(subtotal)}</Text>
          </View>
          <Button title="Complete sale" onPress={checkout} loading={checkingOut} />
          <Text style={[type.caption, { color: palette.textFaint, textAlign: "center" }]}>
            Split bill isn't available on mobile yet — use the web dashboard for a split table.
          </Text>
        </Card>
      )}
    </Screen>
  );
}
