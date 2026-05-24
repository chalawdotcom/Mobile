import React, { useCallback } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react-native'
import type { AlertRow, AlertSeverity } from '@/types'

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  critical: '#e11d48',
  high: '#f59e0b',
  quality: '#3b82f6',
  info: '#64748b',
}

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: 'Critique',
  high: 'Haute',
  quality: 'Qualité',
  info: 'Info',
}

const SEVERITY_ICON: Record<AlertSeverity, React.ComponentType<{ size: number; color: string }>> = {
  critical: AlertTriangle,
  high: AlertCircle,
  quality: AlertCircle,
  info: Info,
}

interface AlertItemProps {
  alert: AlertRow
  showAcknowledge?: boolean
  onAcknowledge?: (id: number) => void
}

function formatTime(ts: string): string {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export default function AlertItem({ alert, showAcknowledge = false, onAcknowledge }: AlertItemProps) {
  const color = SEVERITY_COLOR[alert.severity] ?? SEVERITY_COLOR.info
  const severityLabel = SEVERITY_LABEL[alert.severity] ?? 'Info'
  const Icon = SEVERITY_ICON[alert.severity] ?? SEVERITY_ICON.info

  const handleAcknowledge = useCallback(() => {
    onAcknowledge?.(alert.id)
  }, [alert.id, onAcknowledge])

  return (
    <View style={[styles.container, alert.acknowledged && styles.containerAcknowledged]}>
      {/* Left: severity icon + badge */}
      <View style={styles.leftCol}>
        <Icon size={18} color={color} />
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{severityLabel}</Text>
        </View>
      </View>

      {/* Center: message + timestamp */}
      <View style={styles.centerCol}>
        <Text style={styles.messageText} numberOfLines={2}>
          {alert.message}
        </Text>
        <Text style={styles.timestampText}>{formatTime(alert.ts)}</Text>
      </View>

      {/* Right: acknowledge button */}
      {showAcknowledge && !alert.acknowledged && onAcknowledge && (
        <Pressable
          style={({ pressed }) => [
            styles.ackButton,
            pressed && styles.ackButtonPressed,
          ]}
          onPress={handleAcknowledge}
          accessibilityRole="button"
          accessibilityLabel="Acquitter l'alerte"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.ackButtonText}>Acquitter</Text>
        </Pressable>
      )}

      {/* Acknowledged indicator */}
      {alert.acknowledged && (
        <View style={styles.ackIndicator}>
          <Text style={styles.ackIndicatorText}>✓</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  containerAcknowledged: {
    opacity: 0.6,
  },
  leftCol: {
    alignItems: 'center',
    gap: 4,
    minWidth: 52,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  centerCol: {
    flex: 1,
    gap: 2,
  },
  messageText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  timestampText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  ackButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b5bff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ackButtonPressed: {
    backgroundColor: 'rgba(59, 91, 255, 0.2)',
  },
  ackButtonText: {
    color: '#3b5bff',
    fontSize: 12,
    fontWeight: '600',
  },
  ackIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ackIndicatorText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '700',
  },
})
