import { Tabs, router } from 'expo-router'
import { View, TouchableOpacity, StyleSheet, Text, Alert, Platform } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useVehicles } from '../../hooks/useVehicles'

const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  index: 'speed',
  garage: 'directions-car',
  'ai-lab': 'psychology',
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
            name={TAB_ICONS[route.name] || 'help'}
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

      <View style={styles.fabWrapper}>
        <View style={styles.fabBackdrop} />
        <TouchableOpacity style={styles.fab} onPress={handleFAB} activeOpacity={0.8}>
          <MaterialIcons name="add" size={30} color="#fff" />
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
      <Tabs.Screen name="ai-lab" options={{ title: 'AI Lab' }} />
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
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    paddingTop: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 88 : 72,
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  fabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    marginTop: -36, // Push it up half-way
  },
  fabBackdrop: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0a1520',
    borderWidth: 1,
    borderColor: '#1c2a38',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(37,140,244,0.12)',
  },
  tabLabel: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabLabelActive: {
    color: '#258cf4',
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#258cf4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#258cf4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
})
