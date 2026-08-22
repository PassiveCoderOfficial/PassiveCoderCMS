import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../lib/theme";
import { Badge } from "./ui";
import type { Tenant } from "../lib/types";

export function TenantCard({ tenant, onPress }: { tenant: Tenant; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text style={styles.name} numberOfLines={1}>{tenant.name}</Text>
        <Text style={styles.plan}>{tenant.plan} plan</Text>
        <Text style={styles.domain} numberOfLines={1}>
          {tenant.custom_domain ?? "No custom domain"}
        </Text>
      </View>
      <Badge label={tenant.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  plan: { fontSize: 12, color: colors.textMuted, textTransform: "capitalize" },
  domain: { fontSize: 12, color: colors.textFaint },
});
