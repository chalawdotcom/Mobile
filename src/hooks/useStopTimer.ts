import { useEffect, useState } from 'react'

export type TimerPhase = 'fresh' | 'warning' | 'critical'

interface UseStopTimerResult {
  seconds: number
  phase: TimerPhase
  formatted: string
}

const WARNING_S = 5 * 60
const CRITICAL_S = 10 * 60

export function useStopTimer(tsStart: string | null | undefined): UseStopTimerResult {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!tsStart) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [tsStart])

  if (!tsStart) {
    return { seconds: 0, phase: 'fresh', formatted: '00:00' }
  }

  const start = new Date(tsStart).getTime()
  const seconds = Math.max(0, Math.floor((now - start) / 1000))
  const phase: TimerPhase =
    seconds >= CRITICAL_S ? 'critical' : seconds >= WARNING_S ? 'warning' : 'fresh'

  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  return { seconds, phase, formatted }
}
