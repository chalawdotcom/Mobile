import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface RadialGaugeProps {
  value: number
  maxValue?: number
  size?: number
  strokeWidth?: number
  color: string
  label: string
  unit?: string
}

export default function RadialGauge({
  value,
  maxValue = 100,
  size = 120,
  strokeWidth = 10,
  color,
  label,
  unit,
}: RadialGaugeProps) {
  const animatedValue = useRef(new Animated.Value(0)).current

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const clamped = Math.max(0, Math.min(value, maxValue))
  const percentage = maxValue > 0 ? clamped / maxValue : 0

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 600,
      useNativeDriver: false,
    }).start()
  }, [percentage, animatedValue])

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  })

  const displayValue = value != null ? Math.round(value) : '—'

  return (
    <View style={[styles.container, { width: size, height: size + 28 }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      <View style={[styles.valueContainer, { width: size, height: size }]}>
        <Animated.Text style={[styles.valueText, { color, fontSize: size * 0.22 }]}>
          {displayValue}
        </Animated.Text>
        {unit ? (
          <Animated.Text style={[styles.unitText, { fontSize: size * 0.1 }]}>
            {unit}
          </Animated.Text>
        ) : null}
      </View>

      <Animated.Text style={styles.labelText} numberOfLines={1}>
        {label}
      </Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  valueContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: -2,
  },
  labelText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
})
