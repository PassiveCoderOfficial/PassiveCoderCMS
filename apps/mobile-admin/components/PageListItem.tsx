import React from "react";
import { Pressable, Text, View } from "react-native";
import { useLanguage } from "../lib/languageContext";
import { router } from "expo-router";
import { radius, shadow, spacing, type } from "../lib/theme";
import { useTheme } from "../lib/themeContext";
import { tapFeedback } from "../lib/haptics";
import { relativeTime } from "../lib/format";
import { Badge } from "./ui";
import { IconTile } from "./Icon";
import type { PageListItem as PageListItemType } from "../lib/queries/pages";

export function PageListItem({ tenantId, page }: { tenantId: string; page: PageListItemType }) {
  const { palette } = useTheme();
  const { t } = useLanguage();

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        router.push(`/(tenant)/sites/${tenantId}/pages/${page.id}`);
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
      <IconTile
        name={page.slug === "home" || page.slug === "" ? "home-outline" : "document-text-outline"}
        tone={page.status === "published" ? "brand" : "neutral"}
      />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={[type.bodyStrong, { color: palette.text }]} numberOfLines={1}>
          {page.title}
        </Text>
        <Text style={[type.caption, { color: palette.textMuted }]} numberOfLines={1}>
          /{page.slug}
        </Text>
        <Text style={[type.caption, { color: palette.textFaint }]}>
          {t("pages.updated", { when: relativeTime(page.updated_at) })}
        </Text>
      </View>
      <Badge label={page.status} />
    </Pressable>
  );
}
