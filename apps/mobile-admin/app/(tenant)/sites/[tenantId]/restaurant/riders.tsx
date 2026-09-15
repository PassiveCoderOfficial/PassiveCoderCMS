// Riders — list + add, copy the same no-login rider link (rider_token,
// migration 094) the web dashboard already generates for
// /rider/[token]. Live-GPS last-seen (migration 098) shown as a plain
// "last seen Nm ago" badge, no embedded map (same reasoning as web's
// kitchen-client.tsx: a plain Maps link, no maps SDK dependency).

import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getBranches, getRiders, createRider, type RestaurantBranch, type Rider } from "../../../../../lib/queries/restaurant";
import { Card, EmptyState, Screen, SkeletonList } from "../../../../../components/ui";
import { Button, Field, TextField, Select } from "../../../../../components/form";
import { spacing, type } from "../../../../../lib/theme";
import { useTheme } from "../../../../../lib/themeContext";
import { useToast } from "../../../../../lib/toast";
import { useRole } from "../../../../../lib/role";

const ROOT_DOMAIN = process.env.EXPO_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";

function minutesAgo(iso: string | null): string {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  return `${mins} min ago`;
}
function isStale(iso: string | null): boolean {
  if (!iso) return true;
  return Date.now() - new Date(iso).getTime() > 5 * 60 * 1000;
}

export default function RidersScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const { error: toastError, success } = useToast();
  const { memberships } = useRole();
  const tenant = memberships.find((m) => m.tenantId === tenantId)?.tenant;
  // Same host rule as the web's kitchen-client.tsx siteUrl — a tenant's own
  // subdomain (or custom domain), never the bare root, since /rider/[token]
  // resolves the tenant via x-tenant-id from that subdomain.
  const siteHost = tenant?.custom_domain || (tenant ? `${tenant.slug}.${ROOT_DOMAIN}` : ROOT_DOMAIN);
  const [branches, setBranches] = useState<RestaurantBranch[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [branchId, setBranchId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const [b, r] = await Promise.all([getBranches(tenantId), getRiders(tenantId)]);
      setBranches(b);
      setRiders(r);
      if (!branchId && b[0]) setBranchId(b[0].id);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to load riders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // branchId deliberately excluded — only used to seed the default once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, toastError]);

  useEffect(() => { load(); }, [load]);

  async function addRider() {
    if (!branchId || !name.trim()) return;
    setSaving(true);
    try {
      const rider = await createRider(branchId, name, phone);
      setRiders((prev) => [...prev, rider]);
      setName(""); setPhone(""); setShowAdd(false);
      success("Rider added");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to add rider");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(rider: Rider) {
    const url = `https://${siteHost}/rider/${rider.rider_token}`;
    await Clipboard.setStringAsync(url);
    success("Rider link copied");
  }

  if (loading) return <SkeletonList count={3} />;

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
            <Field label="Rider name">
              <TextField value={name} onChangeText={setName} placeholder="Full name" autoFocus />
            </Field>
            <Field label="Phone (optional)">
              <TextField value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
            </Field>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
              <Button title="Cancel" variant="outline" onPress={() => setShowAdd(false)} style={{ flex: 1 }} />
              <Button title="Add" onPress={addRider} loading={saving} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <Button title="Add rider" icon="➕" variant="outline" onPress={() => setShowAdd(true)} disabled={branches.length === 0} />
        )}
      </View>

      <FlatList
        data={riders}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={palette.primary600} colors={[palette.primary600]} />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ gap: 2 }}>
                <Text style={[type.bodyStrong, { color: palette.text }]}>{item.name}</Text>
                <Text style={[type.caption, { color: isStale(item.last_location_at) ? palette.textFaint : palette.green600 }]}>
                  {item.last_lat != null ? `Last seen ${minutesAgo(item.last_location_at)}` : "No location shared yet"}
                </Text>
              </View>
              <Button title="Copy link" size="sm" variant="outline" onPress={() => copyLink(item)} />
            </View>
            {item.last_lat != null && (
              <Button
                title="View on map"
                size="sm"
                variant="ghost"
                onPress={() => Linking.openURL(`https://www.google.com/maps?q=${item.last_lat},${item.last_lng}`)}
                style={{ marginTop: spacing.sm, alignSelf: "flex-start" }}
              />
            )}
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState title="No riders yet" subtitle="Add a rider to assign deliveries to them." icon="🏍️" />
        }
      />
    </Screen>
  );
}
