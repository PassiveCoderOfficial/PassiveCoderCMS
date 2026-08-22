// Reusable form primitives, adapted from cms/mobile/components/form.tsx's
// Select/Field pattern but restyled with this app's theme and simplified
// (no map/location pickers — not needed by this app).

import React, { useState } from "react";
import {
  ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text,
  TextInput, View, type TextInputProps, type ViewStyle,
} from "react-native";
import { colors, radius } from "../lib/theme";

export function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={{ color: colors.red600 }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

export function TextField(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textFaint}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

export function ErrorText({ children }: { children: string | null | undefined }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function Button({ title, onPress, loading, variant = "primary", disabled, style }: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "outline" | "danger";
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg = variant === "primary" ? colors.primary600 : variant === "danger" ? colors.red600 : "transparent";
  const fg = variant === "outline" ? colors.text : colors.white;
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed || isDisabled ? 0.7 : 1 },
        variant === "outline" && { borderWidth: 1, borderColor: colors.borderStrong },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} size="small" /> : (
        <Text style={{ color: fg, fontWeight: "700", fontSize: 14 }}>{title}</Text>
      )}
    </Pressable>
  );
}

/** Simple option picker via a bottom-sheet modal — RN has no native <select>. */
export function Select({ value, placeholder, options, onChange }: {
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.select}>
        <Text style={{ color: current ? colors.text : colors.textFaint, fontSize: 14 }}>
          {current?.label ?? placeholder}
        </Text>
      </Pressable>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <ScrollView>
              {options.map((o) => (
                <Pressable key={o.value} style={styles.opt} onPress={() => { onChange(o.value); setOpen(false); }}>
                  <Text style={{ color: colors.text, fontWeight: value === o.value ? "700" : "400" }}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  input: {
    borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    backgroundColor: colors.white, color: colors.text,
  },
  error: { color: colors.red600, fontSize: 12, marginTop: 2 },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md,
  },
  select: {
    borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: colors.white,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: "60%", paddingVertical: 8,
  },
  opt: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
});
