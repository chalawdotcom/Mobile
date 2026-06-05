import { useKpiDaily } from "@/hooks/useKpiDaily";
import { StyleSheet, Text, View } from "react-native";

export default function MtbfTile() {
  const { rows } = useKpiDaily(1);
  const mtbf = rows.at(-1)?.mtbf_h ?? null;
  const display = mtbf == null ? "—" : mtbf.toFixed(1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>MTBF</Text>
        <Text style={styles.subtitle}>Temps moyen entre arrêts</Text>
      </View>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{display}</Text>
        <Text style={styles.unit}>
          {mtbf == null ? "Pas de données" : "heures"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 12,
    gap: 8,
    minHeight: 100,
    justifyContent: "space-between",
  },
  header: { gap: 2 },
  label: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  subtitle: { color: "#64748b", fontSize: 11 },
  valueContainer: { gap: 2 },
  value: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  unit: { color: "#64748b", fontSize: 11 },
});
