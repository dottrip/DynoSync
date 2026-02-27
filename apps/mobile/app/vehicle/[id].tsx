import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useDynoRecords } from '../../hooks/useDynoRecords'
import { DynoRecord } from '../../lib/api'

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { records, loading, error, refetch, remove } = useDynoRecords(id)

  const handleDelete = (record: DynoRecord) => {
    Alert.alert('Delete record', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(record.id) },
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Dyno Records</Text>
        <TouchableOpacity onPress={() => router.push(`/add-dyno?vehicleId=${id}`)}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={records}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No dyno runs yet</Text>
            <TouchableOpacity onPress={() => router.push(`/add-dyno?vehicleId=${id}`)}>
              <Text style={styles.link}>Log your first run</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onLongPress={() => handleDelete(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.whp}>{item.whp} WHP</Text>
              <Text style={styles.date}>{new Date(item.recorded_at).toLocaleDateString()}</Text>
            </View>
            {item.torque_nm && <Text style={styles.detail}>Torque: {item.torque_nm} Nm</Text>}
            {item.zero_to_sixty && <Text style={styles.detail}>0-60: {item.zero_to_sixty}s</Text>}
            {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
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
  back: { color: '#258cf4', fontSize: 18 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  addText: { color: '#258cf4', fontSize: 28, lineHeight: 28 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#1c2a38', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#314d68' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  whp: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  date: { color: '#64748b', fontSize: 13 },
  detail: { color: '#94a3b8', fontSize: 14, marginBottom: 4 },
  notes: { color: '#64748b', fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#64748b', fontSize: 16, marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 16, marginBottom: 12 },
  link: { color: '#258cf4', fontSize: 15 },
})
