import { useRef, useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../lib/auth";
import { Button, ErrorText, Field, TextField } from "../components/form";
import { Card, Screen } from "../components/ui";
import { radius, shadow, spacing, type } from "../lib/theme";
import { Icon } from "../components/Icon";
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
      <View style={{ alignItems: "center", gap: spacing.xs, marginTop: "18%", marginBottom: spacing.xl }}>
        <View style={[{ borderRadius: 22, padding: 4, backgroundColor: palette.primary50 }, shadow.raised]}>
          <Image
            source={require("../assets/icon.png")}
            style={{ width: 76, height: 76, borderRadius: 18 }}
            resizeMode="cover"
          />
        </View>
        <Text style={[type.display, { color: palette.text, marginTop: spacing.lg }]}>Welcome back</Text>
        <Text style={[type.body, { color: palette.textMuted, textAlign: "center" }]}>
          Sign in to manage your sites, leads and pages.
        </Text>
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
              <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} />
            </Pressable>
          </View>
        </Field>

        <ErrorText>{error}</ErrorText>

        <Button title="Sign In" onPress={submit} loading={busy} disabled={!canSubmit} style={{ marginTop: spacing.xs }} />
      </Card>

      <Pressable
        onPress={() => router.push("/onboard")}
        style={({ pressed }) => ({ alignSelf: "center", marginTop: spacing.lg, padding: spacing.sm, opacity: pressed ? 0.6 : 1 })}
      >
        <Text style={[type.body, { color: palette.textMuted }]}>
          New here? <Text style={{ color: palette.primary600, fontWeight: "700" }}>Create a site</Text>
        </Text>
      </Pressable>

      <Text style={[type.caption, { color: palette.textFaint, textAlign: "center", marginTop: "auto", paddingTop: spacing.xl }]}>
        Passive Coder Admin
      </Text>
    </Screen>
  );
}
