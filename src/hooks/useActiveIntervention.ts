import { useMemo } from 'react'
import { useMachineStore } from '@/stores/machineStore'
import type { InterventionRow } from '@/types'

export function useActiveIntervention(stopEventId?: number | null): InterventionRow | null {
  const activeStopId = useMachineStore((s) => s.activeStop?.id ?? null)
  const interventions = useMachineStore((s) => s.interventions)
  const targetStopEventId = stopEventId ?? activeStopId

  return useMemo(() => {
    if (targetStopEventId == null) return null
    return interventions.find((item) => item.stop_event_id === targetStopEventId) ?? null
  }, [interventions, targetStopEventId])
}
