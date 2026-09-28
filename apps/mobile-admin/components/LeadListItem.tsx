import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useLanguage } from "../lib/languageContext";
import { router } from "expo-router";
import { radius, shadow, spacing, type } from "../lib/theme";
import { useTheme } from "../lib/themeContext";
import { tapFeedback } from "../lib/haptics";
import { initials, leadDisplayName, relativeTime } from "../lib/format";
import { Avatar } from "./ui";
import { StageBadge } from "./StageBadge";
import { Icon } from "./Icon";
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
  const { t } = useLanguage();
  const subtitle = lead.company || lead.phone || lead.email || t("lead.noContact");

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
          {lead.last_activity_at ? relativeTime(lead.last_activity_at) : t("lead.noActivity")}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 8 }}>
        <StageBadge stage={stage} />
        {lead.phone ? (
          <View style={{ flexDirection: "row", gap: 6 }}>
            <QuickContact icon="call-outline" label={t("lead.call")} onPress={() => Linking.openURL(`tel:${lead.phone}`)} />
            <QuickContact
              icon="logo-whatsapp"
              label={t("lead.whatsapp")}
              tint="#25D366"
              onPress={() => Linking.openURL(`https://wa.me/${String(lead.phone).replace(/[^\d]/g, "")}`)}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Small round action on a lead row — its own press target, so tapping it
 *  contacts the lead without also opening the lead detail. */
function QuickContact({
  icon,
  label,
  tint,
  onPress,
}: {
  icon: string;
  label: string;
  tint?: string;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={(e) => {
        e.stopPropagation?.();
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => ({
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.bg,
        borderWidth: 1,
        borderColor: palette.border,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={icon} size={17} color={tint ?? palette.primary600} />
    </Pressable>
  );
}
