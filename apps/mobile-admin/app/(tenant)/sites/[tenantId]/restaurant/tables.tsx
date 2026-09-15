// Table + QR code management for one branch — add tables, set/clear a
// PIN (what scopes a TABLE-screen tablet to that table, migration 092),
// copy the scan-to-order link, and view the QR code image. Mirrors web's
// branches-client.tsx table section; QR image via the same public,
// keyless qrserver.com image API web uses (no QR library needed for one
// feature).

import { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Linking, Modal, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import {
  getTables, createTable, setTablePin, deactivateTable, type RestaurantTable,
} from "../../../../../lib/queries/restaurant";
import { Card, EmptyState, Screen, SkeletonList } from "../../../../../components/ui";
import { Button, Field, TextField } from "../../../../../components/form";
import { spacing, type, radius } from "../../../../../lib/theme";
import { useTheme } from "../../../../../lib/themeContext";
import { useToast } from "../../../../../lib/toast";
import { useRole } from "../../../../../lib/role";

const ROOT_DOMAIN = process.env.EXPO_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";

function qrImageUrl(url: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
}

export default function TablesScreen() {
  const { tenantId, branchId, branchName } = useLocalSearchParams<{ tenantId: string; branchId: string; branchName?: string }>();
  const { palette } = useTheme();
  const { error: toastError, success } = useToast();
  const { memberships } = useRole();
  const tenant = memberships.find((m) => m.tenantId === tenantId)?.tenant;
  const siteHost = tenant?.custom_domain || (tenant ? `${tenant.slug}.${ROOT_DOMAIN}` : ROOT_DOMAIN);

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [pinDraftFor, setPinDraftFor] = useState<string | null>(null);
  const [pinDraft, setPinDraft] = useState("");
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);

  const load = useCallback(async () => {
    if (!branchId) { setLoading(false); return; }
    try {
      setTables(await getTables(branchId));
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to load tables");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId, toastError]);

  useEffect(() => { load(); }, [load]);

  function tableUrl(qrToken: string): string {
    return `https://${siteHost}/table/${qrToken}`;
  }

  async function addTable() {
    if (!branchId || !tableNumber.trim()) return;
    setSaving(true);
    try {
      const table = await createTable(branchId, tableNumber);
      setTables((prev) => [...prev, table].sort((a, b) => a.table_number.localeCompare(b.table_number, undefined, { numeric: true })));
      setTableNumber("");
      setShowAdd(false);
      success("Table added");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to add table");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(qrToken: string) {
    await Clipboard.setStringAsync(tableUrl(qrToken));
    success("Order link copied");
  }

  async function savePin() {
    if (!pinDraftFor) return;
    try {
      await setTablePin(pinDraftFor, pinDraft);
      setTables((prev) => prev.map((t) => t.id === pinDraftFor ? { ...t, table_pin: pinDraft.trim() || null } : t));
      setPinDraftFor(null);
      setPinDraft("");
      success("PIN saved");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to save PIN");
    }
  }

  async function removeTable(table: RestaurantTable) {
    const prev = tables;
    setTables((cur) => cur.filter((t) => t.id !== table.id));
    try {
      await deactivateTable(table.id);
    } catch (e) {
      setTables(prev);
      toastError(e instanceof Error ? e.message : "Failed to remove table");
    }
  }

  if (loading) return <SkeletonList count={4} />;

  return (
    <Screen scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {branchName ? <Text style={[type.caption, { color: palette.textMuted }]}>{branchName}</Text> : null}
        {showAdd ? (
          <Card>
            <Field label="Table number">
              <TextField value={tableNumber} onChangeText={setTableNumber} placeholder="e.g. 12" autoFocus />
            </Field>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
              <Button title="Cancel" variant="outline" onPress={() => setShowAdd(false)} style={{ flex: 1 }} />
              <Button title="Add" onPress={addTable} loading={saving} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <Button title="Add table" icon="➕" variant="outline" onPress={() => setShowAdd(true)} />
        )}
      </View>

      <FlatList
        data={tables}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={palette.primary600} colors={[palette.primary600]} />
        }
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[type.bodyStrong, { color: palette.text }]}>Table {item.table_number}</Text>
              <Text style={[type.caption, { color: item.table_pin ? palette.green600 : palette.textMuted }]}>
                {item.table_pin ? "PIN set" : "No PIN"}
              </Text>
            </View>

            {pinDraftFor === item.id ? (
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, alignItems: "center" }}>
                <TextField
                  value={pinDraft}
                  onChangeText={setPinDraft}
                  placeholder="4-6 digits"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={{ flex: 1 }}
                />
                <Button title="Save" size="sm" onPress={savePin} />
                <Button title="✕" size="sm" variant="ghost" onPress={() => { setPinDraftFor(null); setPinDraft(""); }} />
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" }}>
                <Button title="QR code" size="sm" variant="outline" onPress={() => setQrTable(item)} />
                <Button title="Copy link" size="sm" variant="outline" onPress={() => copyLink(item.qr_token)} />
                <Button
                  title={item.table_pin ? "Change PIN" : "Set PIN"}
                  size="sm"
                  variant="outline"
                  onPress={() => { setPinDraftFor(item.id); setPinDraft(item.table_pin ?? ""); }}
                />
                <Button title="Remove" size="sm" variant="danger" onPress={() => removeTable(item)} />
              </View>
            )}
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState title="No tables yet" subtitle="Add a table to generate its scan-to-order QR code." icon="🍽️" />
        }
      />

      <Modal visible={!!qrTable} animationType="slide" transparent onRequestClose={() => setQrTable(null)}>
        <Pressable style={[styles.backdrop, { backgroundColor: palette.overlay }]} onPress={() => setQrTable(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: palette.bgElevated }]} onPress={() => {}}>
            {qrTable && (
              <View style={{ alignItems: "center", gap: spacing.md }}>
                <Text style={[type.heading, { color: palette.text }]}>Table {qrTable.table_number}</Text>
                <Image
                  source={{ uri: qrImageUrl(tableUrl(qrTable.qr_token)) }}
                  style={{ width: 220, height: 220, borderRadius: radius.md }}
                />
                <Text style={[type.caption, { color: palette.textMuted, textAlign: "center" }]}>
                  {tableUrl(qrTable.qr_token)}
                </Text>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Button title="Copy link" variant="outline" onPress={() => copyLink(qrTable.qr_token)} />
                  <Button title="Open" variant="outline" onPress={() => Linking.openURL(tableUrl(qrTable.qr_token))} />
                </View>
              </View>
            )}
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
