import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { AppSettings } from '@/types'

interface UseAppSettingsResult {
  loading: boolean
  settings: AppSettings | null
  error: string | null
}

export function useAppSettings(): UseAppSettingsResult {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null
    setLoading(true)

    void (async () => {
      const { data, error: err } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      if (cancelled) return
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      setError(null)
      setSettings((data ?? null) as AppSettings | null)
      setLoading(false)

      channel = supabase
        .channel('app-settings-mobile')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_settings' },
          (payload) => {
            const row = payload.new as AppSettings | undefined
            if (row && row.id === 1) setSettings(row)
          },
        )
        .subscribe()
    })()

    return () => {
      cancelled = true
      if (channel) void supabase.removeChannel(channel)
    }
  }, [])

  return { loading, settings, error }
}
