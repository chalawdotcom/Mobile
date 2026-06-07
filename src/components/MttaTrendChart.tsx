import { useKpiDaily } from "@/hooks/useKpiDaily";
import { StyleSheet, Text, View } from "react-native";

const LOW_SAMPLE_THRESHOLD = 2;

interface MttaTrendChartProps {
  days?: number;
}

function formatDdMm(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return d && m ? `${d}/${m}` : dateStr;
}

export default function MttaTrendChart({ days = 30 }: MttaTrendChartProps) {
  const { rows, loading } = useKpiDaily(days);

  const data = rows.map((r) => {
    const sampleN = r.mtta_sample_n ?? 0;
    return {
      date: formatDdMm(r.date),
      mttaMin: r.mtta_s == null ? null : r.mtta_s / 60,
      sampleN,
      lowSample: sampleN > 0 && sampleN < LOW_SAMPLE_THRESHOLD,
    };
  });

  const hasAnySample = data.some((d) => d.sampleN > 0);
  const maxMtta = Math.max(...data.filter((d) => d.mttaMin != null).map((d) => d.mttaMin!), 1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Tendance MTTA</Text>
          <Text style={styles.headerTitle}>
            Délai d'intervention — {days} derniers jours
          </Text>
        </View>
        <Text style={styles.legend}>
          ○ moins de {LOW_SAMPLE_THRESHOLD} interventions
        </Text>
      </View>

      <View style={styles.chartContainer}>
        {loading ? (
          <Text style={styles.emptyText}>Chargement…</Text>
        ) : !hasAnySample ? (
          <Text style={styles.emptyText}>
            Aucune intervention démarrée sur la période.
          </Text>
        ) : (
          <View style={styles.chart}>
            <View style={styles.barsContainer}>
              {data.map((d, i) => {
                const height =
                  d.mttaMin != null
                    ? Math.max(4, (d.mttaMin / maxMtta) * 100)
                    : 0;
                return (
                  <View key={i} style={styles.barWrapper}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${height}%`,
                            backgroundColor: d.lowSample
                              ? "transparent"
                              : "#3b5bff",
                            borderWidth: d.lowSample ? 1.5 : 0,
                            borderColor: d.lowSample ? "#3b5bff" : "transparent",
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {d.date}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.yAxis}>
              <Text style={styles.yLabel}>{maxMtta.toFixed(0)} min</Text>
              <Text style={styles.yLabel}>{(maxMtta / 2).toFixed(0)} min</Text>
              <Text style={styles.yLabel}>0 min</Text>
            </View>
          </View>
        )}
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
    padding: 14,
    gap: 10,
  },
  header: { gap: 4 },
  headerLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  headerTitle: { color: "#94a3b8", fontSize: 12 },
  legend: { color: "#94a3b8", fontSize: 10 },
  chartContainer: { minHeight: 140 },
  emptyText: { color: "#94a3b8", fontSize: 13, textAlign: "center", paddingVertical: 24 },
  chart: { flexDirection: "row", gap: 4 },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 120,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barTrack: {
    width: "100%",
    height: 100,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 3,
    minHeight: 4,
  },
  barLabel: {
    color: "#94a3b8",
    fontSize: 8,
    transform: [{ rotate: "-45deg" }],
  },
  yAxis: {
    width: 50,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  yLabel: { color: "#94a3b8", fontSize: 9, textAlign: "right" },
});
