import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { radius } from "../lib/theme";
import { useTheme } from "../lib/themeContext";
import type { CrmStage } from "../lib/queries/leads";

/** Colored pill for a CRM stage — uses the stage's own `color` field rather
 * than the fixed status-keyword palette in components/ui.tsx's Badge, since
 * stage names are tenant-defined free text, not a known enum. */
export function StageBadge({ stage }: { stage: CrmStage | null | undefined }) {
  const { palette } = useTheme();

  if (!stage) {
    return (
      <View style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.border, borderWidth: 1 }]}>
        <Text style={[styles.text, { color: palette.textMuted }]}>No stage</Text>
      </View>
    );
  }

  // A tenant may leave `color` blank; fall back to the brand tint rather than
  // rendering an invalid "22"-suffixed color string.
  const color = stage.color?.trim() || palette.primary600;
  const isHex = /^#([0-9a-f]{6})$/i.test(color);

  return (
    <View
      style={[
        styles.badge,
        isHex
          ? { backgroundColor: `${color}22` }
          : { backgroundColor: palette.primary50 },
      ]}
    >
      <Text style={[styles.text, { color: isHex ? color : palette.primary700 }]} numberOfLines={1}>
        {stage.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 130,
  },
  text: { fontSize: 11, fontWeight: "700" },
});
