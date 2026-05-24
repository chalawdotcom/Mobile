import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { Activity, StopCircle, AlertTriangle, HelpCircle } from 'lucide-react-native'
import { useMachineStore } from '@/stores/machineStore'
import { STATE_LABEL, STATE_COLOR_LIGHT } from '@/design/theme'
import type { MachineStateKey } from '@/design/theme'

const STATE_ICON: Record<MachineStateKey, React.ComponentType<{ size: number; color: string }>> = {
  running: Activity,
  stopped: StopCircle,
  emergency: AlertTriangle,
  unknown: HelpCircle,
}

export default function MachineStatusCard() {
  const state = useMachineStore((s) => s.state)
  const cadencePpm = useMachineStore((s) => s.cadencePpm)

  const pulseAnim = useRef(new Animated.Value(1)).current

  const color = STATE_COLOR_LIGHT[state] ?? STATE_COLOR_LIGHT.unknown
  const label = STATE_LABEL[state] ?? STATE_LABEL.unknown
  const Icon = STATE_ICON[state] ?? STATE_ICON.unknown

  useEffect(() => {
    if (state === 'emergency') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      )
      animation.start()
      return () => animation.stop()
    } else {
      pulseAnim.setValue(1)
    }
  }, [state, pulseAnim])

  return (
    <Animated.View
      style={[
        styles.card,
        { borderLeftColor: color, opacity: state === 'emergency' ? pulseAnim : 1 },
      ]}
    >
      {/* Header row */}
      <View style={styles.row}>
        {/* Colored dot */}
        <View style={[styles.dot, { backgroundColor: color }]} />

        {/* Icon */}
        <Icon size={22} color={color} />

        {/* State label */}
        <Animated.Text style={[styles.stateLabel, { color }]}>{label}</Animated.Text>
      </View>

      {/* Cadence info */}
      <View style={styles.cadenceRow}>
        <Animated.Text style={styles.cadenceLabel}>Cadence :</Animated.Text>
        <Animated.Text style={[styles.cadenceValue, { color }]}>
          {cadencePpm} <Animated.Text style={styles.cadenceUnit}>pl/min</Animated.Text>
        </Animated.Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stateLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cadenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  cadenceLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  cadenceValue: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cadenceUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748b',
  },
})
