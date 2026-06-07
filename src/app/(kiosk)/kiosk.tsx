import { useRouter } from "expo-router";
import {
    AlertTriangle,
    CheckCircle2,
    LogOut,
    Timer,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ConnectionBadge from "@/components/ConnectionBadge";
import MachineStatusCard from "@/components/MachineStatusCard";
import StopCausePicker from "@/components/StopCausePicker";
import { useAuth } from "@/contexts/AuthContext";
import type { StopCategory } from "@/design/theme";
import { useStopTimer } from "@/hooks/useStopTimer";
import { supabase } from "@/lib/supabase";
import { useMachineStore } from "@/stores/machineStore";

export default function KioskScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [causeSaved, setCauseSaved] = useState(false);

  const activeStop = useMachineStore((s) => s.activeStop);
  const { formatted, phase } = useStopTimer(activeStop?.ts_start);

  const showPicker = useMemo(() => {
    if (!activeStop) return false;
    if (activeStop.ts_end != null) return false;
    if (activeStop.cause_category === "urgence") return false;
    if (activeStop.cause_label) return false;
    return true;
  }, [activeStop]);

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

  async function handleSubmitCause(category: StopCategory, label: string) {
    if (!activeStop || !user) return;
    setCauseSaved(false);
    const { data, error } = await supabase
      .from("stop_events")
      .update({
        cause_category: category,
        cause_label: label,
        entered_by: user.id,
      })
      .eq("id", activeStop.id)
      .select("*")
      .maybeSingle();

    if (error) {
      Alert.alert("Erreur", error.message);
      throw error;
    }

    if (data) {
      useMachineStore.getState().applyStopEvent(data);
    }
    setCauseSaved(true);
  }

  const timerColor =
    phase === "critical"
      ? "#e11d48"
      : phase === "warning"
        ? "#f59e0b"
        : "#10b981";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Kiosk</Text>
            <Text style={styles.subtitle}>Saisie de cause d'arrêt</Text>
          </View>
          <ConnectionBadge />
        </View>

        <MachineStatusCard />

        {!activeStop || activeStop.ts_end != null ? (
          <View style={styles.noStopCard}>
            <Text style={styles.noStopTitle}>Aucun arrêt en cours</Text>
            <Text style={styles.noStopText}>
              La machine est en marche ou déjà relancée.
            </Text>
          </View>
        ) : (
          <View style={styles.stopCard}>
            <View style={styles.stopTop}>
              <View style={styles.timerRow}>
                <Timer size={18} color={timerColor} />
                <Text style={[styles.timerText, { color: timerColor }]}>
                  {formatted}
                </Text>
              </View>
              <Text style={styles.stopHint}>Durée de l'arrêt (live)</Text>
            </View>

            {activeStop.cause_category === "urgence" ? (
              <View style={styles.noticeRow}>
                <AlertTriangle size={18} color="#e11d48" />
                <Text style={styles.noticeText}>
                  Arrêt d'urgence : cause renseignée automatiquement.
                </Text>
              </View>
            ) : activeStop.cause_label ? (
              <View style={styles.noticeRow}>
                <CheckCircle2 size={18} color="#10b981" />
                <Text style={styles.noticeText}>
                  Cause enregistrée : {activeStop.cause_label}
                </Text>
              </View>
            ) : null}

            {showPicker && (
              <View style={styles.pickerContainer}>
                <StopCausePicker
                  onSubmit={handleSubmitCause}
                  recentForUserId={user?.id ?? null}
                />
              </View>
            )}

            {causeSaved && (
              <View style={styles.savedRow}>
                <CheckCircle2 size={18} color="#10b981" />
                <Text style={styles.savedText}>Cause enregistrée.</Text>
              </View>
            )}
          </View>
        )}

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
              <View style={styles.signOutRow}>
                <LogOut size={16} color="#ffffff" />
                <Text style={styles.signOutText}>Se déconnecter</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f1f5f9" },
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: "#1e293b", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#64748b", fontSize: 13, marginTop: 4 },
  noStopCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 14,
    gap: 4,
  },
  noStopTitle: { color: "#1e293b", fontSize: 14, fontWeight: "700" },
  noStopText: { color: "#64748b", fontSize: 12, fontWeight: "500" },
  stopCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 14,
    gap: 12,
  },
  stopTop: { gap: 2 },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timerText: { fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  stopHint: { color: "#94a3b8", fontSize: 12, fontWeight: "500" },
  noticeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  noticeText: { color: "#334155", fontSize: 13, fontWeight: "600", flex: 1 },
  pickerContainer: { flex: 1, minHeight: 0 },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  savedText: { color: "#10b981", fontSize: 13, fontWeight: "700" },
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
