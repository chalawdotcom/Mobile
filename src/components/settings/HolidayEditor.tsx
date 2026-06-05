import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useHolidays } from "@/hooks/useHolidays";
import { supabase } from "@/lib/supabase";

function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export function HolidayEditor() {
  const { user } = useAuth();
  const { loading, holidays, error } = useHolidays();
  const [day, setDay] = useState("");
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleAdd() {
    if (!day || adding) return;
    setAdding(true);
    setFeedback(null);
    try {
      const { error: err } = await supabase.from("holidays").insert({
        day,
        reason: reason.trim() || null,
        created_by: user?.id ?? null,
      });
      if (err) {
        const friendly =
          err.code === "23505"
            ? "Ce jour est déjà déclaré férié."
            : err.message;
        setFeedback(`Erreur : ${friendly}`);
        return;
      }
      setFeedback("Jour férié ajouté.");
      setDay("");
      setReason("");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setFeedback(null);
    try {
      const { error: err } = await supabase
        .from("holidays")
        .update({ is_deleted: true })
        .eq("id", id);
      if (err) {
        setFeedback(`Erreur : ${err.message}`);
        return;
      }
      setFeedback("Jour férié retiré.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Jours fériés</Text>
      <Text style={styles.cardDesc}>Jours non travaillés exclus du calcul du TRS.</Text>

      <View style={styles.addRow}>
        <TextInput
          style={styles.dateInput}
          value={day}
          onChangeText={setDay}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#475569"
          autoCorrect={false}
        />
        <TextInput
          style={styles.reasonInput}
          value={reason}
          onChangeText={setReason}
          placeholder="Motif (facultatif)"
          placeholderTextColor="#475569"
          maxLength={120}
        />
        <Pressable
          accessibilityRole="button"
          onPress={handleAdd}
          disabled={!day || adding}
          style={({ pressed }) => [
            styles.addBtn,
            pressed && styles.addBtnPressed,
            (!day || adding) && styles.addBtnDisabled,
          ]}
        >
          {adding ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.addBtnText}>Ajouter</Text>
          )}
        </Pressable>
      </View>

      {feedback ? (
        <Text
          style={
            feedback.startsWith("Erreur") ? styles.errorText : styles.successText
          }
        >
          {feedback}
        </Text>
      ) : null}

      {loading ? (
        <ActivityIndicator size="small" color="#3b5bff" style={{ marginTop: 8 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : holidays.length === 0 ? (
        <Text style={styles.emptyText}>Aucun jour férié déclaré.</Text>
      ) : (
        <View style={styles.list}>
          {holidays.map((h) => (
            <View key={h.id} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemDay}>{formatDay(h.day)}</Text>
                {h.reason ? (
                  <Text style={styles.listItemReason} numberOfLines={1}>
                    {h.reason}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Retirer le jour férié du ${formatDay(h.day)}`}
                onPress={() => void handleDelete(h.id)}
                disabled={deletingId === h.id}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  pressed && styles.deleteBtnPressed,
                ]}
              >
                {deletingId === h.id ? (
                  <ActivityIndicator size="small" color="#fb7185" />
                ) : (
                  <Text style={styles.deleteBtnText}>Supprimer</Text>
                )}
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    gap: 10,
  },
  cardTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "700" },
  cardDesc: { color: "#94a3b8", fontSize: 12 },
  addRow: { gap: 8 },
  dateInput: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#f8fafc",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reasonInput: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#f8fafc",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addBtn: {
    height: 38,
    borderRadius: 8,
    backgroundColor: "#3b5bff",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnPressed: { opacity: 0.9 },
  addBtnDisabled: { backgroundColor: "#1e293b" },
  addBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  errorText: { color: "#fb7185", fontSize: 12 },
  successText: { color: "#34d399", fontSize: 12 },
  emptyText: { color: "#64748b", fontSize: 13, textAlign: "center", paddingVertical: 16 },
  list: { gap: 8 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  listItemContent: { flex: 1, gap: 2 },
  listItemDay: { color: "#f8fafc", fontSize: 14, fontWeight: "600" },
  listItemReason: { color: "#94a3b8", fontSize: 11 },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  deleteBtnPressed: { opacity: 0.8 },
  deleteBtnText: { color: "#fb7185", fontSize: 12, fontWeight: "600" },
});
