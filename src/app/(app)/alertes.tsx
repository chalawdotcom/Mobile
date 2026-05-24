import AlertItem from "@/components/AlertItem";
import ConnectionBadge from "@/components/ConnectionBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useMachineStore } from "@/stores/machineStore";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AlertesScreen() {
  const { user, role } = useAuth();
  const alerts = useMachineStore((s) => s.alerts);
  const [ackingId, setAckingId] = useState<number | null>(null);

  const canAcknowledge = role === "admin_maintenance";

  const items = useMemo(() => {
    // Ensure newest-first; store already keeps it that way.
    return alerts;
  }, [alerts]);

  async function handleAcknowledge(id: number) {
    if (!canAcknowledge || !user) return;
    if (ackingId != null) return;
    setAckingId(id);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("alerts")
        .update({
          acknowledged: true,
          acknowledged_by: user.id,
          acknowledged_at: now,
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        useMachineStore.getState().applyAlert(data);
      } else {
        useMachineStore.getState().acknowledgeAlertLocal(id, user.id);
      }
    } catch (err: any) {
      Alert.alert("Erreur", err?.message ?? "Impossible d'acquitter l'alerte.");
    } finally {
      setAckingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Alertes</Text>
            <Text style={styles.subtitle}>
              Dernières alertes de la ligne EE233
            </Text>
          </View>
          <ConnectionBadge />
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <AlertItem
              alert={item}
              showAcknowledge={canAcknowledge}
              onAcknowledge={handleAcknowledge}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune alerte.</Text>
            </View>
          }
        />

        {ackingId != null && (
          <View style={styles.ackingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#3b5bff" />
            <Text style={styles.ackingText}>Acquittement…</Text>
          </View>
        )}

        {!canAcknowledge && (
          <View style={styles.hintRow}>
            <Text style={styles.hintText}>
              Seuls les comptes maintenance peuvent acquitter.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#090d16" },
  container: {
    flex: 1,
    backgroundColor: "#090d16",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: "#f8fafc", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#94a3b8", fontSize: 13, marginTop: 4 },
  listContent: { gap: 10, paddingBottom: 20 },
  empty: { paddingVertical: 24, alignItems: "center" },
  emptyText: { color: "#64748b", fontSize: 14, fontWeight: "500" },
  ackingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9, 13, 22, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ackingText: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
  hintRow: {
    paddingTop: 10,
    alignItems: "center",
  },
  hintText: { color: "#64748b", fontSize: 12 },
});
