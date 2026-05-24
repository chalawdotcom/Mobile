import { useEffect } from 'react'
import { ActivityIndicator, View, useColorScheme } from 'react-native'
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

    // segments[0] can be '(auth)', '(app)', '(kiosk)', or undefined
    const firstSegment = segments[0]
    const inAuthGroup = firstSegment === '(auth)'
    const inAppGroup = firstSegment === '(app)'
    const inKioskGroup = firstSegment === '(kiosk)'

    if (!user) {
      // Redirect to login if not authenticated
      if (!inAuthGroup) {
        router.replace('/login')
      }
    } else {
      // User is authenticated. Route based on their role:
      if (role === 'operatore') {
        // Operators only have access to kiosk
        if (!inKioskGroup) {
          router.replace('/kiosk')
        }
      } else if (role === 'admin_maintenance' || role === 'superviseur') {
        // Admins and supervisors go to the main app dashboard
        if (!inAppGroup) {
          router.replace('/dashboard')
        }
      } else {
        // Unauthorized or unknown role redirect to login
        router.replace('/login')
      }
    }
  }, [user, role, loading, segments])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090d16' }}>
        <ActivityIndicator size="large" color="#3b5bff" />
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout() {
  const scheme = useColorScheme()
  return (
    <AuthProvider>
      <RealtimeProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <NavigationGuard />
      </RealtimeProvider>
    </AuthProvider>
  )
}
