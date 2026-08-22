import React from "react";
import { Pressable, Text, View } from "react-native";
import { radius, shadow, spacing, type } from "../lib/theme";
import { useTheme } from "../lib/themeContext";
import { tapFeedback } from "../lib/haptics";
import { humanize } from "../lib/format";
import { Badge, Tag } from "./ui";
import type { Tenant, TenantMemberRole } from "../lib/types";

export function TenantCard({
  tenant,
  role,
  onPress,
}: {
  tenant: Tenant;
  /** The signed-in user's role in this tenant, shown as a small tag. */
  role?: TenantMemberRole;
  onPress: () => void;
}) {
  const { palette } = useTheme();

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          padding: spacing.lg,
          backgroundColor: palette.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: palette.border,
          opacity: pressed ? 0.8 : 1,
        },
        shadow.card,
      ]}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text style={[type.heading, { color: palette.text, flexShrink: 1 }]} numberOfLines={1}>
            {tenant.name}
          </Text>
          {role ? <Tag label={role} /> : null}
        </View>
        <Text style={[type.caption, { color: palette.textMuted }]} numberOfLines={1}>
          /{tenant.slug} · {humanize(tenant.plan)} plan
        </Text>
        <Text style={[type.caption, { color: palette.textFaint }]} numberOfLines={1}>
          {tenant.custom_domain ?? "No custom domain"}
        </Text>
      </View>
      <Badge label={tenant.status} />
    </Pressable>
  );
}
