import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { KpiDailyRow } from '@/types'

interface UseKpiDailyResult {
  loading: boolean
  rows: KpiDailyRow[]
  error: string | null
}

export function useKpiDaily(days = 7): UseKpiDailyResult {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<KpiDailyRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null
    setLoading(true)

    function mergeRow(next: KpiDailyRow) {
      setRows((current) => {
        const existing = current.findIndex((r) => r.date === next.date)
        const merged = existing >= 0
          ? current.map((r, i) => (i === existing ? next : r))
          : [...current, next]
        merged.sort((a, b) => a.date.localeCompare(b.date))
        return merged.slice(-days)
      })
    }

    void (async () => {
      const { data, error: err } = await supabase
        .from('kpi_daily')
        .select('*')
        .order('date', { ascending: false })
        .limit(days)

      if (cancelled) return
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      setError(null)
      setRows(((data ?? []) as KpiDailyRow[]).slice().reverse())
      setLoading(false)

      channel = supabase
        .channel(`kpi-daily-${days}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'kpi_daily' },
          (payload) => {
            if (payload.eventType === 'DELETE') return
            mergeRow(payload.new as KpiDailyRow)
          },
        )
        .subscribe()
    })()

    return () => {
      cancelled = true
      if (channel) {
        void supabase.removeChannel(channel)
      }
    }
  }, [days])

  return { loading, rows, error }
}
