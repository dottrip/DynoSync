import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import { useVehicles } from '../../hooks/useVehicles'
import { Vehicle } from '../../lib/api'

export default function GarageScreen() {
  const { vehicles, loading, error, refetch, archive } = useVehicles()

  const handleArchive = (vehicle: Vehicle) => {
    Alert.alert('Archive vehicle', `Archive ${vehicle.year} ${vehicle.make} ${vehicle.model}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => archive(vehicle.id) },
    ])
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#258cf4" />
    </View>
  )

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={refetch}><Text style={styles.link}>Retry</Text></TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Garage</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-vehicle')}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={vehicles.filter(v => !v.is_archived)}
        keyExtractor={v => v.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No vehicles yet</Text>
            <TouchableOpacity onPress={() => router.push('/add-vehicle')}>
              <Text style={styles.link}>Add your first car</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/vehicle/${item.id}`)}
            onLongPress={() => handleArchive(item)}
          >
            <View style={styles.cardContent}>
              <Text style={styles.vehicleName}>{item.year} {item.make} {item.model}</Text>
              {item.trim && <Text style={styles.vehicleTrim}>{item.trim}</Text>}
              <View style={styles.badges}>
                {item.drivetrain && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.drivetrain}</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101922' },
  center: { flex: 1, backgroundColor: '#101922', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  addButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#258cf4', justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 24, lineHeight: 28 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#1c2a38', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#314d68' },
  cardContent: { flex: 1 },
  vehicleName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  vehicleTrim: { color: '#64748b', fontSize: 13, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { backgroundColor: '#0f1e2b', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#64748b', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  chevron: { color: '#314d68', fontSize: 24 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#64748b', fontSize: 16, marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 16, marginBottom: 12 },
  link: { color: '#258cf4', fontSize: 15 },
})
