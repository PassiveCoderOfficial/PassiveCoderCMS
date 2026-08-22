import { Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useRole } from "../../lib/role";
import { useSelectedTenant } from "../../lib/tenant";
import { Card, EmptyState, LoadingSpinner, Screen } from "../../components/ui";
import { Button } from "../../components/form";
import { colors } from "../../lib/theme";

export default function DashboardScreen() {
  const { memberships } = useRole();
  const { selectedTenantId, loading } = useSelectedTenant();

  if (loading) return <LoadingSpinner />;

  const membership = memberships.find((m) => m.tenantId === selectedTenantId);

  if (!membership) {
    return (
      <Screen>
        <EmptyState
          title="No site selected"
          subtitle="Pick a site from the Sites tab to see its dashboard."
        />
      </Screen>
    );
  }

  const { tenant } = membership;

  return (
    <Screen>
      <View>
        <Text style={styles.welcome}>Welcome back</Text>
        <Text style={styles.tenantName}>{tenant.name}</Text>
      </View>

      <Card style={{ gap: 12 }}>
        <Text style={styles.cardTitle}>Quick links</Text>
        <Button
          title="Pages"
          variant="outline"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/pages`)}
        />
        <Button
          title="Leads"
          variant="outline"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/leads`)}
        />
        <Button
          title="Site settings"
          variant="outline"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/settings`)}
        />
        <Button
          title="Domain"
          variant="outline"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/domain`)}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  welcome: { fontSize: 13, color: colors.textMuted },
  tenantName: { fontSize: 22, fontWeight: "800", color: colors.text },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
});
