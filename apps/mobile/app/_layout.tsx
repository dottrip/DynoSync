import { Stack } from 'expo-router'
import { useAuth } from '../hooks/useAuth'
import { View, ActivityIndicator, KeyboardAvoidingView, Platform, LogBox } from 'react-native'
import { useEffect } from 'react'
import { router } from 'expo-router'

// Suppress Expo Go notification compatibility warnings for SDK 54+
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
])

export default function RootLayout() {
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (session) {
      router.replace('/(tabs)')
    } else {
      router.replace('/(auth)/login')
    }
  }, [session, loading])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101922' }}>
        <ActivityIndicator color="#258cf4" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="log-detail"
          options={{
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            gestureDirection: 'vertical',
          }}
        />
        <Stack.Screen name="vehicle/[id]" />
        <Stack.Screen name="add-vehicle" />
        <Stack.Screen name="add-dyno" />
        <Stack.Screen name="add-mod" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="subscription" />
        <Stack.Screen
          name="share-poster"
          options={{
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            gestureDirection: 'vertical',
          }}
        />
      </Stack>
    </KeyboardAvoidingView>
  )

}

