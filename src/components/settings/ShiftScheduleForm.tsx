import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/lib/supabase";
import type { ShiftConfig, ShiftWindow } from "@/types";

const WEEKDAYS = [
  { iso: 1, label: "Lun", full: "Lundi" },
  { iso: 2, label: "Mar", full: "Mardi" },
  { iso: 3, label: "Mer", full: "Mercredi" },
  { iso: 4, label: "Jeu", full: "Jeudi" },
  { iso: 5, label: "Ven", full: "Vendredi" },
  { iso: 6, label: "Sam", full: "Samedi" },
  { iso: 7, label: "Dim", full: "Dimanche" },
];

interface Draft {
  factoryTz: string;
  morning: ShiftWindow;
  afternoon: ShiftWindow;
  lunch: ShiftWindow;
  nightEnabled: boolean;
  night: ShiftWindow;
  workingDays: number[];
}

function toDraft(cfg: ShiftConfig): Draft {
  return {
    factoryTz: cfg.factory_tz,
    morning: { ...cfg.morning },
    afternoon: { ...cfg.afternoon },
    lunch: { ...cfg.lunch_gap },
    nightEnabled: cfg.night != null,
    night: cfg.night ? { ...cfg.night } : { start: "22:00", end: "06:00" },
    workingDays: [...cfg.working_days].sort((a, b) => a - b),
  };
}

function toConfig(draft: Draft, version: number): ShiftConfig {
  return {
    version,
    factory_tz: draft.factoryTz.trim(),
    morning: draft.morning,
    afternoon: draft.afternoon,
    night: draft.nightEnabled ? draft.night : null,
    lunch_gap: draft.lunch,
    working_days: [...draft.workingDays].sort((a, b) => a - b),
  };
}

function inverted(w: ShiftWindow): boolean {
  return w.start >= w.end;
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.timeField}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput
        style={styles.timeInput}
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        placeholderTextColor="#475569"
        autoCorrect={false}
      />
    </View>
  );
}

function WindowFields({
  label,
  win,
  onChange,
}: {
  label: string;
  win: ShiftWindow;
  onChange: (edge: "start" | "end", value: string) => void;
}) {
  return (
    <View style={styles.windowCard}>
      <Text style={styles.windowLabel}>{label}</Text>
      <View style={styles.windowRow}>
        <TimeInput
          label="Début"
          value={win.start}
          onChange={(v) => onChange("start", v)}
        />
        <TimeInput
          label="Fin"
          value={win.end}
          onChange={(v) => onChange("end", v)}
        />
      </View>
    </View>
  );
}

