import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface KpiCardProps {
  label: string
  value: string | number | null
  unit?: string
  color?: string
  icon: React.ReactNode
}

export default function KpiCard({
  label,
  value,
  unit,
  color = '#f8fafc',
  icon,
}: KpiCardProps) {
  const displayValue = value != null ? String(value) : '—'

  return (
    <View style={styles.card}>
      {/* Icon top-left */}
      <View style={styles.iconContainer}>{icon}</View>

      {/* Value centered */}
      <Text
        style={[styles.value, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {displayValue}
      </Text>

      {/* Label + unit */}
      <View style={styles.labelRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 100,
    minHeight: 100,
  },
  iconContainer: {
    marginBottom: 8,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  unit: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '400',
  },
})
