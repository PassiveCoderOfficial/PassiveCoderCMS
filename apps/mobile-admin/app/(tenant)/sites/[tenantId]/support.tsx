// Support tickets — list + submit + a real conversation thread (reply,
// see history), mirrors cms's (admin)/dashboard/support/page.tsx exactly,
// including its RLS-owner-reopen-on-reply behavior. This whole feature
// didn't exist on mobile before; the web submit button itself had been
// silently broken by a missing RLS INSERT policy since it shipped — fixed
// alongside this (migration 100), same underlying tables/policies.

import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  getDepartments, getTickets, createTicket, getMessages, sendReply, reopenIfClosed,
  type SupportTicket, type TicketMessage, type SupportDepartment,
} from "../../../../lib/queries/support";
import { Card, EmptyState, Screen, SkeletonList, Badge } from "../../../../components/ui";
import { Button, Field, TextField, Select } from "../../../../components/form";
import { spacing, type } from "../../../../lib/theme";
import { useTheme } from "../../../../lib/themeContext";
import { useToast } from "../../../../lib/toast";
import { useAuth } from "../../../../lib/auth";
import { useLanguage } from "../../../../lib/languageContext";
import type { TranslationKey } from "../../../../lib/locales/en";

export default function SupportScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { user } = useAuth();
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { error: toastError, success } = useToast();

  const PRIORITIES = [
    { label: t("priority.low"), value: "low" },
    { label: t("priority.normal"), value: "normal" },
    { label: t("priority.high"), value: "high" },
    { label: t("priority.urgent"), value: "urgent" },
  ];

  const [departments, setDepartments] = useState<SupportDepartment[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normal");
  const [department, setDepartment] = useState("support");
  const [submitting, setSubmitting] = useState(false);

  const [openTicket, setOpenTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const [depts, tix] = await Promise.all([getDepartments(), getTickets(tenantId)]);
      setDepartments(depts);
      setTickets(tix);
      if (depts.length && !depts.some((d) => d.slug === department)) setDepartment(depts[0].slug);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to load tickets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, toastError]);

  useEffect(() => { load(); }, [load]);

  async function submitTicket() {
    if (!tenantId || !user || !subject.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const ticket = await createTicket(tenantId, user.id, { subject, body, priority, department });
      setTickets((prev) => [ticket, ...prev]);
      setSubject(""); setBody(""); setPriority("normal"); setShowForm(false);
      success("Ticket submitted");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  }

  async function openThread(ticket: SupportTicket) {
    setOpenTicket(ticket);
    setMessagesLoading(true);
    try {
      setMessages(await getMessages(ticket.id));
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to load conversation");
    } finally {
      setMessagesLoading(false);
    }
  }

  async function submitReply() {
    if (!openTicket || !user || !reply.trim()) return;
    setSending(true);
    try {
      await sendReply(openTicket.id, user.id, reply);
      const reopened = await reopenIfClosed(openTicket.id, openTicket.status);
      if (reopened) {
        setOpenTicket((t) => t ? { ...t, status: "open" } : t);
        setTickets((prev) => prev.map((t) => t.id === openTicket.id ? { ...t, status: "open" } : t));
      }
      setReply("");
      setMessages(await getMessages(openTicket.id));
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  const deptLabel = (slug: string) => departments.find((d) => d.slug === slug)?.name ?? slug;

  // ticket.status/priority are free-text DB columns, not TS unions — an
  // unrecognized value falls back to the raw text rather than a lookup
  // that could throw, same reasoning as the web version of this helper.
  const KNOWN_STATUSES = new Set(["open", "in_progress", "resolved", "closed"]);
  const KNOWN_PRIORITIES = new Set(["low", "normal", "high", "urgent"]);
  const statusLabel = (status: string) =>
    KNOWN_STATUSES.has(status) ? t(`ticketStatus.${status}` as TranslationKey) : status.replace("_", " ");
  const priorityLabel = (priority: string) =>
    KNOWN_PRIORITIES.has(priority) ? t(`priority.${priority}` as TranslationKey) : priority;

  if (loading) return <SkeletonList count={4} />;

  if (openTicket) {
    return (
      <Screen keyboardAvoiding>
        <Pressable onPress={() => setOpenTicket(null)} style={{ marginBottom: spacing.md }}>
          <Text style={[type.body, { color: palette.primary600 }]}>← {t("support.backToTickets")}</Text>
        </Pressable>

        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text style={[type.bodyStrong, { color: palette.text, flex: 1 }]}>{openTicket.subject}</Text>
            <Badge label={statusLabel(openTicket.status)} />
          </View>
          <Text style={[type.body, { color: palette.textMuted, marginTop: spacing.xs }]}>{openTicket.body}</Text>
          <Text style={[type.caption, { color: palette.textFaint, marginTop: spacing.sm }]}>
            {deptLabel(openTicket.department)} · {new Date(openTicket.created_at).toLocaleDateString()}
          </Text>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={[type.bodyStrong, { color: palette.text, marginBottom: spacing.sm }]}>{t("support.conversation")}</Text>
          {messagesLoading ? (
            <SkeletonList count={2} />
          ) : messages.length === 0 ? (
            <Text style={[type.caption, { color: palette.textMuted }]}>{t("support.noReplies")}</Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {messages.map((m) => {
                const mine = m.user_id === user?.id;
                return (
                  <View
                    key={m.id}
                    style={{
                      backgroundColor: mine ? palette.primary600 + "1a" : palette.bg,
                      borderRadius: 10, padding: spacing.sm,
                      marginLeft: mine ? spacing.lg : 0, marginRight: mine ? 0 : spacing.lg,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={[type.caption, { color: palette.text, fontWeight: "700" }]}>{mine ? t("support.you") : (m.author_name ?? "Support")}</Text>
                      <Text style={[type.caption, { color: palette.textFaint }]}>{new Date(m.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Text style={[type.body, { color: palette.text, marginTop: 2 }]}>{m.body}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <TextField value={reply} onChangeText={setReply} placeholder={t("support.replyPlaceholder")} multiline numberOfLines={3} />
            <Button title={t("support.sendReply")} onPress={submitReply} loading={sending} disabled={!reply.trim()} />
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        {showForm ? (
          <Card>
            <Field label={t("common.subject")}>
              <TextField value={subject} onChangeText={setSubject} placeholder={t("support.subjectPlaceholder")} autoFocus />
            </Field>
            {departments.length > 1 && (
              <Field label={t("common.department")}>
                <Select value={department} placeholder={t("common.department")} onChange={setDepartment} options={departments.map((d) => ({ label: d.name, value: d.slug }))} />
              </Field>
            )}
            <Field label={t("common.priority")}>
              <Select value={priority} placeholder={t("common.priority")} onChange={setPriority} options={PRIORITIES} />
            </Field>
            <Field label={t("common.message")}>
              <TextField value={body} onChangeText={setBody} placeholder={t("support.messagePlaceholder")} multiline numberOfLines={4} />
            </Field>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
              <Button title={t("common.cancel")} variant="outline" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
              <Button title={t("common.submit")} onPress={submitTicket} loading={submitting} disabled={!subject.trim() || !body.trim()} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <Button title={t("support.newTicket")} icon="➕" variant="outline" onPress={() => setShowForm(true)} />
        )}
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={palette.primary600} colors={[palette.primary600]} />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => openThread(item)}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={[type.bodyStrong, { color: palette.text, flex: 1 }]} numberOfLines={1}>{item.subject}</Text>
                <Badge label={statusLabel(item.status)} />
              </View>
              <Text style={[type.caption, { color: palette.textMuted, marginTop: 2 }]} numberOfLines={2}>{item.body}</Text>
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, alignItems: "center" }}>
                <Text style={[type.caption, { color: item.priority === "urgent" ? palette.red600 : item.priority === "high" ? palette.amber600 : palette.textFaint }]}>
                  {priorityLabel(item.priority)}
                </Text>
                <Text style={[type.caption, { color: palette.textFaint }]}>· {deptLabel(item.department)}</Text>
                <Text style={[type.caption, { color: palette.textFaint }]}>· {new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState title={t("support.noTickets")} subtitle={t("support.noTicketsHint")} icon="🎫" />
        }
      />
    </Screen>
  );
}
