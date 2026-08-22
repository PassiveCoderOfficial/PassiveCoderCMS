import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../lib/theme";
import type { CrmStage } from "../lib/queries/leads";

/** Colored pill for a CRM stage — uses the stage's own `color` field rather
 * than the fixed status-keyword palette in components/ui.tsx's Badge, since
 * stage names are tenant-defined free text, not a known enum. */
export function StageBadge({ stage }: { stage: CrmStage | null | undefined }) {
  if (!stage) {
    return (
      <View style={[styles.badge, { backgroundColor: "#f1f5f9" }]}>
        <Text style={[styles.text, { color: colors.textMuted }]}>No stage</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: `${stage.color}22` }]}>
      <Text style={[styles.text, { color: stage.color }]} numberOfLines={1}>
        {stage.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: 11, fontWeight: "700" },
});
