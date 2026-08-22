import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  addLeadNote, getLead, listLeadEvents, listStages, updateLeadStage,
  type Lead, type ContactEvent, type CrmStage,
} from "../../../../../lib/queries/leads";
import { Button, ErrorText, Select, TextField } from "../../../../../components/form";
import { Card, LoadingSpinner, Screen } from "../../../../../components/ui";
import { StageBadge } from "../../../../../components/StageBadge";
import { colors } from "../../../../../lib/theme";

export default function LeadDetailScreen() {
  const { tenantId, contactId } = useLocalSearchParams<{ tenantId: string; contactId: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<ContactEvent[]>([]);
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteBody, setNoteBody] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [changingStage, setChangingStage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId || !contactId) return;
    try {
      const [leadRow, eventRows, stageRows] = await Promise.all([
        getLead(contactId),
        listLeadEvents(contactId),
        listStages(tenantId),
      ]);
      setLead(leadRow);
      setEvents(eventRows);
      setStages(stageRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load lead");
    } finally {
      setLoading(false);
    }
  }, [tenantId, contactId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onChangeStage(stageId: string) {
    if (!tenantId || !contactId) return;
    setChangingStage(true);
    setError(null);
    try {
      await updateLeadStage(contactId, tenantId, stageId || null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to change stage");
    } finally {
      setChangingStage(false);
    }
  }

  async function onAddNote() {
    if (!tenantId || !contactId || !noteBody.trim()) return;
    setSavingNote(true);
    setError(null);
    try {
      await addLeadNote(contactId, tenantId, noteBody.trim());
      setNoteBody("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add note");
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!lead) {
    return (
      <Screen>
        <ErrorText>{error ?? "Lead not found"}</ErrorText>
      </Screen>
    );
  }

  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || "Unnamed lead";
  const currentStage = stages.find((s) => s.id === lead.stage_id) ?? null;
  const stageOptions = [
    { label: "No stage", value: "" },
    ...stages.map((s) => ({ label: s.name, value: s.id })),
  ];

  return (
    <Screen>
      <Card style={{ gap: 8 }}>
        <Text style={styles.name}>{name}</Text>
        {!!lead.company && <Text style={styles.detail}>{lead.company as string}</Text>}
        {!!lead.email && <Text style={styles.detail}>{lead.email as string}</Text>}
        {!!lead.phone && <Text style={styles.detail}>{lead.phone as string}</Text>}
        <View style={{ marginTop: 6, gap: 6 }}>
          <Text style={styles.label}>Stage</Text>
          <StageBadge stage={currentStage} />
          <Select
            value={lead.stage_id ?? ""}
            placeholder="Change stage"
            options={stageOptions}
            onChange={onChangeStage}
          />
          {changingStage && <Text style={styles.detail}>Updating…</Text>}
        </View>
      </Card>

      <ErrorText>{error}</ErrorText>

      <Card style={{ gap: 10 }}>
        <Text style={styles.cardTitle}>Timeline</Text>
        {events.length === 0 && <Text style={styles.detail}>No activity yet.</Text>}
        {events.map((ev) => (
          <View key={ev.id} style={styles.eventRow}>
            <Text style={styles.eventTitle}>{ev.title ?? ev.type}</Text>
            {!!ev.body && <Text style={styles.detail}>{ev.body}</Text>}
            <Text style={styles.time}>{new Date(ev.created_at).toLocaleString()}</Text>
          </View>
        ))}
      </Card>

      <Card style={{ gap: 10 }}>
        <Text style={styles.cardTitle}>Add a note</Text>
        <TextField
          value={noteBody}
          onChangeText={setNoteBody}
          placeholder="Write a note…"
          multiline
          numberOfLines={3}
        />
        <Button title="Add note" onPress={onAddNote} loading={savingNote} disabled={!noteBody.trim()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 18, fontWeight: "800", color: colors.text },
  detail: { fontSize: 13, color: colors.textMuted },
  label: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  eventRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, gap: 2 },
  eventTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
  time: { fontSize: 11, color: colors.textFaint },
});
