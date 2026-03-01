import { Tabs, router } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useVehicles } from '../../hooks/useVehicles'

const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  index: 'speed',
  garage: 'directions-car',
  leaderboard: 'bar-chart',
  profile: 'person',
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { vehicles } = useVehicles()
  const activeVehicles = vehicles.filter(v => !v.is_archived)

  const handleFAB = () => {
    if (activeVehicles.length === 0) {
      router.push('/add-vehicle')
    } else {
      Alert.alert('Quick Add', 'What would you like to add?', [
        { text: 'Vehicle', onPress: () => router.push('/add-vehicle') },
        { text: 'Dyno Run', onPress: () => router.push(`/add-dyno?vehicleId=${activeVehicles[0].id}`) },
        { text: 'Mod', onPress: () => router.push(`/add-mod?vehicleId=${activeVehicles[0].id}`) },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  const tabs = state.routes
  const leftTabs = tabs.slice(0, 2)
  const rightTabs = tabs.slice(2)

  const renderTab = (route: any, index: number) => {
    const { options } = descriptors[route.key]
    const label = options.title ?? route.name
    const isFocused = state.index === index

    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tab}
        onPress={() => navigation.navigate(route.name)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
          <MaterialIcons
            name={TAB_ICONS[route.name]}
            size={22}
            color={isFocused ? '#258cf4' : '#64748b'}
          />
        </View>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.tabBar}>
      <View style={styles.tabGroup}>
        {leftTabs.map((route: any, index: number) => renderTab(route, index))}
      </View>

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={handleFAB} activeOpacity={0.8}>
          <MaterialIcons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabGroup}>
        {rightTabs.map((route: any, index: number) => renderTab(route, index + 2))}
      </View>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Dash' }} />
      <Tabs.Screen name="garage" options={{ title: 'Garage' }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Ranks' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16,25,34,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#1c2a38',
    paddingBottom: 24,
    paddingTop: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(37,140,244,0.12)',
  },
  tabLabel: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: '#258cf4',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#258cf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#258cf4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
})
