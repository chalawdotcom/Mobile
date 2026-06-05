import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Holiday } from '@/types'

interface UseHolidaysResult {
  loading: boolean
  holidays: Holiday[]
  error: string | null
}

export function useHolidays(): UseHolidaysResult {
  const [loading, setLoading] = useState(true)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null
    setLoading(true)

    async function reload(): Promise<void> {
      const { data, error: err } = await supabase
        .from('holidays')
        .select('*')
        .eq('is_deleted', false)
        .order('day', { ascending: true })

      if (cancelled) return
      if (err) {
        setError(err.message)
      } else {
        setError(null)
        setHolidays((data ?? []) as Holiday[])
      }
      setLoading(false)
    }

    void (async () => {
      await reload()
      channel = supabase
        .channel('holidays-mobile')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'holidays' },
          () => { void reload() },
        )
        .subscribe()
    })()

    return () => {
      cancelled = true
      if (channel) void supabase.removeChannel(channel)
    }
  }, [])

  return { loading, holidays, error }
}
