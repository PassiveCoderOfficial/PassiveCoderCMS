import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  listLeads,
  listStages,
  type LeadListItem as LeadListItemType,
  type CrmStage,
} from "../../../../../lib/queries/leads";
import { LeadListItem } from "../../../../../components/LeadListItem";
import { EmptyState, Pill, Screen, SkeletonList } from "../../../../../components/ui";
import { SearchField } from "../../../../../components/form";
import { spacing } from "../../../../../lib/theme";
import { useTheme } from "../../../../../lib/themeContext";

export default function LeadsListScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const [leads, setLeads] = useState<LeadListItemType[]>([]);
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Previously this screen had a try/finally with no catch, so a failed query
  // silently rendered the "No leads yet" empty state — telling the user they
  // have no leads when the fetch had actually errored. Track the error and
  // render a distinct, retryable failure state instead.
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const [leadRows, stageRows] = await Promise.all([listLeads(tenantId), listStages(tenantId)]);
      setLeads(leadRows);
      setStages(stageRows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const stageById = useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (stageFilter === "none") {
        if (l.stage_id) return false;
      } else if (stageFilter !== "all" && l.stage_id !== stageFilter) {
        return false;
      }
      if (!q) return true;
      return [l.first_name, l.last_name, l.email, l.phone, l.company]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [leads, query, stageFilter]);

  if (loading) return <SkeletonList count={6} />;

  // A load failure is a different situation from "this site genuinely has no
  // leads" — give it its own full-screen state with a retry, not a row in an
  // otherwise-normal list.
  if (error) {
    return (
      <Screen>
        <EmptyState
          title="Couldn't load leads"
          subtitle={error}
          icon="⚠️"
          action={{
            label: "Retry",
            onPress: () => {
              setLoading(true);
              setError(null);
              load();
            },
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md }}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, email, phone…"
        />
        {stages.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}
          >
            <Pill label="All" selected={stageFilter === "all"} onPress={() => setStageFilter("all")} />
            {stages.map((s) => (
              <Pill
                key={s.id}
                label={s.name}
                selected={stageFilter === s.id}
                onPress={() => setStageFilter(s.id)}
              />
            ))}
            <Pill
              label="No stage"
              selected={stageFilter === "none"}
              onPress={() => setStageFilter("none")}
            />
          </ScrollView>
        )}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(l) => l.id}
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
        renderItem={({ item }) => (
          <LeadListItem
            tenantId={tenantId}
            lead={item}
            stage={item.stage_id ? stageById.get(item.stage_id) : null}
          />
        )}
        ListEmptyComponent={
          leads.length === 0 ? (
            <EmptyState
              title="No leads yet"
              subtitle="Enquiries from your site will appear here."
              icon="📭"
            />
          ) : (
            <EmptyState
              title="No matching leads"
              subtitle="Try a different search or stage filter."
              icon="🔍"
            />
          )
        }
      />
    </Screen>
  );
}
