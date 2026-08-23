import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  addLeadNote, getLead, listLeadEvents, listStages, updateLeadStage,
  type Lead, type ContactEvent, type CrmStage,
} from "../../../../../lib/queries/leads";
import { Button, Field, Select, TextField } from "../../../../../components/form";
import {
  Avatar, Card, Divider, EmptyState, Screen, SectionHeader, Skeleton, Tag,
} from "../../../../../components/ui";
import { StageBadge } from "../../../../../components/StageBadge";
import { absoluteTime, initials, leadDisplayName, relativeTime, humanize } from "../../../../../lib/format";
import { radius, spacing, type } from "../../../../../lib/theme";
import { useTheme } from "../../../../../lib/themeContext";
import { useToast } from "../../../../../lib/toast";
import { actionFeedback, tapFeedback } from "../../../../../lib/haptics";

/** Strips everything but digits — wa.me needs a bare international number. */
function waNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export default function LeadDetailScreen() {
  const { tenantId, contactId } = useLocalSearchParams<{ tenantId: string; contactId: string }>();
  const { palette } = useTheme();
  const { success, error: toastError } = useToast();

  const [lead, setLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<ContactEvent[]>([]);
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [changingStage, setChangingStage] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId || !contactId) {
      setLoading(false);
      return;
    }
    try {
      const [leadRow, eventRows, stageRows] = await Promise.all([
        getLead(contactId),
        listLeadEvents(contactId),
        listStages(tenantId),
      ]);
      setLead(leadRow);
      setEvents(eventRows);
      setStages(stageRows);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load lead");
    } finally {
      setLoading(false);
    }
  }, [tenantId, contactId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Opens an external URL, telling the user when the device can't handle it
   * (no dialler, WhatsApp not installed, no mail client) rather than failing
   * silently. */
  async function openUrl(url: string, failMessage: string) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        toastError(failMessage);
        return;
      }
      await Linking.openURL(url);
    } catch {
      toastError(failMessage);
    }
  }

  async function onChangeStage(stageId: string) {
    if (!tenantId || !contactId || !lead) return;
    const next = stageId || null;
    const previous = lead.stage_id;
    if (next === previous) return;

    // Optimistic: reflect the new stage immediately, roll back if the write
    // fails. Beats the old full refetch, which made the picker feel laggy.
    setLead({ ...lead, stage_id: next });
    setChangingStage(true);
    try {
      await updateLeadStage(contactId, tenantId, next);
      success("Stage updated");
      // updateLeadStage also writes a timeline entry server-side; pull just
      // the events back so the timeline reflects it.
      listLeadEvents(contactId).then(setEvents).catch(() => {});
    } catch (e) {
      setLead((cur) => (cur ? { ...cur, stage_id: previous } : cur));
      toastError(e instanceof Error ? e.message : "Failed to change stage");
    } finally {
      setChangingStage(false);
    }
  }

  async function onAddNote() {
    if (!tenantId || !contactId || !noteBody.trim()) return;
    const body = noteBody.trim();
    setSavingNote(true);
    try {
      await addLeadNote(contactId, tenantId, body);
      actionFeedback();
      setNoteBody("");
      // Optimistically prepend rather than refetching the whole screen. The
      // id is a local placeholder only — it's replaced on the next real load.
      const optimistic: ContactEvent = {
        id: `local-${Date.now()}`,
        tenant_id: tenantId,
        contact_id: contactId,
        type: "note",
        title: "Note",
        body,
        meta: null,
        actor_user_id: null,
        created_at: new Date().toISOString(),
      };
      setEvents((prev) => [optimistic, ...prev]);
      success("Note added");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to add note");
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Card style={{ gap: spacing.md }}>
          <Skeleton width={56} height={56} radius={28} />
          <Skeleton width="60%" height={18} />
          <Skeleton width="40%" height={12} />
        </Card>
        <Card style={{ gap: spacing.md }}>
          <Skeleton width="50%" height={14} />
          <Skeleton width="80%" height={12} />
          <Skeleton width="70%" height={12} />
        </Card>
      </Screen>
    );
  }

  if (!lead) {
    return (
      <Screen>
        <EmptyState
          title="Lead not found"
          subtitle={loadError ?? "This contact may have been deleted."}
          icon="⚠️"
          action={{
            label: "Retry",
            onPress: () => {
              setLoading(true);
              load();
            },
          }}
        />
      </Screen>
    );
  }

  const currentStage = stages.find((s) => s.id === lead.stage_id) ?? null;
  const stageOptions = [
    { label: "No stage", value: "" },
    ...stages.map((s) => ({ label: s.name, value: s.id })),
  ];

  const phone = typeof lead.phone === "string" ? lead.phone.trim() : "";
  const email = typeof lead.email === "string" ? lead.email.trim() : "";
  const whatsapp = typeof lead.whatsapp === "string" && lead.whatsapp.trim() ? lead.whatsapp.trim() : phone;
  const company = typeof lead.company === "string" ? lead.company : "";

  return (
    <Screen keyboardAvoiding>
      {/* -------------------------------------------------------- Identity */}
      <Card style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl }}>
        <Avatar text={initials(lead)} size={64} />
        <Text style={[type.title, { color: palette.text, textAlign: "center" }]} numberOfLines={2}>
          {leadDisplayName(lead)}
        </Text>
        {company ? (
          <Text style={[type.body, { color: palette.textMuted, textAlign: "center" }]}>{company}</Text>
        ) : null}
        <StageBadge stage={currentStage} />
      </Card>

      {/* -------------------------------------------------------- Contact */}
      {(phone || email || whatsapp) && (
        <>
          <SectionHeader title="Contact" />
          <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
            {phone ? (
              <ActionRow
                icon="📞"
                title={phone}
                subtitle="Call"
                onPress={() => openUrl(`tel:${phone}`, "No phone app available on this device.")}
              />
            ) : null}
            {whatsapp && waNumber(whatsapp) ? (
              <>
                {phone ? <Divider inset /> : null}
                <ActionRow
                  icon="💬"
                  title={whatsapp}
                  subtitle="WhatsApp"
                  onPress={() =>
                    openUrl(`https://wa.me/${waNumber(whatsapp)}`, "Couldn't open WhatsApp.")
                  }
                />
              </>
            ) : null}
            {email ? (
              <>
                {phone || whatsapp ? <Divider inset /> : null}
                <ActionRow
                  icon="✉️"
                  title={email}
                  subtitle="Email"
                  onPress={() => openUrl(`mailto:${email}`, "No mail app available on this device.")}
                />
              </>
            ) : null}
          </Card>
        </>
      )}

      {/* ---------------------------------------------------------- Stage */}
      <SectionHeader title="Stage" />
      <Card>
        <Field label="Move to stage" hint={changingStage ? "Updating…" : undefined}>
          <Select
            value={typeof lead.stage_id === "string" ? lead.stage_id : ""}
            placeholder="Change stage"
            options={stageOptions}
            onChange={onChangeStage}
            searchable
          />
        </Field>
      </Card>

      {/* ------------------------------------------------------- Timeline */}
      <SectionHeader title="Timeline" />
      <Card style={{ gap: 0 }}>
        {events.length === 0 ? (
          <Text style={[type.body, { color: palette.textMuted, paddingVertical: spacing.sm }]}>
            No activity yet.
          </Text>
        ) : (
          events.map((ev, i) => (
            <View key={ev.id}>
              {i > 0 ? <Divider /> : null}
              <View style={{ flexDirection: "row", gap: spacing.md, paddingVertical: spacing.md }}>
                {/* Left rail: dot + connecting line, so entries read as a
                    sequence rather than a flat stack of paragraphs. */}
                <View style={{ width: 12, alignItems: "center" }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      marginTop: 4,
                      backgroundColor: palette.primary600,
                    }}
                  />
                  {i < events.length - 1 ? (
                    <View style={{ flex: 1, width: 2, backgroundColor: palette.border, marginTop: 4 }} />
                  ) : null}
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
                    <Text style={[type.bodyStrong, { color: palette.text, flexShrink: 1 }]}>
                      {ev.title ?? humanize(ev.type)}
                    </Text>
                    <Tag label={humanize(ev.type)} />
                  </View>
                  {ev.body ? (
                    <Text style={[type.body, { color: palette.textMuted }]}>{ev.body}</Text>
                  ) : null}
                  <Text
                    style={[type.caption, { color: palette.textFaint }]}
                    accessibilityLabel={absoluteTime(ev.created_at)}
                  >
                    {relativeTime(ev.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </Card>

      {/* --------------------------------------------------- Note composer */}
      <Card style={{ gap: spacing.md, borderColor: palette.borderStrong }}>
        <Text style={[type.heading, { color: palette.text }]}>Add a note</Text>
        <TextField
          value={noteBody}
          onChangeText={setNoteBody}
          placeholder="Write a note…"
          multiline
          numberOfLines={3}
        />
        <Button
          title="Add note"
          icon="📝"
          onPress={onAddNote}
          loading={savingNote}
          disabled={!noteBody.trim()}
        />
      </Card>
    </Screen>
  );
}

/* --------------------------------------------------------------- ActionRow */

/** A tappable contact channel — dial, WhatsApp, or mail. Kept local rather
 * than reusing components/ui.tsx's Row so the trailing affordance can be the
 * channel's own action glyph. */
function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${subtitle} ${title}`}
      style={({ pressed }) => [
        {
          minHeight: 60,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: radius.md,
          backgroundColor: pressed ? palette.bg : "transparent",
        },
      ]}
    >
      <Text style={{ fontSize: 20, width: 26, textAlign: "center" }}>{icon}</Text>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={[type.bodyStrong, { color: palette.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[type.caption, { color: palette.textMuted }]}>{subtitle}</Text>
      </View>
      <Text style={{ color: palette.primary600, fontSize: 18 }}>›</Text>
    </Pressable>
  );
}
