export type MachineStateKey = 'running' | 'stopped' | 'emergency' | 'unknown'

export const STATE_LABEL: Record<MachineStateKey, string> = {
  running: 'Marche',
  stopped: 'Arrêt',
  emergency: 'Urgence',
  unknown: 'Inconnu',
}

export const STATE_COLOR_LIGHT: Record<MachineStateKey, string> = {
  running: '#10b981',
  stopped: '#f59e0b',
  emergency: '#e11d48',
  unknown: '#a1a1aa',
}

export const STATE_COLOR_DARK: Record<MachineStateKey, string> = {
  running: '#34d399',
  stopped: '#fbbf24',
  emergency: '#fb7185',
  unknown: '#71717a',
}

/** TRS thresholds — same in both modes (ISA-101 traffic-light meaning). */
export const TRS_THRESHOLD = {
  good: 85,
  warning: 75,
} as const

export function getTrsBandColor(value: number, mode: 'light' | 'dark'): string {
  const palette = mode === 'dark' ? STATE_COLOR_DARK : STATE_COLOR_LIGHT
  if (value >= TRS_THRESHOLD.good) return palette.running
  if (value >= TRS_THRESHOLD.warning) return palette.stopped
  return palette.emergency
}

/** Cadence target for EE233 from architecture.md (plaques/min). */
export const CADENCE_TARGET_PPM = 140

/** Stop categories — must match Supabase `stop_cause_categories.code`. */
export const STOP_CATEGORIES = ['reglage', 'panne', 'qualite', 'urgence'] as const
export type StopCategory = (typeof STOP_CATEGORIES)[number]

export const STOP_CATEGORY_LABEL: Record<StopCategory, string> = {
  reglage: 'Réglage',
  panne: 'Panne',
  qualite: 'Qualité',
  urgence: 'Urgence',
}

export const STOP_CATEGORY_COLOR: Record<StopCategory, string> = {
  reglage: '#3b5bff',
  panne: '#ef4444',
  qualite: '#f59e0b',
  urgence: '#e11d48',
}

/** Picker shows only these three; "urgence" is filled by daemon, never operator. */
export const OPERATOR_PICKER_CATEGORIES = ['reglage', 'panne', 'qualite'] as const satisfies readonly StopCategory[]
