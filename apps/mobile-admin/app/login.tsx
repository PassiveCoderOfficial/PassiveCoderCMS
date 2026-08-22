import { useRef, useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../lib/auth";
import { Button, ErrorText, Field, TextField } from "../components/form";
import { Card, Screen } from "../components/ui";
import { radius, spacing, type } from "../lib/theme";
import { useTheme } from "../lib/themeContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const { palette } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  // Field-level validation vs a general auth failure — rendered differently
  // so "that address isn't an email" doesn't look like "wrong password".
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function submit() {
    if (!canSubmit || busy) return;
    setEmailError(null);
    setError(null);

    if (!email.includes("@")) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setBusy(true);
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
    <Screen keyboardAvoiding>
      <View style={{ alignItems: "center", gap: spacing.sm, marginTop: 48, marginBottom: spacing.lg }}>
        <Image
          source={require("../assets/icon.png")}
          style={{ width: 72, height: 72, borderRadius: 18 }}
          resizeMode="cover"
        />
        <Text style={[type.title, { color: palette.text, marginTop: spacing.sm }]}>Passive Coder</Text>
        <Text style={[type.body, { color: palette.textMuted }]}>Admin</Text>
      </View>

      <Card style={{ gap: 14 }}>
        <Field label="Email" required error={emailError ?? undefined}>
          <TextField
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (emailError) setEmailError(null);
            }}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            submitBehavior="submit"
          />
        </Field>

        <Field label="Password" required>
          <View style={{ position: "relative", justifyContent: "center" }}>
            <TextField
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              style={{ paddingRight: 48 }}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 4,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.sm,
              }}
            >
              <Text style={{ fontSize: 16 }}>{showPassword ? "🙈" : "👁"}</Text>
            </Pressable>
          </View>
        </Field>

        <ErrorText>{error}</ErrorText>

        <Button title="Sign In" onPress={submit} loading={busy} disabled={!canSubmit} />
      </Card>
    </Screen>
  );
}
