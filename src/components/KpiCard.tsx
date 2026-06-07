import { StyleSheet, Text, View } from "react-native";

interface KpiCardProps {
  label: string;
  value: string | number | null;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

export default function KpiCard({ label, value, unit, icon, color }: KpiCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.bottom}>
        <Text style={[styles.value, { color }]} numberOfLines={1}>
          {value != null ? String(value) : "—"}
        </Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 12,
    gap: 8,
    minWidth: 0,
    flex: 1,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { color: "#64748b", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  bottom: { gap: 2 },
  value: { fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"] },
  unit: { color: "#94a3b8", fontSize: 11 },
});
