import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useLanguage } from "../../../../../lib/languageContext";
import { Stack, useLocalSearchParams } from "expo-router";
import { listPages, type PageListItem as PageListItemType } from "../../../../../lib/queries/pages";
import { PageListItem } from "../../../../../components/PageListItem";
import { EmptyState, Pill, Screen, SkeletonList } from "../../../../../components/ui";
import { SearchField } from "../../../../../components/form";
import { spacing } from "../../../../../lib/theme";
import { useTheme } from "../../../../../lib/themeContext";
import { useRole } from "../../../../../lib/role";
import { publicUrl } from "../../../../../lib/siteUrls";
import { tapFeedback } from "../../../../../lib/haptics";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

export default function PagesListScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { memberships } = useRole();
  const tenant = memberships.find((m) => m.tenantId === tenantId)?.tenant;
  const [pages, setPages] = useState<PageListItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const rows = await listPages(tenantId);
      setPages(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("pages.loadFailed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pages.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });
  }, [pages, query, status]);

  if (loading) return <SkeletonList count={5} />;

  return (
    <Screen scroll={false}>
      {tenant && (
        <Stack.Screen
          options={{
            headerRight: () => (
              <Pressable
                onPress={() => { tapFeedback(); Linking.openURL(publicUrl(tenant)); }}
                hitSlop={10}
                style={{ padding: 4 }}
              >
                <Text style={{ color: palette.white, fontSize: 13, fontWeight: "700" }}>{t("pages.preview")}</Text>
              </Pressable>
            ),
          }}
        />
      )}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md }}>
        <SearchField value={query} onChangeText={setQuery} placeholder={t("pages.search")} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}
        >
          {STATUS_FILTERS.map((f) => (
            <Pill
              key={f.value}
              label={t(`status.${f.value}` as "status.all")}
              selected={status === f.value}
              onPress={() => setStatus(f.value)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={palette.primary600}
            colors={[palette.primary600]}
          />
        }
        renderItem={({ item }) => <PageListItem tenantId={tenantId} page={item} />}
        ListEmptyComponent={
          error ? (
            <EmptyState
              title={t("pages.cantLoad")}
              subtitle={error}
              icon="⚠️"
              action={{
                label: t("common.retry"),
                onPress: () => {
                  setLoading(true);
                  load();
                },
              }}
            />
          ) : pages.length === 0 ? (
            <EmptyState title={t("pages.none")} subtitle={t("pages.noneHint")} icon="📄" />
          ) : (
            <EmptyState
              title={t("pages.noMatch")}
              subtitle={t("pages.noMatchHint")}
              icon="🔍"
            />
          )
        }
      />
    </Screen>
  );
}
