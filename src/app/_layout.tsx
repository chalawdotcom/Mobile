import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { RealtimeProvider } from '@/providers/RealtimeProvider'

function NavigationGuard() {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return

    const firstSegment = segments[0]
    const inAuthGroup = firstSegment === '(auth)'
    const inAppGroup = firstSegment === '(app)'
    const inKioskGroup = firstSegment === '(kiosk)'

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/login')
      }
    } else {
      if (role === 'operatore') {
        if (!inKioskGroup) {
          router.replace('/kiosk')
        }
      } else if (role === 'admin_maintenance' || role === 'superviseur') {
        if (!inAppGroup) {
          router.replace('/dashboard')
        }
      } else {
        router.replace('/login')
      }
    }
  }, [user, role, loading, segments])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#3b5bff" />
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <StatusBar style="dark" />
        <NavigationGuard />
      </RealtimeProvider>
    </AuthProvider>
  )
}
