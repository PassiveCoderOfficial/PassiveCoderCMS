// Branch management — list + add + per-branch KITCHEN/MONITOR/TABLE screen
// toggles, mirroring the web's branches-client.tsx, plus a link into
// per-branch table/QR management (tables.tsx).

import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { getBranches, createBranch, toggleBranchScreen, type RestaurantBranch } from "../../../../../lib/queries/restaurant";
import { Card, EmptyState, Row, Screen, SkeletonList } from "../../../../../components/ui";
import { Button, Field, TextField, Switch } from "../../../../../components/form";
import { spacing, type } from "../../../../../lib/theme";
import { useTheme } from "../../../../../lib/themeContext";
import { useToast } from "../../../../../lib/toast";

export default function BranchesScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const { error: toastError, success } = useToast();
  const [branches, setBranches] = useState<RestaurantBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      setBranches(await getBranches(tenantId));
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to load branches");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, toastError]);

  useEffect(() => { load(); }, [load]);

  async function addBranch() {
    if (!tenantId || !name.trim()) return;
    setSaving(true);
    try {
      const branch = await createBranch(tenantId, name);
      setBranches((prev) => [...prev, branch]);
      setName("");
      setShowAdd(false);
      success("Branch added");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to add branch");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(branch: RestaurantBranch, field: "kitchen_screen_enabled" | "monitor_screen_enabled" | "table_screen_enabled", value: boolean) {
    setBranches((prev) => prev.map((b) => b.id === branch.id ? { ...b, [field]: value } : b));
    try {
      await toggleBranchScreen(branch.id, field, value);
    } catch (e) {
      setBranches((prev) => prev.map((b) => b.id === branch.id ? { ...b, [field]: !value } : b));
      toastError(e instanceof Error ? e.message : "Failed to save");
    }
  }

  if (loading) return <SkeletonList count={3} />;

  return (
    <Screen scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {showAdd ? (
          <Card>
            <Field label="Branch name">
              <TextField value={name} onChangeText={setName} placeholder="e.g. Main Branch" autoFocus />
            </Field>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
              <Button title="Cancel" variant="outline" onPress={() => setShowAdd(false)} style={{ flex: 1 }} />
              <Button title="Add" onPress={addBranch} loading={saving} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <Button title="Add branch" icon="➕" variant="outline" onPress={() => setShowAdd(true)} />
        )}
      </View>

      <FlatList
        data={branches}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={palette.primary600} colors={[palette.primary600]} />
        }
        renderItem={({ item }) => (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <View style={{ padding: spacing.lg, gap: 2 }}>
              <Text style={[type.bodyStrong, { color: palette.text }]}>{item.name}</Text>
              {item.address ? <Text style={[type.caption, { color: palette.textMuted }]}>{item.address}</Text> : null}
            </View>
            <Row title="Kitchen" subtitle="Staff order board" right={<Switch value={item.kitchen_screen_enabled} onValueChange={(v) => toggle(item, "kitchen_screen_enabled", v)} />} />
            <Row title="Monitor" subtitle="Public queue display" right={<Switch value={item.monitor_screen_enabled} onValueChange={(v) => toggle(item, "monitor_screen_enabled", v)} />} />
            <Row title="Table screen" subtitle="PIN-gated per-table tablet" right={<Switch value={item.table_screen_enabled} onValueChange={(v) => toggle(item, "table_screen_enabled", v)} />} />
            <Row title="Tables & QR codes" subtitle="Add tables, set PINs, share order links" onPress={() => router.push({ pathname: "/(tenant)/sites/[tenantId]/restaurant/tables", params: { tenantId, branchId: item.id, branchName: item.name } })} />
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState title="No branches yet" subtitle="Add your first location to start taking dine-in orders." icon="🏪" />
        }
      />
    </Screen>
  );
}
