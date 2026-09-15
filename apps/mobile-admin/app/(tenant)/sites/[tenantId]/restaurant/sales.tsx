// Restaurant sales analytics — best sellers, peak hours, average ticket.
// Same aggregation as the web's Restaurant sales card on /dashboard/analytics
// (lib/queries/restaurant-sales.ts ports the logic client-side).

import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getSalesAnalytics, type SalesAnalytics } from "../../../../../lib/queries/restaurant-sales";
import { Card, Screen, SectionHeader, Skeleton, Pill, Tag } from "../../../../../components/ui";
import { spacing, type } from "../../../../../lib/theme";
import { useTheme } from "../../../../../lib/themeContext";
import { useToast } from "../../../../../lib/toast";

const RANGES: (7 | 30 | 90)[] = [7, 30, 90];

function money(n: number): string {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n); }
  catch { return `$${n.toFixed(2)}`; }
}

export default function SalesScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const { error: toastError } = useToast();
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    try {
      setData(await getSalesAnalytics(tenantId, range));
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  }, [tenantId, range, toastError]);

  useEffect(() => { load(); }, [load]);

  const maxBestSeller = Math.max(1, ...(data?.bestSellers.map((b) => b.quantity) ?? [1]));

  return (
    <Screen>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {RANGES.map((r) => (
          <Pill key={r} label={`${r}d`} selected={range === r} onPress={() => setRange(r)} />
        ))}
      </View>

      {loading || !data ? (
        <>
          <Skeleton height={92} />
          <Skeleton height={180} />
        </>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Card style={{ flex: 1 }}>
              <Text style={[type.title, { color: palette.text }]}>{data.orderCount}</Text>
              <Text style={[type.caption, { color: palette.textMuted }]}>Orders</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={[type.title, { color: palette.text }]}>{money(data.totalRevenue)}</Text>
              <Text style={[type.caption, { color: palette.textMuted }]}>Revenue</Text>
            </Card>
          </View>
          <Card>
            <Text style={[type.bodyStrong, { color: palette.text }]}>{money(data.avgTicket)}</Text>
            <Text style={[type.caption, { color: palette.textMuted }]}>Average ticket</Text>
          </Card>

          <View>
            <SectionHeader title="Best sellers" />
            <Card>
              {data.bestSellers.length === 0 ? (
                <Text style={[type.caption, { color: palette.textMuted }]}>No orders in this range yet.</Text>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  {data.bestSellers.map((b) => (
                    <View key={b.name} style={{ gap: 4 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={[type.caption, { color: palette.text }]} numberOfLines={1}>{b.name}</Text>
                        <Text style={[type.caption, { color: palette.textMuted }]}>{b.quantity}×</Text>
                      </View>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: palette.bg, overflow: "hidden" }}>
                        <View style={{ height: 6, width: `${(b.quantity / maxBestSeller) * 100}%`, backgroundColor: palette.primary600 }} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </View>

          <View>
            <SectionHeader title="Fulfillment split" />
            <Card>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {data.fulfillmentSplit.length === 0 ? (
                  <Text style={[type.caption, { color: palette.textMuted }]}>No orders in this range yet.</Text>
                ) : (
                  data.fulfillmentSplit.map((f) => (
                    <Tag key={f.type} label={`${f.type.replace("_", " ")}: ${f.count}`} />
                  ))
                )}
              </View>
            </Card>
          </View>
        </>
      )}
    </Screen>
  );
}
