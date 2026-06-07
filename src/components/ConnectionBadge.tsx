import { useMachineStore } from "@/stores/machineStore";
import { StyleSheet, Text, View } from "react-native";

export default function ConnectionBadge() {
  const connected = useMachineStore((s) => s.realtimeConnected);

  return (
    <View style={styles.badge}>
      <View
        style={[styles.dot, connected ? styles.dotConnected : styles.dotDisconnected]}
      />
      <Text style={styles.text}>
        {connected ? "Connecté" : "Hors ligne"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  dot: { width: 7, height: 7, borderRadius: 999 },
  dotConnected: { backgroundColor: "#10b981" },
  dotDisconnected: { backgroundColor: "#e11d48" },
  text: { color: "#64748b", fontSize: 11, fontWeight: "600" },
});
