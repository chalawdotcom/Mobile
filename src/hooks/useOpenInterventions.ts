import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useMachineStore } from '@/stores/machineStore'
import type { InterventionRow, StopEventRow } from '@/types'

export interface OpenInterventionsState {
  count: number
  items: InterventionRow[]
  loading: boolean
}

export function useOpenInterventions(): OpenInterventionsState {
  const interventions = useMachineStore((state) => state.interventions)
  const [loading, setLoading] = useState(true)
  const [stopEventsById, setStopEventsById] = useState<Map<number, StopEventRow>>(() => new Map())

  const open = useMemo(
    () => sortOpen(interventions.filter((item) => !item.is_deleted && item.outcome === null)),
    [interventions],
  )

  const stopEventIdsKey = useMemo(() => makeKey(open), [open])

  useEffect(() => {
    let cancelled = false
    setLoading(false)
    if (open.length === 0) {
      setStopEventsById(new Map())
      return () => { cancelled = true }
    }
    void fetchStopEvents(open).then((rows) => {
      if (cancelled) return
      setStopEventsById(indexRows(rows))
    })
    return () => { cancelled = true }
  }, [stopEventIdsKey])

  const items = useMemo(
    () => open.map((row) => ({
      ...row,
      stop_event: stopEventsById.get(row.stop_event_id) ?? row.stop_event ?? null,
    })),
    [open, stopEventsById],
  )

  return { count: items.length, items, loading }
}

async function fetchStopEvents(rows: InterventionRow[]): Promise<InterventionRow[]> {
  if (rows.length === 0) return rows
  const ids = Array.from(new Set(rows.map((r) => r.stop_event_id)))
  const { data } = await supabase.from('stop_events').select('*').in('id', ids)
  const map = new Map<number, StopEventRow>()
  for (const se of (data ?? []) as StopEventRow[]) map.set(se.id, se)
  return rows.map((r) => ({ ...r, stop_event: map.get(r.stop_event_id) ?? r.stop_event ?? null }))
}

function indexRows(rows: InterventionRow[]): Map<number, StopEventRow> {
  const m = new Map<number, StopEventRow>()
  for (const r of rows) if (r.stop_event) m.set(r.stop_event.id, r.stop_event)
  return m
}

function sortOpen(items: InterventionRow[]): InterventionRow[] {
  return [...items].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
}

function makeKey(rows: InterventionRow[]): string {
  return Array.from(new Set(rows.map((r) => r.stop_event_id))).sort((a, b) => a - b).join(',')
}
