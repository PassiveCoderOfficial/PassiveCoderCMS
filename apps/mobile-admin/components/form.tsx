// Reusable form primitives. Theme-aware: every component reads the live
// palette via useTheme() rather than the static `colors` export, so forms
// follow the light/dark preference.

import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch as RNSwitch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { radius, spacing, type } from "../lib/theme";
import { useTheme } from "../lib/themeContext";
import { tapFeedback } from "../lib/haptics";

/* -------------------------------------------------------------------- Field */

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  /** Helper text under the input. Suppressed while `error` is set. */
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[type.label, { color: palette.textMuted }]}>
        {label}
        {required && <Text style={{ color: palette.red600 }}> *</Text>}
      </Text>
      {children}
      {error ? (
        <Text style={[type.caption, { color: palette.red600 }]}>{error}</Text>
      ) : hint ? (
        <Text style={[type.caption, { color: palette.textFaint }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* ---------------------------------------------------------------- TextField */

// forwardRef so callers can chain focus between fields (returnKeyType="next"
// → focus the next input) — a plain function component can't hold a ref.
export const TextField = React.forwardRef<TextInput, TextInputProps>(function TextField(props, ref) {
  const { palette } = useTheme();
  const [focused, setFocused] = useState(false);

  // Forward any caller-supplied focus handlers rather than swallowing them.
  // Event types are derived from TextInputProps so they track RN's own
  // signatures (FocusEvent/BlurEvent as of RN 0.81).
  const handleFocus: NonNullable<TextInputProps["onFocus"]> = (e) => {
    setFocused(true);
    props.onFocus?.(e);
  };
  const handleBlur: NonNullable<TextInputProps["onBlur"]> = (e) => {
    setFocused(false);
    props.onBlur?.(e);
  };

  return (
    <TextInput
      ref={ref}
      placeholderTextColor={palette.textFaint}
      {...props}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={[
        {
          borderWidth: 1,
          borderColor: focused ? palette.primary600 : palette.borderStrong,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: 10,
          fontSize: 14,
          backgroundColor: palette.bgElevated,
          color: palette.text,
        },
        props.multiline && {
          minHeight: 96,
          textAlignVertical: "top" as const,
          paddingTop: 10,
        },
        props.style,
      ]}
    />
  );
});

/* ---------------------------------------------------------------- ErrorText */

export function ErrorText({ children }: { children: string | null | undefined }) {
  const { palette } = useTheme();
  if (!children) return null;
  return (
    <Text style={[type.caption, { color: palette.red600, marginTop: 2 }]}>{children}</Text>
  );
}

/* ------------------------------------------------------------------- Button */

export function Button({
  title,
  onPress,
  loading,
  variant = "primary",
  size = "md",
  icon,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md";
  /** Emoji rendered before the label. */
  icon?: string;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const { palette } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = !!(disabled || loading);

  const bg =
    variant === "primary" ? palette.primary600
    : variant === "danger" ? palette.red600
    : "transparent";

  const fg =
    variant === "primary" || variant === "danger" ? palette.onPrimary
    : variant === "ghost" ? palette.primary600
    : palette.text;

  const spring = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      damping: 18,
      stiffness: 320,
      mass: 0.4,
    }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={() => {
          if (isDisabled) return;
          tapFeedback();
          onPress();
        }}
        onPressIn={() => !isDisabled && spring(0.97)}
        onPressOut={() => spring(1)}
        disabled={isDisabled}
        style={({ pressed }) => [
          btnStyles.btn,
          size === "sm" ? btnStyles.sm : btnStyles.md,
          { backgroundColor: bg, opacity: pressed || isDisabled ? 0.7 : 1 },
          variant === "outline" && { borderWidth: 1, borderColor: palette.borderStrong },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={fg} size="small" />
        ) : (
          <>
            {icon ? <Text style={{ fontSize: size === "sm" ? 13 : 15 }}>{icon}</Text> : null}
            <Text style={{ color: fg, fontWeight: "700", fontSize: size === "sm" ? 13 : 14 }}>
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const btnStyles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.md,
  },
  sm: { paddingVertical: 8, paddingHorizontal: spacing.md },
  md: { paddingVertical: 12, paddingHorizontal: spacing.lg },
});

/* ------------------------------------------------------------------- Select */

const SEARCH_THRESHOLD = 8;

/** Simple option picker via a bottom-sheet modal — RN has no native <select>. */
export function Select({
  value,
  placeholder,
  options,
  onChange,
  searchable,
}: {
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  /** Show a filter input at the top of the sheet (only past 8 options). */
  searchable?: boolean;
}) {
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = options.find((o) => o.value === value);

  const showSearch = !!searchable && options.length > SEARCH_THRESHOLD;
  const visible = useMemo(() => {
    if (!showSearch || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, showSearch]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: palette.borderStrong,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: 11,
          backgroundColor: palette.bgElevated,
        }}
      >
        <Text style={{ color: current ? palette.text : palette.textFaint, fontSize: 14 }}>
          {current?.label ?? placeholder}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <Pressable style={[selStyles.backdrop, { backgroundColor: palette.overlay }]} onPress={close}>
          {/* Stop taps inside the sheet from bubbling to the backdrop. */}
          <Pressable
            style={[selStyles.sheet, { backgroundColor: palette.bgElevated }]}
            onPress={() => {}}
          >
            {showSearch && (
              <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search…"
                  placeholderTextColor={palette.textFaint}
                  autoCorrect={false}
                  style={{
                    borderWidth: 1,
                    borderColor: palette.borderStrong,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 9,
                    fontSize: 14,
                    color: palette.text,
                    backgroundColor: palette.bg,
                  }}
                />
              </View>
            )}
            <ScrollView keyboardShouldPersistTaps="handled">
              {visible.map((o) => {
                const selected = value === o.value;
                return (
                  <Pressable
                    key={o.value}
                    style={[selStyles.opt, { borderBottomColor: palette.border }]}
                    onPress={() => {
                      tapFeedback();
                      onChange(o.value);
                      close();
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        color: palette.text,
                        fontSize: 14,
                        fontWeight: selected ? "700" : "400",
                      }}
                    >
                      {o.label}
                    </Text>
                    {selected && (
                      <Text style={{ color: palette.primary600, fontWeight: "700" }}>✓</Text>
                    )}
                  </Pressable>
                );
              })}
              {visible.length === 0 && (
                <Text
                  style={{
                    padding: spacing.xl,
                    textAlign: "center",
                    color: palette.textMuted,
                    fontSize: 13,
                  }}
                >
                  No matches
                </Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const selStyles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "60%",
    paddingVertical: spacing.md,
  },
  opt: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

/* ------------------------------------------------------------------- Switch */

export function Switch({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <RNSwitch
      value={value}
      disabled={disabled}
      onValueChange={(v) => {
        tapFeedback();
        onValueChange(v);
      }}
      trackColor={{ false: palette.borderStrong, true: palette.primary500 }}
      thumbColor={
        Platform.OS === "android"
          ? value
            ? palette.primary600
            : palette.bgElevated
          : undefined
      }
      ios_backgroundColor={palette.borderStrong}
      style={{ opacity: disabled ? 0.5 : 1 }}
    />
  );
}

/* -------------------------------------------------------------- SearchField */

export function SearchField({
  value,
  onChangeText,
  placeholder = "Search",
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          borderWidth: 1,
          borderColor: palette.borderStrong,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          backgroundColor: palette.bgElevated,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 14 }}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textFaint}
        autoCorrect={false}
        autoCapitalize="none"
        style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: palette.text }}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            tapFeedback();
            onChangeText("");
          }}
          hitSlop={8}
        >
          <Text style={{ color: palette.textMuted, fontSize: 14 }}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}
