import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useShiftQuality, type ShiftLabel } from "@/hooks/useShiftQuality";
import { supabase } from "@/lib/supabase";

const ALLOWED_ROLES = ["admin_maintenance", "superviseur"] as const;

const SHIFT_LABEL: Record<ShiftLabel, string> = {
  matin: "Matin",
  apremidi: "Après-midi",
};

function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function defaultShift(): ShiftLabel {
  return new Date().getHours() < 14 ? "matin" : "apremidi";
}

export function ShiftQualityForm() {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [shift, setShift] = useState<ShiftLabel>(defaultShift());
  const [goodCount, setGoodCount] = useState("");
  const [totalCount, setTotalCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { current } = useShiftQuality(date, shift);

  useEffect(() => {
    if (current) {
      setGoodCount(String(current.good_count));
      setTotalCount(String(current.total_count));
    } else {
      setGoodCount("");
      setTotalCount("");
    }
  }, [current]);

  const validation = useMemo(() => {
    const good = Number.parseInt(goodCount, 10);
    const total = Number.parseInt(totalCount, 10);
    if (!goodCount.trim() || !totalCount.trim()) {
      return { ok: false as const, msg: "" };
    }
    if (Number.isNaN(good) || Number.isNaN(total) || good < 0 || total < 0) {
      return { ok: false as const, msg: "Les compteurs doivent être des entiers positifs." };
    }
    if (total < good) {
      return { ok: false as const, msg: "La quantité totale doit être ≥ aux pièces bonnes." };
    }
    return { ok: true as const, msg: "", good, total };
  }, [goodCount, totalCount]);

  const qualityPct =
    validation.ok && validation.total > 0
      ? (validation.good / validation.total) * 100
      : null;

  if (!role || !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return null;
  }

  async function handleSubmit() {
    if (!validation.ok || submitting) return;
    setSubmitting(true);
    setFeedback(null);

    const payload = {
      date,
      shift_label: shift,
      good_count: validation.good,
      total_count: validation.total,
      entered_by: user?.id ?? null,
      entered_email: user?.email ?? null,
    };

    try {
      const { error } = current
        ? await supabase.from("shift_quality").update(payload).eq("id", current.id)
        : await supabase.from("shift_quality").insert(payload);
      if (error) {
        setFeedback(`Erreur : ${error.message}`);
        return;
      }
      setFeedback(current ? "Qualité mise à jour." : "Qualité enregistrée.");
      setTimeout(() => setOpen(false), 800);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.triggerBtn,
          pressed && styles.triggerBtnPressed,
        ]}
      >
        <Text style={styles.triggerText}>Saisie qualité</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Saisie qualité — fin de poste</Text>
            <Text style={styles.modalDesc}>
              Renseigner les pièces bonnes et la quantité totale pour calculer
              la composante Qualité du TRS.
            </Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#475569"
              />

              <View style={styles.shiftRow}>
                {(["matin", "apremidi"] as const).map((value) => {
                  const active = shift === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      onPress={() => setShift(value)}
                      style={[
                        styles.shiftBtn,
                        active && styles.shiftBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.shiftText,
                          active && styles.shiftTextActive,
                        ]}
                      >
                        {SHIFT_LABEL[value]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                style={styles.input}
                value={goodCount}
                onChangeText={setGoodCount}
                keyboardType="numeric"
                placeholder="Pièces bonnes"
                placeholderTextColor="#475569"
              />

              <TextInput
                style={styles.input}
                value={totalCount}
                onChangeText={setTotalCount}
                keyboardType="numeric"
                placeholder="Quantité totale produite"
                placeholderTextColor="#475569"
              />

              {validation.msg ? (
                <Text style={styles.errorText}>{validation.msg}</Text>
              ) : null}

              <View style={styles.qualityPreview}>
                <Text style={styles.qualityLabel}>Qualité calculée</Text>
                <Text style={styles.qualityValue}>
                  {qualityPct == null
                    ? "—"
                    : `${qualityPct.toFixed(1).replace(".", ",")} %`}
                </Text>
              </View>

              {current ? (
                <Text style={styles.hintText}>
                  Une saisie existe déjà pour ce poste ({current.good_count}/
                  {current.total_count}). La soumission remplacera ces valeurs.
                </Text>
              ) : null}

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

              <View style={styles.modalActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setOpen(false)}
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    pressed && styles.cancelBtnPressed,
                  ]}
                >
                  <Text style={styles.cancelText}>Annuler</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleSubmit}
                  disabled={!validation.ok || submitting}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    pressed && styles.submitBtnPressed,
                    (!validation.ok || submitting) && styles.submitBtnDisabled,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.submitText}>
                      {current ? "Mettre à jour" : "Enregistrer"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(59, 91, 255, 0.4)",
    backgroundColor: "rgba(59, 91, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  triggerBtnPressed: { opacity: 0.9 },
  triggerText: { color: "#3b5bff", fontSize: 13, fontWeight: "700" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
    maxHeight: "85%",
  },
  modalTitle: { color: "#f8fafc", fontSize: 17, fontWeight: "700" },
  modalDesc: { color: "#94a3b8", fontSize: 13 },
  form: { gap: 10 },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#f8fafc",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  shiftRow: { flexDirection: "row", gap: 8 },
  shiftBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  shiftBtnActive: { backgroundColor: "#3b5bff", borderColor: "#3b5bff" },
  shiftText: { color: "#94a3b8", fontSize: 13, fontWeight: "600" },
  shiftTextActive: { color: "#ffffff" },
  qualityPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  qualityLabel: { color: "#64748b", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  qualityValue: { color: "#f8fafc", fontSize: 20, fontWeight: "700", fontVariant: ["tabular-nums"] },
  errorText: { color: "#fb7185", fontSize: 12 },
  successText: { color: "#34d399", fontSize: 12 },
  hintText: { color: "#64748b", fontSize: 11 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnPressed: { opacity: 0.85 },
  cancelText: { color: "#94a3b8", fontSize: 13, fontWeight: "600" },
  submitBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#3b5bff",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnPressed: { opacity: 0.9 },
  submitBtnDisabled: { backgroundColor: "#1e293b" },
  submitText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
});
