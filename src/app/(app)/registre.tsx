import ConnectionBadge from "@/components/ConnectionBadge";
import MtbfTile from "@/components/MtbfTile";
import MttrTile from "@/components/MttrTile";
import MttaTile from "@/components/MttaTile";
import MttaTrendChart from "@/components/MttaTrendChart";
import { useInterventions } from "@/hooks/useInterventions";
import { useOpenInterventions } from "@/hooks/useOpenInterventions";
import type { InterventionRow } from "@/types";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDateTime(ts: string): string {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${min}`;
}

function outcomeLabel(outcome: InterventionRow["outcome"]): string {
  if (outcome === "repaired") return "Réparée";
  if (outcome === "terminated") return "Terminée";
  if (outcome === "false_alert") return "Fausse alerte";
  return "—";
}

export default function RegistreScreen() {
  const open = useOpenInterventions();
  const closed = useInterventions(30);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Registre des pannes</Text>
            <Text style={styles.subtitle}>Triage et historique des interventions</Text>
          </View>
          <ConnectionBadge />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs maintenance</Text>
          <Text style={styles.sectionHint}>
            Suivi journalier : fiabilité (MTBF), réparation (MTTR) et réactivité (MTTA).
          </Text>
          <View style={styles.kpiRow}>
            <MtbfTile />
            <MttrTile />
          </View>
          <View style={styles.kpiRow}>
            <MttaTile />
          </View>
        </View>

        <MttaTrendChart days={30} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>En attente d'intervention</Text>
          <Text style={styles.sectionHint}>{open.count} ouverte(s)</Text>
          {open.items.length === 0 ? (
            <Text style={styles.emptyText}>Aucune intervention en cours.</Text>
          ) : (
            <View style={styles.list}>
              {open.items.map((it) => (
                <View key={it.id} style={styles.item}>
                  <Text style={styles.itemTitle}>
                    Début : {formatDateTime(it.started_at)}
                  </Text>
                  <Text style={styles.itemLine}>
                    Technicien : {it.technician_email ?? "—"}
                  </Text>
                  <Text style={styles.itemLine} numberOfLines={2}>
                    Cause réelle : {it.cause_reelle ?? "—"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interventions terminées</Text>
          <Text style={styles.sectionHint}>Registre chronologique des clôtures maintenance.</Text>
          {closed.items.length === 0 ? (
            <Text style={styles.emptyText}>Aucune intervention clôturée.</Text>
          ) : (
            <View style={styles.list}>
              {closed.items.map((it) => (
                <View key={it.id} style={styles.item}>
                  <View style={styles.itemTop}>
                    <Text style={styles.itemTitle}>
                      Fin : {formatDateTime(it.ended_at ?? it.started_at)}
                    </Text>
                    <Text style={styles.badge}>{outcomeLabel(it.outcome)}</Text>
                  </View>
                  <Text style={styles.itemLine}>
                    Technicien : {it.technician_email ?? "—"}
                  </Text>
                  <Text style={styles.itemLine} numberOfLines={2}>
                    Action : {it.action_effectuee ?? "—"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f1f5f9" },
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  content: { padding: 16, paddingBottom: 24, gap: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: "#1e293b", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#64748b", fontSize: 13, marginTop: 4 },
  section: { gap: 6 },
  sectionTitle: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHint: { color: "#94a3b8", fontSize: 12 },
  kpiRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  emptyText: { color: "#94a3b8", fontSize: 13, marginTop: 4 },
  list: { gap: 10, marginTop: 8 },
  item: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 12,
    gap: 4,
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  itemTitle: { color: "#1e293b", fontSize: 14, fontWeight: "700" },
  badge: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
    overflow: "hidden",
  },
  itemLine: { color: "#475569", fontSize: 13, fontWeight: "500" },
});
