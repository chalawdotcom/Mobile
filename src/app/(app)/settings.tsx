import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ConnectionBadge from "@/components/ConnectionBadge";
import { ShiftScheduleForm } from "@/components/settings/ShiftScheduleForm";
import { HolidayEditor } from "@/components/settings/HolidayEditor";
import { CauseBudgetEditor } from "@/components/settings/CauseBudgetEditor";
import { ShiftQualityForm } from "@/components/ShiftQualityForm";

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Paramètres</Text>
            <Text style={styles.subtitle}>
              Configuration des horaires, jours fériés, budgets de temps.
            </Text>
          </View>
          <ConnectionBadge />
        </View>

        <ShiftScheduleForm />
        <HolidayEditor />
        <CauseBudgetEditor />
        <ShiftQualityForm />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f1f5f9" },
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  content: { padding: 16, paddingBottom: 28, gap: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: "#1e293b", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#64748b", fontSize: 13, marginTop: 4 },
});
