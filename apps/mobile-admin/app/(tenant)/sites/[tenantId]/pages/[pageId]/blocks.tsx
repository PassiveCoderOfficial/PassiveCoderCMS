import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { usePageEdit } from "../../../../../../lib/pageEditContext";
import { updatePageBlocks } from "../../../../../../lib/queries/pages";
import { getBlockCatalogEntry, blockCatalogByCategory } from "../../../../../../lib/blockCatalog";
import type { Block } from "../../../../../../lib/types";
import { Button, ErrorText } from "../../../../../../components/form";
import { Card, EmptyState, LoadingSpinner, Screen } from "../../../../../../components/ui";
import { colors, radius } from "../../../../../../lib/theme";

function randomId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Literal defaults copied verbatim from baseBlock() in
// cms/src/modules/page-builder/block-registry.ts.
function newBlockFromCatalog(type: string, order: number): Block {
  const entry = getBlockCatalogEntry(type);
  return {
    id: randomId(),
    type,
    order,
    visible: true,
    width: "full",
    padding: { top: 64, right: 24, bottom: 64, left: 24 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    background: { type: "none" },
    animation: "none",
    data: entry ? { ...entry.defaultData } : {},
  };
}

/** Renumbers every block's order field sequentially 0..n-1, keeping array
 * order the source of truth (no gaps/duplicates after reorder/add/delete). */
function renumber(blocks: Block[]): Block[] {
  return blocks.map((b, i) => ({ ...b, order: i }));
}

export default function BlocksScreen() {
  const { tenantId, pageId } = useLocalSearchParams<{ tenantId: string; pageId: string }>();
  const { page, loading, error, dirty, setBlocks, markSaved } = usePageEdit();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const blocks = useMemo(
    () => (page?.blocks ? [...page.blocks].sort((a, b) => a.order - b.order) : []),
    [page]
  );

  function commit(next: Block[]) {
    setBlocks(renumber(next));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = blocks.slice();
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    commit(next);
  }

  function moveDown(index: number) {
    if (index === blocks.length - 1) return;
    const next = blocks.slice();
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    commit(next);
  }

  function toggleVisible(index: number) {
    const next = blocks.slice();
    next[index] = { ...next[index], visible: !next[index].visible };
    commit(next);
  }

  function duplicate(index: number) {
    const clone: Block = { ...blocks[index], id: randomId() };
    const next = blocks.slice();
    next.splice(index + 1, 0, clone);
    commit(next);
  }

  function remove(index: number) {
    Alert.alert("Delete block", "Remove this block from the page?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const next = blocks.slice();
          next.splice(index, 1);
          commit(next);
        },
      },
    ]);
  }

  function addBlock(type: string) {
    setPickerOpen(false);
    const block = newBlockFromCatalog(type, blocks.length);
    commit([...blocks, block]);
  }

  async function save() {
    if (!pageId || !tenantId || !page) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updatePageBlocks(pageId, tenantId, page.blocks);
      markSaved();
      Alert.alert("Saved", "Blocks updated.");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save blocks");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!page) {
    return (
      <Screen>
        <ErrorText>{error ?? "Page not found"}</ErrorText>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <FlatList
        data={blocks}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        ListHeaderComponent={saveError ? <ErrorText>{saveError}</ErrorText> : null}
        renderItem={({ item, index }) => {
          const entry = getBlockCatalogEntry(item.type);
          return (
            <BlockRow
              block={item}
              icon={entry?.icon}
              label={entry?.label}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
              onPress={() =>
                router.push(`/(tenant)/sites/${tenantId}/pages/${pageId}/blocks/${item.id}`)
              }
              onMoveUp={() => moveUp(index)}
              onMoveDown={() => moveDown(index)}
              onToggleVisible={() => toggleVisible(index)}
              onDuplicate={() => duplicate(index)}
              onDelete={() => remove(index)}
            />
          );
        }}
        ListEmptyComponent={<EmptyState title="No blocks yet" subtitle="Add a block to start building this page." />}
        ListFooterComponent={
          <View style={{ gap: 10, marginTop: 4 }}>
            <Button title="Add block" onPress={() => setPickerOpen(true)} />
            <Button
              title={dirty ? "Save changes" : "Saved"}
              onPress={save}
              loading={saving}
              disabled={!dirty}
              variant={dirty ? "primary" : "outline"}
            />
          </View>
        }
      />

      <BlockPickerModal visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addBlock} />
    </Screen>
  );
}

function BlockRow({
  block, icon, label, isFirst, isLast,
  onPress, onMoveUp, onMoveDown, onToggleVisible, onDuplicate, onDelete,
}: {
  block: Block;
  icon?: string;
  label?: string;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisible: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <Card style={{ gap: 10, opacity: block.visible ? 1 : 0.5 }}>
      <Pressable onPress={onPress} style={styles.rowMain}>
        <Text style={styles.icon}>{icon ?? "🧱"}</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.label} numberOfLines={1}>{label ?? block.type}</Text>
          <Text style={styles.type} numberOfLines={1}>
            {block.type}{!block.visible ? " · hidden" : ""}
          </Text>
        </View>
      </Pressable>
      <View style={styles.actionsRow}>
        <ActionButton label="↑" onPress={onMoveUp} disabled={isFirst} />
        <ActionButton label="↓" onPress={onMoveDown} disabled={isLast} />
        <ActionButton label={block.visible ? "Hide" : "Show"} onPress={onToggleVisible} />
        <ActionButton label="Duplicate" onPress={onDuplicate} />
        <ActionButton label="Delete" onPress={onDelete} danger />
      </View>
    </Card>
  );
}

function ActionButton({ label, onPress, disabled, danger }: {
  label: string; onPress: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionBtn,
        disabled && { opacity: 0.35 },
        pressed && !disabled && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.actionText, danger && { color: colors.red600 }]}>{label}</Text>
    </Pressable>
  );
}

function BlockPickerModal({ visible, onClose, onPick }: {
  visible: boolean;
  onClose: () => void;
  onPick: (type: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Add a block</Text>
          <ScrollView>
            {Object.entries(blockCatalogByCategory).map(([category, entries]) => (
              <View key={category} style={{ marginBottom: 12 }}>
                <Text style={styles.categoryLabel}>{category}</Text>
                {entries.map((entry) => (
                  <Pressable key={entry.type} style={styles.pickerRow} onPress={() => onPick(entry.type)}>
                    <Text style={styles.icon}>{entry.icon}</Text>
                    <Text style={styles.label}>{entry.label}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  rowMain: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { fontSize: 22 },
  label: { fontSize: 14, fontWeight: "700", color: colors.text },
  type: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  actionText: { fontSize: 12, fontWeight: "700", color: colors.text },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: "75%", paddingVertical: 8, paddingHorizontal: 16,
  },
  sheetTitle: { fontSize: 16, fontWeight: "800", color: colors.text, paddingVertical: 12 },
  categoryLabel: {
    fontSize: 11, fontWeight: "700", color: colors.textFaint,
    textTransform: "uppercase", marginBottom: 6, marginTop: 4,
  },
  pickerRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
});
