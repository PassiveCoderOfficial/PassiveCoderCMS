import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { radius, shadow, spacing, type } from "../lib/theme";
import { useTheme } from "../lib/themeContext";
import { tapFeedback } from "../lib/haptics";
import { initials, leadDisplayName, relativeTime } from "../lib/format";
import { Avatar } from "./ui";
import { StageBadge } from "./StageBadge";
import type { LeadListItem as LeadListItemType, CrmStage } from "../lib/queries/leads";

export function LeadListItem({
  tenantId,
  lead,
  stage,
}: {
  tenantId: string;
  lead: LeadListItemType;
  stage: CrmStage | null | undefined;
}) {
  const { palette } = useTheme();
  const subtitle = lead.company || lead.phone || lead.email || "No contact info";

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        router.push(`/(tenant)/sites/${tenantId}/leads/${lead.id}`);
      }}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: 14,
          minHeight: 72,
          backgroundColor: palette.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: palette.border,
          opacity: pressed ? 0.8 : 1,
        },
        shadow.card,
      ]}
    >
      <Avatar text={initials(lead)} size={40} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={[type.bodyStrong, { color: palette.text }]} numberOfLines={1}>
          {leadDisplayName(lead)}
        </Text>
        <Text style={[type.caption, { color: palette.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
        <Text style={[type.caption, { color: palette.textFaint }]}>
          {lead.last_activity_at ? relativeTime(lead.last_activity_at) : "No activity yet"}
        </Text>
      </View>
      <StageBadge stage={stage} />
    </Pressable>
  );
}
