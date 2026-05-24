import type { MachineStateKey, StopCategory } from '@/design/theme'

export type AlertSource = 'stop' | 'intervention' | 'system'

export type InterventionOutcome = 'repaired' | 'terminated' | 'false_alert'

export type AppRole = 'operatore' | 'admin_maintenance' | 'superviseur'

export interface AuthUser {
  id: string
  email: string
  role: AppRole
}

export type AlertSeverity = 'critical' | 'high' | 'quality' | 'info'

export interface MachineStateRow {
  id: number
  ts: string
  state: MachineStateKey
  cadence_ppm: number
}

export interface StopEventRow {
  id: number
  ts_start: string
  ts_end: string | null
  duration_s: number | null
  cause_category: StopCategory | null
  cause_label: string | null
  entered_by: string | null
  is_deleted: boolean
}

export interface AlertRow {
  id: number
  ts: string
  severity: AlertSeverity
  type: string
  message: string
  acknowledged: boolean
  acknowledged_by: string | null
  acknowledged_at: string | null
  stop_event_id: number | null
  intervention_id: string | null
  source: AlertSource | null
}

export interface InterventionRow {
  id: string
  stop_event_id: number
  stop_event?: StopEventRow | null
  technician_id: string | null
  technician_email: string | null
  started_at: string
  ended_at: string | null
  duration_s: number | null
  cause_reelle: string | null
  action_effectuee: string | null
  parts_replaced: string | null
  outcome: InterventionOutcome | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface MaintenanceDiagnosticRow {
  id: number
  stop_cause_id: number
  cause_possible: string
  solution_recommandee: string
  display_order: number
  is_deleted: boolean
  created_at: string
}

export interface StopCauseCategory {
  code: StopCategory
  label_fr: string
  severity: AlertSeverity | 'planned'
  display_order: number
}

export interface StopCause {
  id: number
  category_code: StopCategory
  label_fr: string
  display_order: number
}

export interface KpiDailyRow {
  date: string
  trs: number
  mtbf_h: number | null
  mttr_min: number | null
  nb_stops: number
  downtime_s: number
  updated_at: string
}
