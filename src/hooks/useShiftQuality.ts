import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type ShiftLabel = 'matin' | 'apremidi'

export interface ShiftQualityRow {
  id: number
  date: string
  shift_label: ShiftLabel
  good_count: number
  total_count: number
  entered_by: string | null
  entered_email: string | null
  entered_at: string
  is_deleted: boolean
}

interface UseShiftQualityResult {
  loading: boolean
  current: ShiftQualityRow | null
  error: string | null
}

export function useShiftQuality(date: string, shift: ShiftLabel): UseShiftQualityResult {
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<ShiftQualityRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null
    setLoading(true)

    void (async () => {
      const { data, error: err } = await supabase
        .from('shift_quality')
        .select('*')
        .eq('date', date)
        .eq('shift_label', shift)
        .eq('is_deleted', false)
        .maybeSingle()

      if (cancelled) return
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      setError(null)
      setCurrent((data ?? null) as ShiftQualityRow | null)
      setLoading(false)

      channel = supabase
        .channel(`shift-quality-${date}-${shift}-mobile`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'shift_quality' },
          (payload) => {
            const row = (payload.new ?? payload.old) as ShiftQualityRow | undefined
            if (!row || row.date !== date || row.shift_label !== shift) return
            if (payload.eventType === 'DELETE' || row.is_deleted) {
              setCurrent(null)
              return
            }
            setCurrent(row)
          },
        )
        .subscribe()
    })()

    return () => {
      cancelled = true
      if (channel) void supabase.removeChannel(channel)
    }
  }, [date, shift])

  return { loading, current, error }
}
