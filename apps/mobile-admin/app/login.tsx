import { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../lib/auth";
import { Button, ErrorText, Field, TextField } from "../components/form";
import { Card, Screen } from "../components/ui";
import { colors } from "../lib/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const r = await login(email.trim(), password);
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? "Login failed");
      return;
    }
    // index.tsx's redirect effect takes over from here.
    router.replace("/");
  }

  return (
    <Screen>
      <View style={{ alignItems: "center", gap: 4, marginTop: 40, marginBottom: 8 }}>
        <Text style={styles.brand}>Passive Coder</Text>
        <Text style={styles.title}>Admin</Text>
      </View>

      <Card style={{ gap: 14 }}>
        <Field label="Email" required>
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </Field>
        <Field label="Password" required>
          <TextField
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button title="Sign In" onPress={submit} loading={busy} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
});
