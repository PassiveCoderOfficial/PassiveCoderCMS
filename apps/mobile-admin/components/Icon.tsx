// One icon primitive for the whole app. Screens historically passed emoji
// strings ("🌐", "⚙️") as icons, which render differently per OS and read as
// unpolished. Icon accepts either an Ionicons name or one of those legacy
// emoji and always draws a crisp, theme-tinted vector glyph, so every
// existing `icon="🌐"` call site upgraded without being touched.

import React from "react";
import { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { radius } from "../lib/theme";
import { useTheme } from "../lib/themeContext";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

const EMOJI: Record<string, IconName> = {
  "🌐": "globe-outline",
  "⚙️": "settings-outline",
  "⚙": "settings-outline",
  "💳": "card-outline",
  "🎫": "chatbubbles-outline",
  "🍳": "flame-outline",
  "🧾": "receipt-outline",
  "🏪": "storefront-outline",
  "🏍️": "bicycle-outline",
  "🏍": "bicycle-outline",
  "📅": "calendar-outline",
  "📊": "bar-chart-outline",
  "🔍": "search-outline",
  "⚠️": "alert-circle-outline",
  "⚠": "alert-circle-outline",
  "🔗": "link-outline",
  "📭": "mail-open-outline",
  "📞": "call-outline",
  "💬": "logo-whatsapp",
  "✉️": "mail-outline",
  "✉": "mail-outline",
  "📝": "create-outline",
  "📄": "document-text-outline",
  "🧱": "layers-outline",
  "➕": "add",
  "🏢": "business-outline",
  "🔌": "flash-outline",
  "🛠": "construct-outline",
  "🔑": "key-outline",
  "👤": "person-outline",
  "🚪": "log-out-outline",
  "🌙": "moon-outline",
  "🌍": "language-outline",
  "🔔": "notifications-outline",
  "📦": "cube-outline",
  "🍽️": "restaurant-outline",
  "🪑": "grid-outline",
};

export function resolveIcon(icon: string): IconName {
  if (EMOJI[icon]) return EMOJI[icon];
  if (/^[a-z0-9-]+$/.test(icon)) return icon as IconName;
  return "ellipse-outline";
}

export function Icon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const { palette } = useTheme();
  return <Ionicons name={resolveIcon(name)} size={size} color={color ?? palette.textMuted} />;
}

/** Icon inside a soft tinted square — leading glyph for list rows. */
export function IconTile({
  name,
  tone = "brand",
  size = 36,
}: {
  name: string;
  tone?: "brand" | "danger" | "neutral" | "success";
  size?: number;
}) {
  const { palette } = useTheme();
  const map = {
    brand: [palette.primary50, palette.primary600],
    danger: [palette.red50, palette.red600],
    neutral: [palette.bg, palette.textMuted],
    success: [palette.green50, palette.green600],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md - 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} size={Math.round(size * 0.52)} color={fg} />
    </View>
  );
}

export function Chevron() {
  const { palette } = useTheme();
  return <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />;
}
