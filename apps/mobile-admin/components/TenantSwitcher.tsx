// In-header quick tenant switch — tap the site name in any tenant screen's
// title bar to jump straight to another site, no backing out to the Sites
// tab. Single-membership users never see the chevron (nothing to switch
// to); the underlying switch logic (setSelectedTenantId + persistence) was
// already built in lib/tenant.tsx and used from Profile — this just makes
// it reachable from the header everywhere instead of one screen deep.

import { useState } from "react";
import { Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useRole } from "../lib/role";
import { useSelectedTenant } from "../lib/tenant";
import { publicUrl } from "../lib/siteUrls";
import { Row } from "./ui";
import { spacing, type, radius } from "../lib/theme";
import { useTheme } from "../lib/themeContext";
import { useToast } from "../lib/toast";
import { tapFeedback } from "../lib/haptics";

/** Drop-in replacement for a Stack screen's plain text title — shown as
 *  `headerTitle: () => <TenantHeaderTitle title="Pages" siteName={tenant?.name} />`.
 *  Keeps the screen's own title on top (so "Pages"/"Leads"/"Settings" never
 *  gets lost while deep in a screen) and shows the site name as a small,
 *  tappable second line — tap it to switch sites without losing where you
 *  are. Falls back to a single-line title (no site row, no tap) when
 *  there's only one site to be on, or the site name isn't known yet. */
export function TenantHeaderTitle({ title, siteName }: { title: string; siteName?: string }) {
  const { memberships } = useRole();
  const [open, setOpen] = useState(false);

  if (memberships.length <= 1 || !siteName) {
    return <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>{title}</Text>;
  }

  return (
    <>
      <View>
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }} numberOfLines={1}>{title}</Text>
        <Pressable
          onPress={() => { tapFeedback(); setOpen(true); }}
          style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: -1 }}
          hitSlop={8}
        >
          <Text style={{ color: "#fff", fontSize: 12, opacity: 0.85 }} numberOfLines={1}>{siteName}</Text>
          <Text style={{ color: "#fff", fontSize: 10, opacity: 0.85 }}>▾</Text>
        </Pressable>
      </View>
      <TenantSwitcherSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function TenantSwitcherSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { palette } = useTheme();
  const { memberships } = useRole();
  const { selectedTenantId, setSelectedTenantId } = useSelectedTenant();
  const { success } = useToast();

  function switchTo(tenantId: string, name: string) {
    if (tenantId !== selectedTenantId) {
      setSelectedTenantId(tenantId);
      success(`Switched to ${name}`);
      // Land on that site's dashboard rather than leaving whatever
      // tenant-scoped screen (pages/leads/settings/...) is currently open —
      // the old route's [tenantId] param would now point at the wrong site.
      router.replace("/(tenant)/dashboard");
    }
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: palette.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: palette.bgElevated }]} onPress={() => {}}>
          <Text style={[type.heading, { color: palette.text, marginBottom: spacing.sm }]}>Switch site</Text>
          <View style={{ gap: 2 }}>
            {memberships.map((m) => (
              <Row
                key={m.tenantId}
                title={m.tenant.name}
                subtitle={m.tenant.slug}
                right={
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                    <Pressable
                      onPress={() => { tapFeedback(); Linking.openURL(publicUrl(m.tenant)); }}
                      hitSlop={10}
                    >
                      <Text style={{ color: palette.textFaint, fontSize: 15 }}>↗</Text>
                    </Pressable>
                    {m.tenantId === selectedTenantId && <Text style={{ color: palette.primary600, fontSize: 16 }}>✓</Text>}
                  </View>
                }
                onPress={() => switchTo(m.tenantId, m.tenant.name)}
              />
            ))}
          </View>
          <Row
            title="All sites"
            subtitle="Browse the full list"
            onPress={() => { onClose(); router.push("/(tenant)/sites"); }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "70%",
    padding: spacing.lg,
  },
});
