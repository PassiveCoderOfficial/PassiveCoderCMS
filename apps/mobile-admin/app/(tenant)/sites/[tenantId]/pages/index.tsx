import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { listPages, type PageListItem as PageListItemType } from "../../../../../lib/queries/pages";
import { PageListItem } from "../../../../../components/PageListItem";
import { EmptyState, LoadingSpinner, Screen } from "../../../../../components/ui";
import { colors } from "../../../../../lib/theme";

export default function PagesListScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const [pages, setPages] = useState<PageListItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const rows = await listPages(tenantId);
      setPages(rows);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner />;

  return (
    <Screen scroll={false}>
      <FlatList
        data={pages}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary600}
          />
        }
        renderItem={({ item }) => <PageListItem tenantId={tenantId} page={item} />}
        ListEmptyComponent={<EmptyState title="No pages yet" subtitle="This site has no pages." />}
      />
    </Screen>
  );
}
