// Compact EN/বাংলা toggle for the app's topbar — mounted once on the root
// Stack's screenOptions.headerRight (app/_layout.tsx) so it appears on
// every screen automatically, matching Wali's "keep language switcher on
// top" instruction without touching every individual screen file.

import { Pressable, Text, View } from "react-native";
import { useLanguage } from "../lib/languageContext";
import { useTheme } from "../lib/themeContext";
import { tapFeedback } from "../lib/haptics";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const { palette } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: 999,
        padding: 2,
        marginRight: 4,
      }}
    >
      <Pressable
        onPress={() => { tapFeedback(); setLanguage("en"); }}
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: language === "en" ? "rgba(255,255,255,0.9)" : "transparent",
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "700", color: language === "en" ? palette.primary600 : "#fff" }}>
          {t("language.english")}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => { tapFeedback(); setLanguage("bn"); }}
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: language === "bn" ? "rgba(255,255,255,0.9)" : "transparent",
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "700", color: language === "bn" ? palette.primary600 : "#fff" }}>
          {t("language.bangla")}
        </Text>
      </Pressable>
    </View>
  );
}
