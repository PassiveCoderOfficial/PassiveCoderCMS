import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { transferOwnership } from "../../../../lib/queries/transfer";
import { Button, ErrorText, Field, Select, TextField } from "../../../../components/form";
import { Card, Screen } from "../../../../components/ui";
import { colors } from "../../../../lib/theme";

const PREVIOUS_OWNER_OPTIONS = [
  { label: "Demote to admin member", value: "demote" },
  { label: "Remove from site", value: "remove" },
];

export default function TransferOwnershipScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [resetExistingPassword, setResetExistingPassword] = useState(false);
  const [previousOwner, setPreviousOwner] = useState<"demote" | "remove">("demote");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created?: boolean; passwordSet?: boolean; userId?: string } | null>(null);

  async function onSubmit() {
    if (!tenantId || !email.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    const r = await transferOwnership({
      tenantId,
      email: email.trim(),
      password: password.trim() || undefined,
      fullName: fullName.trim() || undefined,
      requirePasswordChange,
      resetExistingPassword,
      previousOwner,
    });
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? "Failed to transfer ownership");
      return;
    }
    setResult({ created: r.created, passwordSet: r.passwordSet, userId: r.userId });
  }

  return (
    <Screen>
      <Card style={{ gap: 14 }}>
        <Text style={styles.cardTitle}>Transfer site ownership</Text>

        <Field label="New owner email" required>
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder="client@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </Field>

        <Field label="Password (optional)">
          <TextField
            value={password}
            onChangeText={setPassword}
            placeholder="Leave blank to skip"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </Field>

        <Field label="Full name (optional)">
          <TextField value={fullName} onChangeText={setFullName} placeholder="Client name" />
        </Field>

        <Pressable style={styles.toggleRow} onPress={() => setRequirePasswordChange((v) => !v)}>
          <Text style={styles.toggleLabel}>Require password change on first login</Text>
          <Switch value={requirePasswordChange} onValueChange={setRequirePasswordChange} />
        </Pressable>

        <Pressable style={styles.toggleRow} onPress={() => setResetExistingPassword((v) => !v)}>
          <Text style={styles.toggleLabel}>Reset password if account already exists</Text>
          <Switch value={resetExistingPassword} onValueChange={setResetExistingPassword} />
        </Pressable>

        <Field label="Previous owner">
          <Select
            value={previousOwner}
            placeholder="Previous owner"
            options={PREVIOUS_OWNER_OPTIONS}
            onChange={(v) => setPreviousOwner(v as "demote" | "remove")}
          />
        </Field>

        <ErrorText>{error}</ErrorText>
        <Button title="Transfer ownership" onPress={onSubmit} loading={busy} disabled={!email.trim()} />
      </Card>

      {result && (
        <Card style={{ gap: 6 }}>
          <Text style={styles.cardTitle}>Transfer complete</Text>
          <Text style={styles.detail}>
            {result.created ? "A new account was created for this owner." : "The existing account was reused."}
          </Text>
          <Text style={styles.detail}>
            {result.passwordSet
              ? "A password was set on the account (the one you entered above)."
              : "No password was changed — the owner keeps their existing credentials."}
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  detail: { fontSize: 13, color: colors.textMuted },
  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    gap: 12,
  },
  toggleLabel: { fontSize: 13, color: colors.text, flex: 1 },
});
