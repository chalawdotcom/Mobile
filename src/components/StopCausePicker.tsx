import React, { useState, useMemo, useCallback } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useStopCauses } from '@/hooks/useStopCauses'
import { useRecentCauses } from '@/hooks/useRecentCauses'
import {
  OPERATOR_PICKER_CATEGORIES,
  STOP_CATEGORY_LABEL,
  STOP_CATEGORY_COLOR,
} from '@/design/theme'
import type { StopCategory } from '@/design/theme'

interface StopCausePickerProps {
  onSubmit: (category: StopCategory, label: string) => Promise<void>
  recentForUserId: string | null
}

export default function StopCausePicker({ onSubmit, recentForUserId }: StopCausePickerProps) {
  const { causes, loading: loadingCauses } = useStopCauses()
  const { causes: recentCauses } = useRecentCauses(recentForUserId)

  const [selectedCategory, setSelectedCategory] = useState<StopCategory>(
    OPERATOR_PICKER_CATEGORIES[0]
  )
  const [submitting, setSubmitting] = useState(false)

  const filteredCauses = useMemo(
    () => causes.filter((c) => c.category_code === selectedCategory),
    [causes, selectedCategory]
  )

  const handleSubmit = useCallback(
    async (category: StopCategory, label: string) => {
      if (submitting) return
      setSubmitting(true)
      try {
        await onSubmit(category, label)
      } finally {
        setSubmitting(false)
      }
    },
    [onSubmit, submitting]
  )

  return (
    <View style={styles.container}>
      {recentCauses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Causes récentes</Text>
          <View style={styles.recentRow}>
            {recentCauses.slice(0, 3).map((rc) => (
              <Pressable
                key={`${rc.category}::${rc.label}`}
                style={({ pressed }) => [
                  styles.recentButton,
                  {
                    borderColor: STOP_CATEGORY_COLOR[rc.category],
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => handleSubmit(rc.category, rc.label)}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={`${STOP_CATEGORY_LABEL[rc.category]}: ${rc.label}`}
              >
                <Text
                  style={[styles.recentLabel, { color: STOP_CATEGORY_COLOR[rc.category] }]}
                  numberOfLines={1}
                >
                  {rc.label}
                </Text>
                <Text style={styles.recentCategory}>
                  {STOP_CATEGORY_LABEL[rc.category]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.pillRow}>
        {OPERATOR_PICKER_CATEGORIES.map((cat) => {
          const isActive = cat === selectedCategory
          const catColor = STOP_CATEGORY_COLOR[cat]
          return (
            <Pressable
              key={cat}
              style={[
                styles.pill,
                isActive
                  ? { backgroundColor: catColor, borderColor: catColor }
                  : { borderColor: catColor },
              ]}
              onPress={() => setSelectedCategory(cat)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={STOP_CATEGORY_LABEL[cat]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: isActive ? '#ffffff' : catColor },
                ]}
              >
                {STOP_CATEGORY_LABEL[cat]}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {loadingCauses ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b5bff" />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredCauses.length === 0 ? (
            <Text style={styles.emptyText}>Aucune cause dans cette catégorie</Text>
          ) : (
            filteredCauses.map((cause) => (
              <Pressable
                key={cause.id}
                style={({ pressed }) => [
                  styles.causeItem,
                  pressed && styles.causeItemPressed,
                ]}
                onPress={() => handleSubmit(cause.category_code, cause.label_fr)}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={cause.label_fr}
              >
                <Text style={styles.causeLabel}>{cause.label_fr}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      {submitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="large" color="#3b5bff" />
          <Text style={styles.submittingText}>Enregistrement…</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  recentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  recentButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  recentCategory: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1.5,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
    gap: 6,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  causeItem: {
    minHeight: 48,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  causeItemPressed: {
    backgroundColor: 'rgba(59, 91, 255, 0.08)',
    borderColor: '#3b5bff',
  },
  causeLabel: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '500',
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 12,
  },
  submittingText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
})
