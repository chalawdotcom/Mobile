import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useMachineStore } from '@/stores/machineStore'

export default function ConnectionBadge() {
  const connected = useMachineStore((s) => s.realtimeConnected)

  const dotColor = connected ? '#10b981' : '#e11d48'
  const label = connected ? 'Connecté' : 'Hors ligne'
  const textColor = connected ? '#10b981' : '#e11d48'

  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
})
