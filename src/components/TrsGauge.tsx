import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import RadialGauge from './RadialGauge'
import { getTrsBandColor } from '@/design/theme'

interface TrsGaugeProps {
  value: number | null
  size?: number
  strokeWidth?: number
}

export default function TrsGauge({ value, size = 120, strokeWidth = 10 }: TrsGaugeProps) {
  if (value == null) {
    return (
      <View style={[styles.nullContainer, { width: size, height: size + 28 }]}>
        <View style={[styles.nullRing, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.nullValue, { fontSize: size * 0.28 }]}>—</Text>
          <Text style={[styles.nullUnit, { fontSize: size * 0.1 }]}>%</Text>
        </View>
        <Text style={styles.label}>TRS</Text>
      </View>
    )
  }

  const color = getTrsBandColor(value, 'light')

  return (
    <RadialGauge
      value={value}
      maxValue={100}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      label="TRS"
      unit="%"
    />
  )
}

const styles = StyleSheet.create({
  nullContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  nullRing: {
    borderWidth: 10,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nullValue: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  nullUnit: {
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: -2,
  },
  label: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
})
