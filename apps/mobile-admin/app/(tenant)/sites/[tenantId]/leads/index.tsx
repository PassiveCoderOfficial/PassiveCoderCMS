import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { listLeads, listStages, type LeadListItem as LeadListItemType, type CrmStage } from "../../../../../lib/queries/leads";
import { LeadListItem } from "../../../../../components/LeadListItem";
import { EmptyState, LoadingSpinner, Screen } from "../../../../../components/ui";
import { colors } from "../../../../../lib/theme";

export default function LeadsListScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const [leads, setLeads] = useState<LeadListItemType[]>([]);
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [leadRows, stageRows] = await Promise.all([listLeads(tenantId), listStages(tenantId)]);
      setLeads(leadRows);
      setStages(stageRows);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner />;

  const stageById = new Map(stages.map((s) => [s.id, s]));

  return (
    <Screen scroll={false}>
      <FlatList
        data={leads}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary600}
          />
        }
        renderItem={({ item }) => (
          <LeadListItem tenantId={tenantId} lead={item} stage={item.stage_id ? stageById.get(item.stage_id) : null} />
        )}
        ListEmptyComponent={<EmptyState title="No leads yet" subtitle="This site has no leads." />}
      />
    </Screen>
  );
}
