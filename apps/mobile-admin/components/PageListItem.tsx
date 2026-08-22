import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, radius } from "../lib/theme";
import { Badge } from "./ui";
import type { PageListItem as PageListItemType } from "../lib/queries/pages";

export function PageListItem({ tenantId, page }: { tenantId: string; page: PageListItemType }) {
  return (
    <Pressable
      onPress={() => router.push(`/(tenant)/sites/${tenantId}/pages/${page.id}`)}
      style={styles.row}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={styles.title} numberOfLines={1}>{page.title}</Text>
        <Text style={styles.slug} numberOfLines={1}>/{page.slug}</Text>
        <Text style={styles.updated}>Updated {new Date(page.updated_at).toLocaleDateString()}</Text>
      </View>
      <Badge label={page.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.white, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  title: { fontSize: 14, fontWeight: "700", color: colors.text },
  slug: { fontSize: 12, color: colors.textMuted },
  updated: { fontSize: 11, color: colors.textFaint, marginTop: 2 },
});
