import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useVehicles } from '../../hooks/useVehicles'
import { useAuth } from '../../hooks/useAuth'
import { useDashboardStats } from '../../hooks/useDashboardStats'

export default function DashboardScreen() {
  const { user } = useAuth()
  const { vehicles, loading: vehiclesLoading } = useVehicles()
  const { vehicleCount, totalWhp, dynoCount, modCount, loading: statsLoading } = useDashboardStats()

  const activeVehicles = vehicles.filter(v => !v.is_archived)
  const loading = vehiclesLoading || statsLoading

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#258cf4" />
    </View>
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.username}>{user?.user_metadata?.username ?? user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{vehicleCount}</Text>
          <Text style={styles.statLabel}>Vehicles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalWhp > 0 ? totalWhp : '—'}</Text>
          <Text style={styles.statLabel}>Total WHP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{dynoCount > 0 ? dynoCount : '—'}</Text>
          <Text style={styles.statLabel}>Dyno Runs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{modCount > 0 ? modCount : '—'}</Text>
          <Text style={styles.statLabel}>Mods</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Garage</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/garage')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {activeVehicles.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No vehicles yet</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-vehicle')}>
              <Text style={styles.addButtonText}>Add Your First Car</Text>
            </TouchableOpacity>
          </View>
        ) : (
          activeVehicles.slice(0, 3).map(vehicle => (
            <TouchableOpacity
              key={vehicle.id}
              style={styles.vehicleCard}
              onPress={() => router.push(`/vehicle/${vehicle.id}`)}
            >
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
                {vehicle.trim && <Text style={styles.vehicleTrim}>{vehicle.trim}</Text>}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-vehicle')}>
            <Text style={styles.actionIcon}>🚗</Text>
            <Text style={styles.actionText}>Add Vehicle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => activeVehicles[0] && router.push(`/add-dyno?vehicleId=${activeVehicles[0].id}`)}
            disabled={activeVehicles.length === 0}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Log Dyno</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => activeVehicles[0] && router.push(`/add-mod?vehicleId=${activeVehicles[0].id}`)}
            disabled={activeVehicles.length === 0}
          >
            <Text style={styles.actionIcon}>🔧</Text>
            <Text style={styles.actionText}>Log Mod</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101922' },
  center: { flex: 1, backgroundColor: '#101922', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { color: '#64748b', fontSize: 14 },
  username: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1c2a38', justifyContent: 'center', alignItems: 'center' },
  profileIcon: { fontSize: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#1c2a38', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#314d68' },
  statValue: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#64748b', fontSize: 13, marginTop: 4 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  seeAll: { color: '#258cf4', fontSize: 14 },
  emptyCard: { backgroundColor: '#1c2a38', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#314d68' },
  emptyText: { color: '#64748b', fontSize: 15, marginBottom: 16 },
  addButton: { backgroundColor: '#258cf4', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  vehicleCard: { backgroundColor: '#1c2a38', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#314d68' },
  vehicleInfo: { flex: 1 },
  vehicleName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  vehicleTrim: { color: '#64748b', fontSize: 13, marginTop: 2 },
  chevron: { color: '#314d68', fontSize: 24 },
  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: '#1c2a38', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#314d68' },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
})
