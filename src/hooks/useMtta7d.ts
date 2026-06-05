import { useMemo } from 'react'
import { useKpiDaily } from '@/hooks/useKpiDaily'

export interface Mtta7dResult {
  loading: boolean
  mttaSeconds: number | null
  sampleN: number
  eligibleN: number
}

export function useMtta7d(): Mtta7dResult {
  const { loading, rows } = useKpiDaily(7)

  return useMemo(() => {
    let numerator = 0
    let sampleN = 0
    let eligibleN = 0

    for (const row of rows) {
      if (typeof row.mtta_eligible_n === 'number') {
        eligibleN += row.mtta_eligible_n
      }
      if (row.mtta_s == null || row.mtta_sample_n == null || row.mtta_sample_n === 0) {
        continue
      }
      numerator += row.mtta_s * row.mtta_sample_n
      sampleN += row.mtta_sample_n
    }

    const mttaSeconds = sampleN > 0 ? numerator / sampleN : null
    return { loading, mttaSeconds, sampleN, eligibleN }
  }, [loading, rows])
}
