import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { STOP_CATEGORY_LABEL, type StopCategory } from "@/design/theme";
import { useStopCauses } from "@/hooks/useStopCauses";
import { supabase } from "@/lib/supabase";

const BUDGETED_CATEGORIES: readonly StopCategory[] = ["reglage", "qualite", "panne"];

function toMinutes(seconds: number | null): string {
  return seconds == null ? "" : String(Math.round(seconds / 60));
}

function minutesValid(raw: string): boolean {
  if (!raw.trim()) return true;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0;
}

export function CauseBudgetEditor() {
  const { loading, causes, error } = useStopCauses();
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (causes.length === 0) return;
    const map: Record<number, string> = {};
    for (const c of causes) map[c.id] = toMinutes(c.expected_duration_s);
    setDraft(map);
    setSaved(map);
  }, [causes]);

  const allValid = useMemo(() => Object.values(draft).every(minutesValid), [draft]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  );

  const grouped = useMemo(
    () =>
      BUDGETED_CATEGORIES.map((cat) => ({
        category: cat,
        items: causes.filter((c) => c.category_code === cat),
      })).filter((g) => g.items.length > 0),
    [causes],
  );

  async function handleSave() {
    if (!allValid || !dirty || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const changed = Object.keys(draft)
        .map(Number)
        .filter((id) => draft[id] !== saved[id]);

      const results = await Promise.all(
        changed.map((id) => {
          const raw = draft[id].trim();
          const expected_duration_s = raw ? Number(raw) * 60 : null;
          return supabase
            .from("stop_causes")
            .update({ expected_duration_s })
            .eq("id", id);
        }),
      );

      const failed = results.find((r) => r.error);
      if (failed?.error) {
        setFeedback(`Erreur : ${failed.error.message}`);
        return;
      }
      setSaved(draft);
      setFeedback("Budgets enregistrés.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Budgets de temps par cause</Text>
      <Text style={styles.cardDesc}>
        Durée allouée par cause, en minutes. Champ vide = aucune limite.
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color="#3b5bff" style={{ marginTop: 8 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.form}>
          {grouped.map(({ category, items }) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryLabel}>
                {STOP_CATEGORY_LABEL[category]}
              </Text>
              {items.map((c) => {
                const raw = draft[c.id] ?? "";
                const invalid = !minutesValid(raw);
                return (
                  <View key={c.id} style={styles.budgetRow}>
                    <Text style={styles.budgetLabel} numberOfLines={1}>
                      {c.label_fr}
                    </Text>
                    <View style={styles.budgetInput}>
                      <TextInput
                        style={[styles.input, invalid && styles.inputError]}
                        value={raw}
                        onChangeText={(v) =>
                          setDraft((d) => ({ ...d, [c.id]: v }))
                        }
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor="#475569"
                      />
                      <Text style={styles.unit}>min</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          {!allValid && (
            <Text style={styles.errorText}>
              Les budgets doivent être des entiers positifs (ou vides).
            </Text>
          )}

          {feedback ? (
            <Text
              style={
                feedback.startsWith("Erreur")
                  ? styles.errorText
                  : styles.successText
              }
            >
              {feedback}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            disabled={!allValid || !dirty || submitting}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.saveBtnPressed,
              (!allValid || !dirty || submitting) && styles.saveBtnDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>Enregistrer les budgets</Text>
            )}
          </Pressable>
        </View>
      )}
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
  cardTitle: { color: "#1e293b", fontSize: 15, fontWeight: "700" },
  cardDesc: { color: "#64748b", fontSize: 12 },
  form: { gap: 14 },
  categorySection: { gap: 6 },
  categoryLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  budgetLabel: { flex: 1, color: "#1e293b", fontSize: 13 },
  budgetInput: { flexDirection: "row", alignItems: "center", gap: 4 },
  input: {
    width: 60,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    color: "#1e293b",
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  inputError: { borderColor: "#dc2626" },
  unit: { color: "#94a3b8", fontSize: 11, width: 28 },
  errorText: { color: "#dc2626", fontSize: 12 },
  successText: { color: "#10b981", fontSize: 12 },
  saveBtn: {
    height: 42,
    borderRadius: 10,
    backgroundColor: "#3b5bff",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnPressed: { opacity: 0.9 },
  saveBtnDisabled: { backgroundColor: "#94a3b8" },
  saveBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
});
