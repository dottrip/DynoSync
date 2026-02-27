import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#101922', borderTopColor: '#1c2a38' }, tabBarActiveTintColor: '#258cf4', tabBarInactiveTintColor: '#64748b' }}>
      <Tabs.Screen name="garage" options={{ title: 'Garage', tabBarIcon: ({ color }) => null }} />
      <Tabs.Screen name="dyno" options={{ title: 'Dyno', tabBarIcon: ({ color }) => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => null }} />
    </Tabs>
  )
}
