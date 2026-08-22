import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { usePageEdit } from "../../../../../../lib/pageEditContext";
import { updatePageBlocks } from "../../../../../../lib/queries/pages";
import { getBlockCatalogEntry, blockCatalogByCategory } from "../../../../../../lib/blockCatalog";
import type { Block } from "../../../../../../lib/types";
import { Button, SearchField } from "../../../../../../components/form";
import {
  Card,
  EmptyState,
  Screen,
  Skeleton,
  Tag,
} from "../../../../../../components/ui";
import { radius, shadow, spacing, type } from "../../../../../../lib/theme";
import { useTheme } from "../../../../../../lib/themeContext";
import { useToast } from "../../../../../../lib/toast";
import { actionFeedback, tapFeedback, warningFeedback } from "../../../../../../lib/haptics";

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

const SAVE_BAR_HEIGHT = 64;

export default function BlocksScreen() {
  const { tenantId, pageId } = useLocalSearchParams<{ tenantId: string; pageId: string }>();
  const { page, loading, error, dirty, setBlocks, markSaved } = usePageEdit();
  const { palette } = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [saving, setSaving] = useState(false);
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
    tapFeedback();
    const next = blocks.slice();
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    commit(next);
  }

  function moveDown(index: number) {
    if (index === blocks.length - 1) return;
    tapFeedback();
    const next = blocks.slice();
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    commit(next);
  }

  function toggleVisible(index: number) {
    tapFeedback();
    const next = blocks.slice();
    next[index] = { ...next[index], visible: !next[index].visible };
    commit(next);
  }

  function duplicate(index: number) {
    actionFeedback();
    const clone: Block = { ...blocks[index], id: randomId() };
    const next = blocks.slice();
    next.splice(index + 1, 0, clone);
    commit(next);
  }

  function remove(index: number) {
    warningFeedback();
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
    actionFeedback();
    const block = newBlockFromCatalog(type, blocks.length);
    commit([...blocks, block]);
  }

  async function save() {
    if (!pageId || !tenantId || !page) return;
    setSaving(true);
    try {
      await updatePageBlocks(pageId, tenantId, page.blocks);
      markSaved();
      toast.success("Blocks saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save blocks");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Skeleton height={80} radius={radius.lg} />
        <Skeleton height={80} radius={radius.lg} />
        <Skeleton height={80} radius={radius.lg} />
      </Screen>
    );
  }

  if (!page) {
    return (
      <Screen>
        <EmptyState title="Couldn't load this page" subtitle={error ?? "Page not found"} icon="⚠️" />
      </Screen>
    );
  }

  // Screen's SafeAreaView already applies the bottom inset to everything
  // inside it, so absolutely-positioned children measure from the safe edge.
  // On platforms reporting no inset (most Android) give the bar a little
  // breathing room of its own so it isn't flush against the screen edge.
  const barBottomPad = insets.bottom > 0 ? spacing.md : spacing.lg;
  // Keep the last row clear of the FAB and, when present, the save bar.
  const listBottomPad = spacing.lg + 72 + (dirty ? SAVE_BAR_HEIGHT : 0);
  const fabBottom = spacing.lg + (dirty ? SAVE_BAR_HEIGHT : 0);

  return (
    <Screen scroll={false}>
      <FlatList
        data={blocks}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: listBottomPad,
          gap: spacing.md,
          flexGrow: 1,
        }}
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
        ListEmptyComponent={
          <EmptyState
            title="No blocks yet"
            subtitle="Add a block to start building this page."
            icon="🧱"
            action={{ label: "Add a block", onPress: () => setPickerOpen(true) }}
          />
        }
      />

      {/* ------------------------------------------------------------- FAB */}
      <Pressable
        onPress={() => {
          tapFeedback();
          setPickerOpen(true);
        }}
        accessibilityLabel="Add block"
        style={({ pressed }) => [
          styles.fab,
          shadow.raised,
          {
            backgroundColor: palette.primary600,
            bottom: fabBottom,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text style={[styles.fabGlyph, { color: palette.onPrimary }]}>+</Text>
      </Pressable>

      {/* ------------------------------------------------- Sticky save bar */}
      {dirty && (
        <View
          style={[
            styles.saveBar,
            {
              paddingBottom: barBottomPad,
              backgroundColor: palette.bgElevated,
              borderTopColor: palette.border,
            },
          ]}
        >
          <Text style={[type.bodyStrong, { color: palette.text, flex: 1 }]}>Unsaved changes</Text>
          <Button title="Save" onPress={save} loading={saving} />
        </View>
      )}

      <BlockPickerModal visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addBlock} />
    </Screen>
  );
}

