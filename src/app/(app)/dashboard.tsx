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
            icon={<Activity size={18} color="#10b981" />}
            color="#10b981"
          />
          <KpiCard
            label="MTTR"
            value={today?.mttr_min != null ? Math.round(today.mttr_min) : null}
            unit="min"
            icon={<Wrench size={18} color="#f59e0b" />}
            color="#f59e0b"
          />
          <KpiCard
            label="Arrêts"
            value={today?.nb_stops ?? null}
            unit="/j"
            icon={<Clock size={18} color="#64748b" />}
            color="#1e293b"
          />
          <KpiCard
            label="Alertes"
            value={unackedCount}
            unit="non ack"
            icon={
              <Activity
                size={18}
                color={unackedCount > 0 ? "#e11d48" : "#64748b"}
              />
            }
            color={unackedCount > 0 ? "#e11d48" : "#1e293b"}
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
  safe: { flex: 1, backgroundColor: "#f1f5f9" },
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  content: { padding: 16, paddingBottom: 28, gap: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: "#1e293b", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#64748b", fontSize: 13, marginTop: 4 },
  stopCard: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: 12,
    padding: 12,
  },
  stopTitle: {
    color: "#d97706",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  stopLine: { color: "#1e293b", fontSize: 13, fontWeight: "500" },
  gaugesRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  kpisRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  linkCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 14,
    gap: 4,
  },
  linkCardPressed: { opacity: 0.85 },
  linkTitle: { color: "#1e293b", fontSize: 14, fontWeight: "700" },
  linkSubtitle: { color: "#64748b", fontSize: 12, fontWeight: "500" },
  footer: { marginTop: 4, gap: 10 },
  userText: { color: "#94a3b8", fontSize: 12 },
  signOutBtn: {
    height: 46,
    borderRadius: 10,
    backgroundColor: "#3b5bff",
    alignItems: "center",
    justifyContent: "center",
  },
  signOutBtnPressed: { opacity: 0.9 },
  signOutBtnDisabled: { backgroundColor: "#94a3b8" },
  signOutText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  signOutRow: { flexDirection: "row", alignItems: "center", gap: 10 },
});
