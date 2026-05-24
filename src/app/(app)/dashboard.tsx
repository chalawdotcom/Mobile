import { useRouter } from "expo-router";
import { Activity, Clock, Wrench } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CadenceGauge from "@/components/CadenceGauge";
import ConnectionBadge from "@/components/ConnectionBadge";
import KpiCard from "@/components/KpiCard";
import MachineStatusCard from "@/components/MachineStatusCard";
import TrsGauge from "@/components/TrsGauge";
import { useAuth } from "@/contexts/AuthContext";
import { useKpiDaily } from "@/hooks/useKpiDaily";
import { useMachineStore } from "@/stores/machineStore";

function fmt1(value: number | null | undefined): string | null {
  if (value == null) return null;
  return value.toFixed(1);
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const cadencePpm = useMachineStore((s) => s.cadencePpm);
  const activeStop = useMachineStore((s) => s.activeStop);
  const alerts = useMachineStore((s) => s.alerts);

  const { rows } = useKpiDaily(1);
  const today = rows.at(-1) ?? null;
  const todayTrs = today?.trs ?? null;

  const unackedCount = useMemo(
    () => alerts.filter((a) => !a.acknowledged).length,
    [alerts],
  );

  async function handleSignOut() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await signOut();
      router.replace("/login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Tableau de bord</Text>
            <Text style={styles.subtitle}>EE233 — Encartonneuse</Text>
          </View>
          <ConnectionBadge />
        </View>

        <MachineStatusCard />

        {activeStop && activeStop.ts_end == null && (
          <View style={styles.stopCard}>
            <Text style={styles.stopTitle}>Arrêt en cours</Text>
            <Text style={styles.stopLine} numberOfLines={2}>
              Cause : {activeStop.cause_label ?? "—"}
            </Text>
          </View>
        )}

        <View style={styles.gaugesRow}>
          <CadenceGauge value={cadencePpm} />
          <TrsGauge value={todayTrs} />
        </View>

        <View style={styles.kpisRow}>
          <KpiCard
            label="MTBF"
            value={fmt1(today?.mtbf_h)}
            unit="h"
            icon={<Activity size={18} color="#34d399" />}
            color="#34d399"
          />
          <KpiCard
            label="MTTR"
            value={today?.mttr_min != null ? Math.round(today.mttr_min) : null}
            unit="min"
            icon={<Wrench size={18} color="#fbbf24" />}
            color="#fbbf24"
          />
          <KpiCard
            label="Arrêts"
            value={today?.nb_stops ?? null}
            unit="/j"
            icon={<Clock size={18} color="#94a3b8" />}
            color="#f8fafc"
          />
          <KpiCard
            label="Alertes"
            value={unackedCount}
            unit="non ack"
            icon={
              <Activity
                size={18}
                color={unackedCount > 0 ? "#fb7185" : "#94a3b8"}
              />
            }
            color={unackedCount > 0 ? "#fb7185" : "#f8fafc"}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir toutes les alertes"
          onPress={() => router.push("/alertes")}
          style={({ pressed }) => [
            styles.linkCard,
            pressed && styles.linkCardPressed,
          ]}
        >
          <Text style={styles.linkTitle}>Voir les alertes</Text>
          <Text style={styles.linkSubtitle}>
            Consulter et (maintenance) acquitter
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.userText}>Connecté : {user?.email ?? "—"}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Se déconnecter"
            onPress={handleSignOut}
            disabled={submitting}
            style={({ pressed }) => [
              styles.signOutBtn,
              pressed && styles.signOutBtnPressed,
              submitting && styles.signOutBtnDisabled,
            ]}
          >
            {submitting ? (
              <View style={styles.signOutRow}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.signOutText}>Déconnexion…</Text>
              </View>
            ) : (
              <Text style={styles.signOutText}>Se déconnecter</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#090d16" },
  container: { flex: 1, backgroundColor: "#090d16" },
  content: { padding: 16, paddingBottom: 28, gap: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: "#f8fafc", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#94a3b8", fontSize: 13, marginTop: 4 },
  stopCard: {
    backgroundColor: "rgba(245, 158, 11, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    borderRadius: 12,
    padding: 12,
  },
  stopTitle: {
    color: "#fbbf24",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  stopLine: { color: "#f8fafc", fontSize: 13, fontWeight: "500" },
  gaugesRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  kpisRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  linkCard: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    gap: 4,
  },
  linkCardPressed: { opacity: 0.85 },
  linkTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "700" },
  linkSubtitle: { color: "#94a3b8", fontSize: 12, fontWeight: "500" },
  footer: { marginTop: 4, gap: 10 },
  userText: { color: "#64748b", fontSize: 12 },
  signOutBtn: {
    height: 46,
    borderRadius: 10,
    backgroundColor: "#3b5bff",
    alignItems: "center",
    justifyContent: "center",
  },
  signOutBtnPressed: { opacity: 0.9 },
  signOutBtnDisabled: { backgroundColor: "#1e293b" },
  signOutText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  signOutRow: { flexDirection: "row", alignItems: "center", gap: 10 },
});
