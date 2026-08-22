import { Stack, useLocalSearchParams } from "expo-router";
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

  return (
    <PageEditProvider pageId={pageId}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.primary600 },
          headerTintColor: palette.white,
          headerTitleStyle: { fontWeight: "800" },
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Page" }} />
        <Stack.Screen name="blocks" options={{ title: "Blocks" }} />
        <Stack.Screen name="blocks/[blockId]" options={{ title: "Edit block" }} />
      </Stack>
    </PageEditProvider>
  );
}
