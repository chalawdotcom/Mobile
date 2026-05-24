import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useMachineStore } from '@/stores/machineStore'
import type { InterventionRow, StopEventRow } from '@/types'

export function useInterventions(limit?: number): { items: InterventionRow[]; loading: boolean } {
  const interventions = useMachineStore((s) => s.interventions)
  const [loading, setLoading] = useState(true)
  const [stopEventsById, setStopEventsById] = useState<Map<number, StopEventRow>>(() => new Map())

  const closed = useMemo(() => {
    const rows = [...interventions.filter((i) => !i.is_deleted && i.outcome !== null)].sort((a, b) =>
      new Date(b.ended_at ?? b.started_at).getTime() - new Date(a.ended_at ?? a.started_at).getTime()
    )
    return typeof limit === 'number' ? rows.slice(0, limit) : rows
  }, [interventions, limit])

  const key = useMemo(() =>
    Array.from(new Set(closed.map((r) => r.stop_event_id))).sort((a, b) => a - b).join(','),
    [closed]
  )

  useEffect(() => {
    let cancelled = false
    setLoading(false)
    if (closed.length === 0) { setStopEventsById(new Map()); return () => { cancelled = true } }
    const ids = Array.from(new Set(closed.map((r) => r.stop_event_id)))
    void supabase.from('stop_events').select('*').in('id', ids).then(({ data }) => {
      if (cancelled) return
      const m = new Map<number, StopEventRow>()
      for (const se of (data ?? []) as StopEventRow[]) m.set(se.id, se)
      setStopEventsById(m)
    })
    return () => { cancelled = true }
  }, [key])

  const items = useMemo(() =>
    closed.map((r) => ({ ...r, stop_event: stopEventsById.get(r.stop_event_id) ?? r.stop_event ?? null })),
    [closed, stopEventsById]
  )

  return { items, loading }
}
