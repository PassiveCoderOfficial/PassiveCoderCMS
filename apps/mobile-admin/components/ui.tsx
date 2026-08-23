// Shared layout/display primitives. Every component reads the live palette
// via useTheme() so the whole app follows the light/dark preference — never
// import the static `colors` here.

import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radius, shadow, spacing, type } from "../lib/theme";
import type { Palette } from "../lib/theme";
import { useTheme } from "../lib/themeContext";
import { tapFeedback } from "../lib/haptics";

/* ------------------------------------------------------------------ Screen */

export function Screen({
  children,
  scroll = true,
  keyboardAvoiding = true,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  /** Wrap in a KeyboardAvoidingView so form fields aren't hidden. */
  keyboardAvoiding?: boolean;
  /** Pull-to-refresh, wired into the internal ScrollView (scroll screens only). */
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { palette } = useTheme();

  // scroll={false} screens host their own FlatList, which brings its own
  // scrolling + RefreshControl — leave them as a plain flex View.
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, gap: 14, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary600}
            colors={[palette.primary600]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1 }}>{children}</View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }} edges={["bottom"]}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: palette.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: palette.border,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ----------------------------------------------------------------- Divider */

export function Divider({ inset = false }: { inset?: boolean }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: palette.border,
        marginLeft: inset ? spacing.lg : 0,
      }}
    />
  );
}

/* ----------------------------------------------------------- SectionHeader */

export function SectionHeader({ title, style }: { title: string; style?: ViewStyle }) {
  const { palette } = useTheme();
  return (
    <Text
      style={[
        {
          ...type.label,
          color: palette.textFaint,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginTop: spacing.xs,
        },
        style as never,
      ]}
    >
      {title}
    </Text>
  );
}

/* --------------------------------------------------------------------- Row */

export function Row({
  icon,
  leading,
  title,
  subtitle,
  right,
  onPress,
  danger = false,
}: {
  /** Emoji rendered as the leading glyph. */
  icon?: string;
  /** Arbitrary leading node (e.g. an Avatar). Takes precedence over `icon`. */
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { palette } = useTheme();
  const titleColor = danger ? palette.red600 : palette.text;

  const content = (
    <>
      {leading ?? (icon ? <Text style={rowStyles.icon}>{icon}</Text> : null)}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyStrong, { color: titleColor }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[type.caption, { color: palette.textMuted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </>
  );

  if (!onPress) {
    return <View style={rowStyles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        rowStyles.row,
        pressed && { backgroundColor: palette.bg, opacity: 0.85 },
      ]}
    >
      {content}
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  icon: { fontSize: 20, width: 26, textAlign: "center" },
});

/* -------------------------------------------------------------- EmptyState */

export function EmptyState({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  /** Emoji rendered large above the title. */
  icon?: string;
  action?: { label: string; onPress: () => void };
}) {
  const { palette } = useTheme();
  return (
    <View style={emptyStyles.wrap}>
      {icon ? <Text style={emptyStyles.icon}>{icon}</Text> : null}
      <Text style={[type.heading, { color: palette.text, textAlign: "center" }]}>{title}</Text>
      {subtitle ? (
        <Text style={[type.body, { color: palette.textMuted, textAlign: "center" }]}>
          {subtitle}
        </Text>
      ) : null}
      {action ? (
        <Pressable
          onPress={() => {
            tapFeedback();
            action.onPress();
          }}
          style={({ pressed }) => [
            emptyStyles.action,
            { backgroundColor: palette.primary600, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Text style={[type.bodyStrong, { color: palette.onPrimary }]}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    paddingVertical: 56,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  icon: { fontSize: 40, marginBottom: spacing.xs },
  action: {
    marginTop: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
});

/* ---------------------------------------------------------- LoadingSpinner */

export function LoadingSpinner() {
  const { palette } = useTheme();
  return (
    <View style={{ paddingVertical: 48, alignItems: "center" }}>
      <ActivityIndicator color={palette.primary600} />
    </View>
  );
}

/* ----------------------------------------------------------------- Skeleton */

export function Skeleton({
  width = "100%",
  height = 14,
  radius: r = radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 550, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: r, backgroundColor: palette.skeleton, opacity: pulse },
        style,
      ]}
    />
  );
}

/** N card-shaped placeholder rows — a list loading state with real geometry. */
export function SkeletonList({ count = 5 }: { count?: number }) {
  const { palette } = useTheme();
  return (
    <View style={{ padding: spacing.lg, gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            backgroundColor: palette.card,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: palette.border,
            padding: spacing.lg,
            gap: spacing.md,
            minHeight: 72,
            justifyContent: "center",
          }}
        >
          <Skeleton width="60%" height={14} />
          <Skeleton width="35%" height={11} />
        </View>
      ))}
    </View>
  );
}

/* -------------------------------------------------------------------- Badge */

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "brand";

function toneColors(palette: Palette, tone: BadgeTone): { bg: string; text: string } {
  switch (tone) {
    case "success":
      return { bg: palette.green50, text: palette.green700 };
    case "warning":
      return { bg: palette.amber50, text: palette.amber700 };
    case "danger":
      return { bg: palette.red50, text: palette.red700 };
    case "neutral":
      return { bg: palette.bg, text: palette.textMuted };
    case "brand":
    default:
      return { bg: palette.primary50, text: palette.primary700 };
  }
}

/** Label → semantic tone. Callers that know the meaning pass `tone` instead. */
const LABEL_TONE: Record<string, BadgeTone> = {
  active: "success",
  published: "success",
  trial: "warning",
  pending: "warning",
  draft: "warning",
  suspended: "danger",
  failed: "danger",
  cancelled: "danger",
  archived: "neutral",
  none: "neutral",
};

/* -------------------------------------------------------------------- Pill */

/** Filter pill — a compact, selectable chip for horizontal filter rows. */
export function Pill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        {
          borderRadius: radius.full,
          paddingHorizontal: 14,
          paddingVertical: 8,
          minHeight: 36,
          justifyContent: "center",
          borderWidth: 1,
          backgroundColor: selected ? palette.primary600 : "transparent",
          borderColor: selected ? palette.primary600 : palette.borderStrong,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: selected ? palette.onPrimary : palette.textMuted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ Avatar */

/** Circular initials avatar — brand-tinted, used for leads and the profile. */
export function Avatar({ text, size = 40 }: { text: string; size?: number }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: palette.primary100,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: palette.primary700,
          fontWeight: "800",
          fontSize: Math.round(size * 0.38),
        }}
      >
        {text}
      </Text>
    </View>
  );
}

/* --------------------------------------------------------------------- Tag */

/** Small neutral text tag — role labels, event types. Quieter than a Badge. */
export function Tag({ label }: { label: string }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: radius.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: palette.bg,
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: "700", color: palette.textMuted, textTransform: "uppercase" }}>
        {label}
      </Text>
    </View>
  );
}

export function Badge({ label, tone }: { label: string; tone?: BadgeTone }) {
  const { palette } = useTheme();
  // Callers often pass humanize() output ("Pending dns"), so normalise back
  // to the raw key shape before looking up a tone — otherwise every
  // humanised label silently falls through to the brand colour.
  const key = label.trim().toLowerCase().replace(/\s+/g, "_");
  const resolved = tone ?? LABEL_TONE[key] ?? "brand";
  const meta = toneColors(palette, resolved);
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: radius.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: meta.bg,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "700", textTransform: "capitalize", color: meta.text }}>
        {label}
      </Text>
    </View>
  );
}
