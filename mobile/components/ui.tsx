import React from "react";
import {
  ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput,
  View, type TextInputProps, type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { availabilityMeta, colors, radius } from "../lib/theme";

/** Blood-drop fallback avatar, same idea as the web's DonorAvatar. */
export function DonorAvatar({ photoUrl, name, size = 44 }: {
  photoUrl?: string | null; name?: string; size?: number;
}) {
  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.red50 }}
      />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.red50, alignItems: "center", justifyContent: "center",
    }}>
      <Ionicons name="water" size={size * 0.5} color={colors.red600} />
    </View>
  );
}

export function BloodBadge({ group, size = 40 }: { group: string; size?: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.red600, alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ color: colors.white, fontWeight: "800", fontSize: size * 0.32 }}>
        {group}
      </Text>
    </View>
  );
}

export function AvailabilityChip({ availability, lastDonatedOn }: {
  availability: string; lastDonatedOn?: string | null;
}) {
  const meta = availabilityMeta[availability] ?? availabilityMeta.unknown;
  let label = meta.label;
  if (availability === "ready") label = "Ready to donate";
  else if (availability === "unavailable") label = "Unavailable";
  else if (lastDonatedOn && availability !== "unknown") {
    const days = Math.floor((Date.now() - new Date(lastDonatedOn).getTime()) / 86400000);
    label = `${days} days ago`;
  }
  return (
    <View style={{
      backgroundColor: meta.bg, borderRadius: radius.full,
      paddingHorizontal: 10, paddingVertical: 4,
    }}>
      <Text style={{ color: meta.text, fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

export function Button({ title, onPress, loading, variant = "primary", icon, style }: {
  title: string; onPress: () => void; loading?: boolean;
  variant?: "primary" | "outline" | "green" | "dark";
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  const bg = variant === "primary" ? colors.red600
    : variant === "green" ? colors.green600
    : variant === "dark" ? "#374151"
    : "transparent";
  const fg = variant === "outline" ? colors.text : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed || loading ? 0.85 : 1 },
        variant === "outline" && { borderWidth: 1, borderColor: colors.borderStrong },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} size="small" /> : (
        <>
          {icon && <Ionicons name={icon} size={16} color={fg} />}
          <Text style={{ color: fg, fontWeight: "700", fontSize: 14 }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: "#4b5563" }}>
        {label}{required && <Text style={{ color: colors.red500 }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textFaint}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

export function PasswordInput(props: TextInputProps) {
  const [show, setShow] = React.useState(false);
  return (
    <View style={{ position: "relative", justifyContent: "center" }}>
      <TextInput
        secureTextEntry={!show}
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        {...props}
        style={[styles.input, { paddingRight: 42 }, props.style]}
      />
      <Pressable onPress={() => setShow((v) => !v)}
        style={{ position: "absolute", right: 8, padding: 8 }}>
        <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textFaint} />
      </Pressable>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={{ paddingVertical: 48, alignItems: "center" }}>
      <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: "center" }}>{text}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ paddingVertical: 48, alignItems: "center" }}>
      <ActivityIndicator color={colors.red600} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md,
  },
  input: {
    borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    backgroundColor: colors.white, color: colors.text,
  },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: 16,
  },
});