/* ---------------------------------------------------------------- BlockRow */

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
  const { palette } = useTheme();
  return (
    <Card style={{ gap: spacing.sm, opacity: block.visible ? 1 : 0.6 }}>
      <Pressable
        onPress={() => {
          tapFeedback();
          onPress();
        }}
        style={({ pressed }) => [styles.rowMain, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={styles.icon}>{icon ?? "🧱"}</Text>
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text style={[type.bodyStrong, { color: palette.text }]} numberOfLines={1}>
            {label ?? block.type}
          </Text>
          <Text style={[type.caption, { color: palette.textMuted }]} numberOfLines={1}>
            {block.type}
          </Text>
        </View>
        {!block.visible && <Tag label="Hidden" />}
        <Text style={{ color: palette.textFaint, fontSize: 18 }}>›</Text>
      </Pressable>

      <View style={styles.actionsRow}>
        <IconAction glyph="↑" label="Move up" onPress={onMoveUp} disabled={isFirst} />
        <IconAction glyph="↓" label="Move down" onPress={onMoveDown} disabled={isLast} />
        <IconAction
          glyph={block.visible ? "👁" : "🙈"}
          label={block.visible ? "Hide block" : "Show block"}
          onPress={onToggleVisible}
        />
        <IconAction glyph="⧉" label="Duplicate block" onPress={onDuplicate} />
        <IconAction glyph="🗑" label="Delete block" onPress={onDelete} danger />
      </View>
    </Card>
  );
}

/** Square icon button with a real 40x40 hit target — the old text strip was
 *  far too small to hit reliably with a thumb. */
function IconAction({
  glyph, label, onPress, disabled, danger,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.iconBtn,
        {
          borderColor: danger ? palette.red600 : palette.borderStrong,
          backgroundColor: palette.bgElevated,
        },
        disabled && { opacity: 0.3 },
        pressed && !disabled && { opacity: 0.6 },
      ]}
    >
      <Text style={{ fontSize: 16, color: danger ? palette.red600 : palette.text }}>{glyph}</Text>
    </Pressable>
  );
}

/* -------------------------------------------------------- BlockPickerModal */

function BlockPickerModal({ visible, onClose, onPick }: {
  visible: boolean;
  onClose: () => void;
  onPick: (type: string) => void;
}) {
  const { palette } = useTheme();
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(blockCatalogByCategory)
      .map(([category, entries]) => ({
        category,
        entries: q ? entries.filter((e) => e.label.toLowerCase().includes(q)) : entries,
      }))
      .filter((g) => g.entries.length > 0);
  }, [query]);

  function close() {
    setQuery("");
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={[styles.backdrop, { backgroundColor: palette.overlay }]} onPress={close}>
        {/* Stop taps inside the sheet from bubbling to the backdrop. */}
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.bgElevated }]}
          onPress={() => {}}
        >
          <Text style={[type.heading, { color: palette.text, paddingVertical: spacing.md }]}>
            Add a block
          </Text>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Search blocks…"
            style={{ marginBottom: spacing.md }}
          />
          <ScrollView keyboardShouldPersistTaps="handled">
            {categories.map(({ category, entries }) => (
              <View key={category} style={{ marginBottom: spacing.md }}>
                <Text
                  style={[
                    type.label,
                    {
                      color: palette.textFaint,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 6,
                      marginTop: spacing.xs,
                    },
                  ]}
                >
                  {category}
                </Text>
                {entries.map((entry) => (
                  <Pressable
                    key={entry.type}
                    style={({ pressed }) => [
                      styles.pickerRow,
                      { borderBottomColor: palette.border, opacity: pressed ? 0.6 : 1 },
                    ]}
                    onPress={() => onPick(entry.type)}
                  >
                    <Text style={styles.icon}>{entry.icon}</Text>
                    <Text style={[type.bodyStrong, { color: palette.text, flex: 1 }]}>
                      {entry.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
            {categories.length === 0 && (
              <Text
                style={[
                  type.body,
                  { color: palette.textMuted, textAlign: "center", padding: spacing.xl },
                ]}
              >
                No blocks match “{query.trim()}”
              </Text>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  rowMain: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 48 },
  icon: { fontSize: 22 },
  actionsRow: { flexDirection: "row", gap: spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  fabGlyph: { fontSize: 30, fontWeight: "300", lineHeight: 34 },
  saveBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "75%",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 14,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
