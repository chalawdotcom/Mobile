import React from 'react'
import RadialGauge from './RadialGauge'
import { CADENCE_TARGET_PPM } from '@/design/theme'

interface CadenceGaugeProps {
  value: number
  size?: number
  strokeWidth?: number
}

function getCadenceColor(value: number, target: number): string {
  if (value >= target * 0.9) return '#10b981' // green
  if (value >= target * 0.5) return '#f59e0b' // amber
  return '#e11d48' // red
}

export default function CadenceGauge({ value, size = 120, strokeWidth = 10 }: CadenceGaugeProps) {
  const color = getCadenceColor(value, CADENCE_TARGET_PPM)

  return (
    <RadialGauge
      value={value}
      maxValue={CADENCE_TARGET_PPM}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      label="Cadence"
      unit="pl/min"
    />
  )
}
