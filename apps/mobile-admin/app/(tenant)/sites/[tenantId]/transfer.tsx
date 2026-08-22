import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { transferOwnership } from "../../../../lib/queries/transfer";
import { Button, Field, Select, Switch, TextField } from "../../../../components/form";
import { Card, Screen, SectionHeader } from "../../../../components/ui";
import { radius, spacing, type } from "../../../../lib/theme";
import { useTheme } from "../../../../lib/themeContext";
import { useToast } from "../../../../lib/toast";
import { warningFeedback } from "../../../../lib/haptics";

const PREVIOUS_OWNER_OPTIONS = [
  { label: "Demote to admin member", value: "demote" },
  { label: "Remove from site", value: "remove" },
];

export default function TransferOwnershipScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [resetExistingPassword, setResetExistingPassword] = useState(false);
  const [previousOwner, setPreviousOwner] = useState<"demote" | "remove">("demote");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created?: boolean; passwordSet?: boolean; userId?: string } | null>(null);

  // Request shape is deliberately identical to the previous implementation —
  // this endpoint changes who controls a customer's site, so the payload is
  // not something to "tidy up" during a restyle.
  async function submit() {
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
      toast.error(r.error ?? "Failed to transfer ownership");
      return;
    }
    setResult({ created: r.created, passwordSet: r.passwordSet, userId: r.userId });
    toast.success("Ownership transferred");
  }

  function confirmSubmit() {
    if (!email.trim()) return;
    warningFeedback();
    Alert.alert(
      "Transfer this site?",
      `${email.trim()} will become the owner of this site. ` +
        (previousOwner === "remove"
          ? "The current owner will be removed from it entirely."
          : "The current owner will be demoted to an admin member."),
      [
        { text: "Cancel", style: "cancel" },
        { text: "Transfer", style: "destructive", onPress: submit },
      ],
    );
  }

  return (
    <Screen>
      <Card style={{ gap: spacing.sm, borderColor: palette.amber600 }}>
        <Text style={[type.bodyStrong, { color: palette.text }]}>This hands the site over</Text>
        <Text style={[type.caption, { color: palette.textMuted }]}>
          The new owner gets full control, including billing and the ability to remove other members.
          It can only be reversed by the new owner transferring it back.
        </Text>
      </Card>

      <SectionHeader title="New owner" />
      <Card style={{ gap: spacing.lg }}>
        <Field label="Email" required hint="If no account exists for this email, one will be created.">
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder="client@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </Field>

        <Field label="Full name" hint="Only used when creating a new account.">
          <TextField value={fullName} onChangeText={setFullName} placeholder="Client name" />
        </Field>

        <Field
          label="Password"
          hint="Leave blank to let them use their existing password, or set one to hand over directly. It is never shown again after this."
        >
          <TextField
            value={password}
            onChangeText={setPassword}
            placeholder="Leave blank to skip"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </Field>
      </Card>

      <SectionHeader title="Options" />
      <Card style={{ gap: spacing.md }}>
        <ToggleRow
          label="Require password change on first login"
          value={requirePasswordChange}
          onValueChange={setRequirePasswordChange}
        />
        <ToggleRow
          label="Reset password if the account already exists"
          value={resetExistingPassword}
          onValueChange={setResetExistingPassword}
        />
        <Field label="What happens to the current owner">
          <Select
            value={previousOwner}
            placeholder="Previous owner"
            options={PREVIOUS_OWNER_OPTIONS}
            onChange={(v) => setPreviousOwner(v as "demote" | "remove")}
          />
        </Field>
      </Card>

      {!!error && (
        <Card style={{ borderColor: palette.red600, gap: 4 }}>
          <Text style={[type.bodyStrong, { color: palette.red700 }]}>Transfer failed</Text>
          <Text style={[type.caption, { color: palette.textMuted }]}>{error}</Text>
        </Card>
      )}

      <Button
        title="Transfer ownership"
        variant="danger"
        onPress={confirmSubmit}
        loading={busy}
        disabled={!email.trim()}
      />

      {result && (
        <Card style={{ gap: 6, borderColor: palette.green600 }}>
          <Text style={[type.bodyStrong, { color: palette.green700 }]}>Transfer complete</Text>
          <Text style={[type.caption, { color: palette.textMuted }]}>
            {result.created ? "A new account was created for this owner." : "The existing account was reused."}
          </Text>
          <Text style={[type.caption, { color: palette.textMuted }]}>
            {result.passwordSet
              ? "The password you entered was set on the account."
              : "No password was changed — the owner keeps their existing credentials."}
          </Text>
        </Card>
      )}
    </Screen>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        minHeight: 44,
        borderRadius: radius.sm,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={[type.body, { color: palette.text, flex: 1 }]}>{label}</Text>
      <View pointerEvents="none">
        <Switch value={value} onValueChange={onValueChange} />
      </View>
    </Pressable>
  );
}
