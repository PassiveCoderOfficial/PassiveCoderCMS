import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, radius } from "../lib/theme";
import { StageBadge } from "./StageBadge";
import type { LeadListItem as LeadListItemType, CrmStage } from "../lib/queries/leads";

function relativeTime(iso: string | null): string {
  if (!iso) return "No activity yet";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function LeadListItem({
  tenantId,
  lead,
  stage,
}: {
  tenantId: string;
  lead: LeadListItemType;
  stage: CrmStage | null | undefined;
}) {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || "Unnamed lead";
  const subtitle = lead.company || lead.phone || lead.email || "No contact info";

  return (
    <Pressable
      onPress={() => router.push(`/(tenant)/sites/${tenantId}/leads/${lead.id}`)}
      style={styles.row}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        <Text style={styles.time}>{relativeTime(lead.last_activity_at)}</Text>
      </View>
      <StageBadge stage={stage} />
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
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted },
  time: { fontSize: 11, color: colors.textFaint, marginTop: 2 },
});
