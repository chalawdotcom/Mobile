import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StopCategory } from '@/design/theme'

export interface RecentCause {
  category: StopCategory
  label: string
  count: number
}

interface UseRecentCausesResult {
  loading: boolean
  causes: RecentCause[]
  error: string | null
}

export function useRecentCauses(
  userId: string | null | undefined,
  limit = 3,
  days = 30
): UseRecentCausesResult {
  const [loading, setLoading] = useState(true)
  const [causes, setCauses] = useState<RecentCause[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setCauses([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data, error: err } = await supabase
        .from('stop_events')
        .select('cause_category, cause_label')
        .eq('entered_by', userId)
        .eq('is_deleted', false)
        .gte('ts_start', since)
        .not('cause_label', 'is', null)
        .not('cause_category', 'is', null)
        .neq('cause_category', 'urgence')

      if (cancelled) return

      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      const buckets = new Map<string, RecentCause>()
      for (const r of data ?? []) {
        const cat = r.cause_category as StopCategory | null
        const label = r.cause_label as string | null
        if (!cat || !label) continue
        const key = `${cat}::${label}`
        const existing = buckets.get(key)
        if (existing) {
          existing.count += 1
        } else {
          buckets.set(key, { category: cat, label, count: 1 })
        }
      }

      const ranked = Array.from(buckets.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)

      setError(null)
      setCauses(ranked)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [userId, limit, days])

  return { loading, causes, error }
}
