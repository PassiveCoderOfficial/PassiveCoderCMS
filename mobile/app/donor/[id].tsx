import { useCallback, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, radius, availabilityMeta } from "../../lib/theme";
import { AvailabilityChip, BloodBadge, Button, Card, DonorAvatar, Loading } from "../../components/ui";

interface Profile {
  id: string; name: string; phone: string; whatsapp: string;
  blood_group: string; gender: string | null; religion: string | null;
  district: string | null; police_station: string | null; area: string | null;
  age: number | null; last_donated_on: string | null;
  availability: string; is_available: boolean; is_claimed: boolean;
  phone_verified: boolean; socials: Record<string, string>;
}

export default function DonorProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me } = useAuth();
  const [p, setP] = useState<Profile | null>(null);
  const [submittedBy, setSubmittedBy] = useState<{ id: string; name: string } | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await api(`/api/donors/${id}`, "GET");
    if (r.ok) {
      setP(r.data.donor);
      setSubmittedBy(r.data.submitted_by);
      setCanManage(!!r.data.viewer?.can_manage);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loading />;
  if (!p) return <View style={styles.center}><Text style={{ color: colors.textMuted }}>Donor not found.</Text></View>;

  const meta = availabilityMeta[p.availability] ?? availabilityMeta.unknown;
  const wa = p.whatsapp ? `https://wa.me/88${p.whatsapp}` : null;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card style={{ alignItems: "center", gap: 10 }}>
        <View>
          <DonorAvatar photoUrl={null} name={p.name} size={80} />
          <View style={styles.badgeOnAvatar}><Text style={{ color: colors.white, fontWeight: "800", fontSize: 12 }}>{p.blood_group}</Text></View>
        </View>
        <View style={{ alignItems: "center", gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.name}>{p.name}</Text>
            {p.is_claimed && <Ionicons name="shield-checkmark" size={18} color={colors.green600} />}
          </View>
          <View style={{ backgroundColor: meta.bg, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 }}>
            <Text style={{ color: meta.text, fontSize: 12, fontWeight: "700" }}>
              {p.availability === "unavailable" ? "Temporarily unavailable"
                : p.availability === "unknown" ? "Last donation unknown" : meta.label}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button title="Call" icon="call" onPress={() => Linking.openURL(`tel:${p.phone}`)} style={{ width: 120 }} />
          {wa && <Button title="WhatsApp" variant="green" icon="logo-whatsapp" onPress={() => Linking.openURL(wa)} style={{ width: 120 }} />}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>{p.phone}</Text>
          {p.phone_verified && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.green50, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Ionicons name="shield-checkmark" size={11} color={colors.green700} />
              <Text style={{ color: colors.green700, fontSize: 11, fontWeight: "600" }}>Verified</Text>
            </View>
          )}
        </View>

        {p.socials && Object.keys(p.socials).length > 0 && <SocialRow socials={p.socials} />}
      </Card>

      <Card style={{ gap: 8 }}>
        <Row icon="location-outline" text={[p.area, p.police_station, p.district].filter(Boolean).join(", ") || "Location not set"} />
        {p.age != null && <Row icon="calendar-outline" text={`${p.age} years old`} />}
        {(p.gender || p.religion) && <Row icon="person-outline" text={[p.gender, p.religion].filter(Boolean).join(" · ")} />}
        {submittedBy && (
          <Pressable onPress={() => router.push(`/donor/${submittedBy.id}`)}>
            <Row icon="water-outline" text={`Submitted by ${submittedBy.name}`} link />
          </Pressable>
        )}
      </Card>

      {canManage && (
        <Button title="Edit this profile" variant="dark" icon="pencil" onPress={() => router.push(`/donor/edit/${p.id}`)} />
      )}
      {!p.is_claimed && (
        <Button title="This is me — claim this profile" variant="outline" icon="key-outline"
          onPress={() => router.push(`/donor/claim/${p.id}`)} />
      )}
    </ScrollView>
  );
}

function Row({ icon, text, link }: { icon: keyof typeof Ionicons.glyphMap; text: string; link?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Ionicons name={icon} size={16} color={colors.textFaint} />
      <Text style={{ color: link ? colors.red600 : colors.textMuted, fontSize: 14, fontWeight: link ? "600" : "400", flex: 1 }}>{text}</Text>
    </View>
  );
}

const SOCIAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  facebook: "logo-facebook", instagram: "logo-instagram", linkedin: "logo-linkedin",
  youtube: "logo-youtube", tiktok: "logo-tiktok", x: "logo-twitter",
  website: "globe-outline", messenger: "chatbubble-ellipses", thread: "at",
};

function SocialRow({ socials }: { socials: Record<string, string> }) {
  return (
    <View style={{ flexDirection: "row", gap: 14, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, width: "100%", justifyContent: "center" }}>
      {Object.entries(socials).map(([k, url]) => (
        <Pressable key={k} onPress={() => Linking.openURL(url)}>
          <Ionicons name={SOCIAL_ICONS[k] ?? "link"} size={22} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  name: { fontSize: 22, fontWeight: "800", color: colors.text },
  badgeOnAvatar: {
    position: "absolute", bottom: -2, right: -2, width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.red600, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.white,
  },
});
