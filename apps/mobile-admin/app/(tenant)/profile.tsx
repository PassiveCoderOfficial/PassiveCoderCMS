import { Text, View, StyleSheet } from "react-native";
import { useAuth } from "../../lib/auth";
import { useRole } from "../../lib/role";
import { Card, Screen } from "../../components/ui";
import { Badge } from "../../components/ui";
import { Button } from "../../components/form";
import { colors } from "../../lib/theme";

export default function TenantProfileScreen() {
  const { user, logout } = useAuth();
  const { memberships } = useRole();

  return (
    <Screen>
      <Card style={{ gap: 4 }}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </Card>

      <Card style={{ gap: 10 }}>
        <Text style={styles.label}>Your sites</Text>
        {memberships.map((m) => (
          <View key={m.tenantId} style={styles.row}>
            <Text style={styles.tenantName}>{m.tenant.name}</Text>
            <Badge label={m.role} />
          </View>
        ))}
        {memberships.length === 0 && <Text style={styles.muted}>No site memberships.</Text>}
      </Card>

      <Button title="Log out" variant="danger" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  email: { fontSize: 15, fontWeight: "700", color: colors.text },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tenantName: { fontSize: 14, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
});
