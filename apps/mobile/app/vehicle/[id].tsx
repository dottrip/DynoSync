import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useDynoRecords } from '../../hooks/useDynoRecords'
import { useModLogs } from '../../hooks/useModLogs'
import { DynoRecord, ModLog } from '../../lib/api'

type Tab = 'dyno' | 'mods'

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('dyno')

  const dyno = useDynoRecords(id)
  const mods = useModLogs(id)

  const current = activeTab === 'dyno' ? dyno : mods

  const handleDeleteDyno = (record: DynoRecord) => {
    Alert.alert('Delete record', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dyno.remove(record.id) },
    ])
  }

  const handleDeleteMod = (log: ModLog) => {
    Alert.alert('Delete mod', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => mods.remove(log.id) },
    ])
  }

  if (current.loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#258cf4" />
    </View>
  )

  if (current.error) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{current.error}</Text>
      <TouchableOpacity onPress={current.refetch}><Text style={styles.link}>Retry</Text></TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Vehicle Details</Text>
        <TouchableOpacity onPress={() => router.push(activeTab === 'dyno' ? `/add-dyno?vehicleId=${id}` : `/add-mod?vehicleId=${id}`)}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'dyno' && styles.tabActive]} onPress={() => setActiveTab('dyno')}>
          <Text style={[styles.tabText, activeTab === 'dyno' && styles.tabTextActive]}>Dyno</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'mods' && styles.tabActive]} onPress={() => setActiveTab('mods')}>
          <Text style={[styles.tabText, activeTab === 'mods' && styles.tabTextActive]}>Mods</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'dyno' ? (
        <FlatList
          data={dyno.records}
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
            <TouchableOpacity style={styles.card} onLongPress={() => handleDeleteDyno(item)}>
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
      ) : (
        <FlatList
          data={mods.logs}
          keyExtractor={l => l.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No mods logged yet</Text>
              <TouchableOpacity onPress={() => router.push(`/add-mod?vehicleId=${id}`)}>
                <Text style={styles.link}>Log your first mod</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onLongPress={() => handleDeleteMod(item)}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <Text style={styles.date}>{new Date(item.installed_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.modDescription}>{item.description}</Text>
              {item.cost && <Text style={styles.cost}>${item.cost.toFixed(2)}</Text>}
            </TouchableOpacity>
          )}
        />
      )}
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
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#1c2a38' },
  tabActive: { backgroundColor: '#258cf4' },
  tabText: { color: '#64748b', fontWeight: 'bold', fontSize: 15 },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#1c2a38', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#314d68' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  whp: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  date: { color: '#64748b', fontSize: 13 },
  detail: { color: '#94a3b8', fontSize: 14, marginBottom: 4 },
  notes: { color: '#64748b', fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  categoryBadge: { backgroundColor: '#0f1e2b', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { color: '#258cf4', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  modDescription: { color: '#fff', fontSize: 15, marginBottom: 6 },
  cost: { color: '#10b981', fontSize: 14, fontWeight: 'bold' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#64748b', fontSize: 16, marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 16, marginBottom: 12 },
  link: { color: '#258cf4', fontSize: 15 },
})
