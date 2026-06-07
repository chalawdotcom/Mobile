import { useMtta7d } from "@/hooks/useMtta7d";
import { StyleSheet, Text, View } from "react-native";

export function formatMttaHeadline(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes} min ${String(rest).padStart(2, "0")} s`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `${hours} h ${String(remMin).padStart(2, "0")}`;
}

export function formatSampleSubtitle(sampleN: number, eligibleN: number): string {
  if (eligibleN === 0) return "aucune intervention sur 7 jours";
  const word = eligibleN > 1 ? "interventions" : "intervention";
  return `moyenne 7 jours · ${sampleN}/${eligibleN} ${word}`;
}

export default function MttaTile() {
  const { mttaSeconds, sampleN, eligibleN } = useMtta7d();
  const display = formatMttaHeadline(mttaSeconds);
  const subtitle = formatSampleSubtitle(sampleN, eligibleN);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>MTTA</Text>
        <Text style={styles.subtitle}>Délai d'intervention</Text>
      </View>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{display}</Text>
        <Text style={styles.unit}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 12,
    gap: 8,
    minHeight: 100,
    justifyContent: "space-between",
  },
  header: { gap: 2 },
  label: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  subtitle: { color: "#94a3b8", fontSize: 11 },
  valueContainer: { gap: 2 },
  value: {
    color: "#1e293b",
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  unit: { color: "#94a3b8", fontSize: 10 },
});
