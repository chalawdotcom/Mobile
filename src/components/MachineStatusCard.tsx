import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Zap, Pause, AlertTriangle, HelpCircle } from "lucide-react-native";
import { useMachineStore } from "@/stores/machineStore";
import { STATE_LABEL, STATE_COLOR_LIGHT, type MachineStateKey } from "@/design/theme";

const ICON_MAP: Record<MachineStateKey, React.ReactNode> = {
  running: <Zap size={18} color={STATE_COLOR_LIGHT.running} />,
  stopped: <Pause size={18} color={STATE_COLOR_LIGHT.stopped} />,
  emergency: <AlertTriangle size={18} color={STATE_COLOR_LIGHT.emergency} />,
  unknown: <HelpCircle size={18} color={STATE_COLOR_LIGHT.unknown} />,
};

export default function MachineStatusCard() {
  const state = useMachineStore((s) => s.state);
  const cadencePpm = useMachineStore((s) => s.cadencePpm);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state !== "emergency") {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, pulseAnim]);

  const dotColor = STATE_COLOR_LIGHT[state] ?? STATE_COLOR_LIGHT.unknown;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Animated.View style={[styles.dot, { backgroundColor: dotColor, opacity: state === "emergency" ? pulseAnim : 1 }]} />
        {ICON_MAP[state] ?? ICON_MAP.unknown}
        <Text style={styles.state}>{STATE_LABEL[state] ?? STATE_LABEL.unknown}</Text>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.cadence}>{cadencePpm}</Text>
        <Text style={styles.unit}>plaques/min</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 999 },
  state: { color: "#1e293b", fontSize: 15, fontWeight: "700" },
  bottom: { alignItems: "flex-end", gap: 2 },
  cadence: { color: "#1e293b", fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"] },
  unit: { color: "#94a3b8", fontSize: 11 },
});
