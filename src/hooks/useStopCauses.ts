import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StopCause } from '@/types'

interface UseStopCausesResult {
  loading: boolean
  causes: StopCause[]
  error: string | null
}

export function useStopCauses(): UseStopCausesResult {
  const [loading, setLoading] = useState(true)
  const [causes, setCauses] = useState<StopCause[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      const { data, error: err } = await supabase
        .from('stop_causes')
        .select('id, category_code, label_fr, display_order')
        .order('display_order', { ascending: true })

      if (cancelled) return
      if (err) {
        setError(err.message)
      } else {
        setCauses((data ?? []) as StopCause[])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { loading, causes, error }
}
