import ConnectionBadge from "@/components/ConnectionBadge";
import { useStopEvents } from "@/hooks/useStopEvents";
import { useMachineStore } from "@/stores/machineStore";
import type { StopEventRow } from "@/types";
import { RotateCcw } from "lucide-react-native";
import { useMemo } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDateTime(ts: string): string {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${min}`;
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function computeDuration(row: StopEventRow): number | null {
  if (row.duration_s != null) return row.duration_s;
  if (!row.ts_end) return null;
  const start = new Date(row.ts_start).getTime();
  const end = new Date(row.ts_end).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.max(0, Math.floor((end - start) / 1000));
}

export default function HistoriqueScreen() {
  const activeStop = useMachineStore((s) => s.activeStop);
  const { rows, loading, error, refresh } = useStopEvents(100);

  const items = useMemo(() => rows, [rows]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Historique</Text>
            <Text style={styles.subtitle}>Arrêts récents (stop events)</Text>
          </View>
          <View style={styles.headerRight}>
            <ConnectionBadge />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Actualiser"
              onPress={refresh}
              style={({ pressed }) => [
                styles.refreshBtn,
                pressed && styles.refreshBtnPressed,
              ]}
            >
              <RotateCcw size={16} color="#64748b" />
              <Text style={styles.refreshText}>Actualiser</Text>
            </Pressable>
          </View>
        </View>

        {activeStop && activeStop.ts_end == null && (
          <View style={styles.activeStopCard}>
            <Text style={styles.activeStopTitle}>Arrêt en cours</Text>
            <Text style={styles.activeStopLine}>
              Début : {formatDateTime(activeStop.ts_start)}
            </Text>
            <Text style={styles.activeStopLine}>
              Cause : {activeStop.cause_label ?? "—"}
            </Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#3b5bff" />
            <Text style={styles.loadingText}>Chargement…</Text>
          </View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.list}>
          {items.map((row) => {
            const duration = computeDuration(row);
            const isOpen = row.ts_end == null;
            return (
              <View
                key={String(row.id)}
                style={[styles.item, isOpen && styles.itemOpen]}
              >
                <View style={styles.itemTop}>
                  <Text style={styles.itemTitle}>
                    {formatDateTime(row.ts_start)}
                  </Text>
                  <Text
                    style={[
                      styles.itemBadge,
                      isOpen ? styles.badgeOpen : styles.badgeClosed,
                    ]}
                  >
                    {isOpen ? "EN COURS" : "CLOS"}
                  </Text>
                </View>
                <Text style={styles.itemLine}>
                  Durée : {isOpen ? "—" : formatDuration(duration)}
                </Text>
                <Text style={styles.itemLine}>
                  Catégorie : {row.cause_category ?? "—"}
                </Text>
                <Text style={styles.itemLine} numberOfLines={2}>
                  Cause : {row.cause_label ?? "—"}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f1f5f9" },
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  content: { padding: 16, paddingBottom: 24 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  headerRight: { alignItems: "flex-end", gap: 10 },
  title: { color: "#1e293b", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#64748b", fontSize: 13, marginTop: 4 },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  refreshBtnPressed: { opacity: 0.8 },
  refreshText: { color: "#64748b", fontSize: 12, fontWeight: "600" },
  activeStopCard: {
    backgroundColor: "rgba(225, 29, 72, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.18)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  activeStopTitle: {
    color: "#e11d48",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  activeStopLine: { color: "#1e293b", fontSize: 13, fontWeight: "500" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  loadingText: { color: "#94a3b8", fontSize: 13 },
  errorText: { color: "#dc2626", fontSize: 13, marginBottom: 10 },
  list: { gap: 10 },
  item: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 12,
    gap: 4,
  },
  itemOpen: {
    borderColor: "rgba(245, 158, 11, 0.2)",
    backgroundColor: "rgba(245, 158, 11, 0.04)",
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  itemTitle: { color: "#1e293b", fontSize: 14, fontWeight: "700" },
  itemBadge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  badgeOpen: {
    color: "#d97706",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
  badgeClosed: {
    color: "#64748b",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
  },
  itemLine: { color: "#475569", fontSize: 13, fontWeight: "500" },
});
