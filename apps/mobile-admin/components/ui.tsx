import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "../lib/theme";

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["bottom"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, flexGrow: 1 }}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

export function LoadingSpinner() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary600} />
    </View>
  );
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: colors.green50, text: colors.green700 },
  published: { bg: colors.green50, text: colors.green700 },
  trial: { bg: colors.amber50, text: colors.amber700 },
  pending: { bg: colors.amber50, text: colors.amber700 },
  draft: { bg: colors.amber50, text: colors.amber700 },
  suspended: { bg: colors.red50, text: colors.red700 },
  failed: { bg: colors.red50, text: colors.red700 },
  cancelled: { bg: colors.red50, text: colors.red700 },
  archived: { bg: "#f1f5f9", text: colors.textMuted },
  none: { bg: "#f1f5f9", text: colors.textMuted },
};

export function Badge({ label }: { label: string }) {
  const meta = STATUS_COLORS[label] ?? { bg: colors.primary50, text: colors.primary700 };
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.badgeText, { color: meta.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8,
  },
  empty: { paddingVertical: 48, alignItems: "center", gap: 4, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: colors.text, textAlign: "center" },
  emptySubtitle: { fontSize: 12, color: colors.textMuted, textAlign: "center" },
  loading: { paddingVertical: 48, alignItems: "center" },
  badge: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
});
