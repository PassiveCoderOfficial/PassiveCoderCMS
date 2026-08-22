import { Text } from "react-native";
import { useAuth } from "../../lib/auth";
import { useRole } from "../../lib/role";
import { Card, Screen } from "../../components/ui";
import { Button } from "../../components/form";
import { colors } from "../../lib/theme";
import { StyleSheet } from "react-native";

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();
  const { role, isManager } = useRole();

  return (
    <Screen>
      <Card style={{ gap: 4 }}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>
          {role === "super_admin" ? "Super Admin" : "Passive Coder Staff"}
          {isManager ? " (Manager)" : ""}
        </Text>
      </Card>

      <Button title="Log out" variant="danger" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  email: { fontSize: 15, fontWeight: "700", color: colors.text },
  value: { fontSize: 14, color: colors.text },
});