export function ShiftScheduleForm() {
  const { user } = useAuth();
  const { loading, settings, error } = useAppSettings();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setDraft(toDraft(settings.shift_config));
  }, [settings]);

  const validation = useMemo(() => {
    if (!draft) return { ok: false as const, msg: "" };
    if (!draft.factoryTz.trim()) {
      return { ok: false as const, msg: "Le fuseau horaire est obligatoire." };
    }
    if (draft.workingDays.length === 0) {
      return { ok: false as const, msg: "Sélectionnez au moins un jour travaillé." };
    }
    const windows: Array<[string, ShiftWindow]> = [
      ["Matin", draft.morning],
      ["Pause déjeuner", draft.lunch],
      ["Après-midi", draft.afternoon],
    ];
    if (draft.nightEnabled) windows.push(["Poste de nuit", draft.night]);
    for (const [name, w] of windows) {
      if (inverted(w)) {
        return { ok: false as const, msg: `${name} : la fin doit suivre le début.` };
      }
    }
    return { ok: true as const, msg: "" };
  }, [draft]);

  const dirty = useMemo(() => {
    if (!draft || !settings) return false;
    return (
      JSON.stringify(toConfig(draft, settings.shift_config.version)) !==
      JSON.stringify(settings.shift_config)
    );
  }, [draft, settings]);

  function patchWindow(
    key: "morning" | "afternoon" | "lunch" | "night",
    edge: "start" | "end",
    value: string,
  ) {
    setDraft((d) => (d ? { ...d, [key]: { ...d[key], [edge]: value } } : d));
  }

  function toggleDay(iso: number) {
    setDraft((d) => {
      if (!d) return d;
      const has = d.workingDays.includes(iso);
      return {
        ...d,
        workingDays: has
          ? d.workingDays.filter((x) => x !== iso)
          : [...d.workingDays, iso],
      };
    });
  }

  async function handleSubmit() {
    if (!draft || !settings || !validation.ok || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const { error: err } = await supabase
        .from("app_settings")
        .update({
          shift_config: toConfig(draft, settings.shift_config.version),
          updated_by: user?.id ?? null,
          updated_email: user?.email ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (err) {
        setFeedback(`Erreur : ${err.message}`);
        return;
      }
      setFeedback("Horaires enregistrés.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Horaires de production</Text>
      <Text style={styles.cardDesc}>
        Plages de travail, fuseau horaire et jours ouvrés.
      </Text>

      {loading || !draft ? (
        <ActivityIndicator size="small" color="#3b5bff" style={{ marginTop: 12 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Fuseau horaire</Text>
            <TextInput
              style={styles.input}
              value={draft.factoryTz}
              onChangeText={(v) => setDraft((d) => (d ? { ...d, factoryTz: v } : d))}
              placeholder="Africa/Tunis"
              placeholderTextColor="#475569"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.sectionLabel}>Plages de la journée</Text>
          <WindowFields
            label="Matin"
            win={draft.morning}
            onChange={(edge, v) => patchWindow("morning", edge, v)}
          />
          <WindowFields
            label="Pause déjeuner"
            win={draft.lunch}
            onChange={(edge, v) => patchWindow("lunch", edge, v)}
          />
          <WindowFields
            label="Après-midi"
            win={draft.afternoon}
            onChange={(edge, v) => patchWindow("afternoon", edge, v)}
          />

          <View style={styles.nightToggle}>
            <Text style={styles.sectionLabel}>Poste de nuit</Text>
            <Switch
              value={draft.nightEnabled}
              onValueChange={(v) =>
                setDraft((d) => (d ? { ...d, nightEnabled: v } : d))
              }
              trackColor={{ false: "#1e293b", true: "#3b5bff" }}
              thumbColor={draft.nightEnabled ? "#f8fafc" : "#64748b"}
            />
          </View>
          {draft.nightEnabled && (
            <WindowFields
              label="Nuit"
              win={draft.night}
              onChange={(edge, v) => patchWindow("night", edge, v)}
            />
          )}

          <Text style={styles.sectionLabel}>Jours travaillés</Text>
          <View style={styles.daysRow}>
            {WEEKDAYS.map(({ iso, label, full }) => {
              const active = draft.workingDays.includes(iso);
              return (
                <Pressable
                  key={iso}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={full}
                  onPress={() => toggleDay(iso)}
                  style={[
                    styles.dayBtn,
                    active && styles.dayBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      active && styles.dayTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {validation.msg ? (
            <Text style={styles.errorText}>{validation.msg}</Text>
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

          <Pressable
            accessibilityRole="button"
            onPress={handleSubmit}
            disabled={!validation.ok || !dirty || submitting}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.saveBtnPressed,
              (!validation.ok || !dirty || submitting) && styles.saveBtnDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>Enregistrer les horaires</Text>
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
  form: { gap: 12 },
  field: { gap: 4 },
  fieldLabel: { color: "#64748b", fontSize: 12, fontWeight: "600" },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    color: "#1e293b",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  windowCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 10,
    gap: 6,
  },
  windowLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  windowRow: { flexDirection: "row", gap: 8 },
  timeField: { flex: 1, gap: 2 },
  timeLabel: { color: "#94a3b8", fontSize: 10 },
  timeInput: {
    backgroundColor: "#ffffff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    color: "#1e293b",
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontVariant: ["tabular-nums"],
  },
  nightToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dayBtn: {
    width: 42,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  dayBtnActive: {
    backgroundColor: "#3b5bff",
    borderColor: "#3b5bff",
  },
  dayText: { color: "#64748b", fontSize: 12, fontWeight: "600" },
  dayTextActive: { color: "#ffffff" },
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
