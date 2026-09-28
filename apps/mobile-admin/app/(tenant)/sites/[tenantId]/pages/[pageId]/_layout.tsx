import { Pressable } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useLanguage } from "../../../../../../lib/languageContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../../../lib/themeContext";
import { PageEditProvider } from "../../../../../../lib/pageEditContext";

// Wraps the meta editor (index) and the block editor screens (blocks,
// blocks/[blockId]) for one page into a single Stack segment, same pattern
// as sites/[tenantId]/_layout.tsx one level up. PageEditProvider holds the
// full Page + blocks in memory across these nested screens so the block
// detail screen doesn't need to refetch the whole page.
export default function PageEditStackLayout() {
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const { palette } = useTheme();
  const { t } = useLanguage();

  return (
    <PageEditProvider pageId={pageId}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.header },
          headerTintColor: palette.white,
          headerTitleStyle: { fontWeight: "800" },
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: t("screen.page"),
            // First screen of this inner Stack gets no automatic back button;
            // the outer header that used to provide one is now hidden.
            headerLeft: () => (
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Back to pages"
                style={{ paddingRight: 16 }}
              >
                <Ionicons name="arrow-back" size={24} color={palette.white} />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen name="blocks" options={{ title: t("screen.blocks") }} />
        <Stack.Screen name="blocks/[blockId]" options={{ title: t("screen.editBlock") }} />
      </Stack>
    </PageEditProvider>
  );
}
