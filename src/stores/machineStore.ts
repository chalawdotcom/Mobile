import { create } from 'zustand'
import type {
  AlertRow,
  InterventionRow,
  MachineStateRow,
  StopEventRow,
} from '@/types'
import type { MachineStateKey } from '@/design/theme'

const ALERT_LIMIT = 50
const INTERVENTION_LIMIT = 100

interface MachineStoreState {
  state: MachineStateKey
  cadencePpm: number
  lastPulseAt: string | null
  activeStop: StopEventRow | null
  alerts: AlertRow[]
  interventions: InterventionRow[]
  realtimeConnected: boolean

  /* Realtime intake */
  applyMachineState: (row: MachineStateRow) => void
  applyStopEvent: (row: StopEventRow) => void
  applyAlert: (row: AlertRow) => void
  applyIntervention: (row: InterventionRow) => void
  setRealtimeConnected: (connected: boolean) => void

  /* UI actions */
  acknowledgeAlertLocal: (id: number, by: string) => void
  hydrateAlerts: (rows: AlertRow[]) => void
  hydrateActiveStop: (row: StopEventRow | null) => void
  hydrateInterventions: (rows: InterventionRow[]) => void
}

export const useMachineStore = create<MachineStoreState>()((set) => ({
  state: 'unknown',
  cadencePpm: 0,
  lastPulseAt: null,
  activeStop: null,
  alerts: [],
  interventions: [],
  realtimeConnected: false,

  applyMachineState: (row) =>
    set({
      state: row.state,
      cadencePpm: row.cadence_ppm,
      lastPulseAt: row.ts,
    }),

  applyStopEvent: (row) =>
    set((s) => {
      // Open stop = no ts_end yet. A closed/updated stop with the same id clears it.
      if (row.is_deleted) {
        return { activeStop: s.activeStop?.id === row.id ? null : s.activeStop }
      }
      if (row.ts_end === null) {
        return { activeStop: row }
      }
      return { activeStop: s.activeStop?.id === row.id ? null : s.activeStop }
    }),

  applyAlert: (row) =>
    set((s) => {
      const without = s.alerts.filter((a) => a.id !== row.id)
      return { alerts: [row, ...without].slice(0, ALERT_LIMIT) }
    }),

  applyIntervention: (row) =>
    set((s) => {
      if (row.is_deleted) {
        return { interventions: s.interventions.filter((item) => item.id !== row.id) }
      }
      const without = s.interventions.filter((item) => item.id !== row.id)
      return {
        interventions: sortInterventions([row, ...without]).slice(0, INTERVENTION_LIMIT),
      }
    }),

  setRealtimeConnected: (connected) => set({ realtimeConnected: connected }),

  acknowledgeAlertLocal: (id, by) =>
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id
          ? { ...a, acknowledged: true, acknowledged_by: by, acknowledged_at: new Date().toISOString() }
          : a,
      ),
    })),

  hydrateAlerts: (rows) => set({ alerts: rows.slice(0, ALERT_LIMIT) }),
  hydrateActiveStop: (row) => set({ activeStop: row }),
  hydrateInterventions: (rows) =>
    set({ interventions: sortInterventions(rows).slice(0, INTERVENTION_LIMIT) }),
}))

function sortInterventions(rows: InterventionRow[]): InterventionRow[] {
  return [...rows].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  )
}
