import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, Platform, ScrollView, Share,
  Switch,
} from 'react-native'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useVehicles } from '../../hooks/useVehicles'
import { useDynoRecords } from '../../hooks/useDynoRecords'
import { useModLogs } from '../../hooks/useModLogs'
import { useSettings } from '../../hooks/useSettings'
import { api, DynoRecord, ModLog } from '../../lib/api'
import { formatTorqueValueOnly, getTorqueUnit } from '../../lib/units'

type Tab = 'dyno' | 'mods'

// ─── 改装类别颜色映射 ─────────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  engine: '#f59e0b', exhaust: '#ef4444', intake: '#3ea8ff',
  suspension: '#8b5cf6', brakes: '#dc2626', wheels: '#6b7280',
  aero: '#06b6d4', interior: '#a78bfa', electronics: '#10b981', other: '#64748b',
}
const CAT_ICON: Record<string, any> = {
  engine: 'settings', exhaust: 'waves', intake: 'air',
  suspension: 'airline-seat-flat', brakes: 'stop-circle', wheels: 'radio-button-unchecked',
  aero: 'flight', interior: 'weekend', electronics: 'memory', other: 'build',
}

// ─── Dyno 记录卡 ──────────────────────────────────────────────────────────────
function DynoCard({ record, prev, vehicleId, onDelete }: {
  record: DynoRecord
  prev?: DynoRecord
  vehicleId: string
  onDelete: () => void
}) {
  const { imperialUnits } = useSettings()
  const delta = prev ? record.whp - prev.whp : null
  const deltaPct = delta !== null && prev ? (delta / prev.whp) * 100 : null
  const isBaseline = record.notes === 'Stock baseline'

  return (
    <TouchableOpacity
      style={DC.card}
      onPress={() => router.push({
        pathname: '/log-detail',
        params: { vehicleId, logId: record.id, type: 'dyno' }
      })}
      onLongPress={onDelete}
      activeOpacity={0.85}
    >
      <View style={DC.left}>
        {/* WHP大字 */}
        <View style={DC.whpRow}>
          <Text style={DC.whpValue}>{record.whp}</Text>
          <Text style={DC.whpUnit}>WHP</Text>
          {delta !== null && deltaPct !== null && (
            <View style={[DC.deltaBadge, { backgroundColor: delta >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
              <MaterialIcons name={delta >= 0 ? 'arrow-upward' : 'arrow-downward'} size={10} color={delta >= 0 ? '#10b981' : '#ef4444'} />
              <Text style={[DC.deltaText, { color: delta >= 0 ? '#10b981' : '#ef4444' }]}>
                {delta >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%
              </Text>
            </View>
          )}
          {isBaseline && (
            <View style={DC.baselineBadge}>
              <Text style={DC.baselineText}>STOCK</Text>
            </View>
          )}
        </View>
        {/* Sub metrics */}
        <View style={DC.subRow}>
          {record.torque_nm != null && (
            <Text style={DC.subText}>
              {formatTorqueValueOnly(record.torque_nm, imperialUnits)} {getTorqueUnit(imperialUnits).toUpperCase()}
            </Text>
          )}
          {record.zero_to_sixty != null && <Text style={DC.subText}>{record.zero_to_sixty}s 0-60</Text>}
        </View>
        {record.notes && !isBaseline && <Text style={DC.notes} numberOfLines={1}>{record.notes}</Text>}
      </View>
      <View style={DC.right}>
        <Text style={DC.date}>{new Date(record.recorded_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</Text>
        <Text style={DC.dateYear}>{new Date(record.recorded_at).getFullYear()}</Text>
        <MaterialIcons name="chevron-right" size={18} color="#3d5470" style={{ marginTop: 8 }} />
      </View>
    </TouchableOpacity>
  )
}

const DC = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: '#0d1f30', borderRadius: 12,
    borderWidth: 1, borderColor: '#1c2e40', padding: 14,
  },
  left: { flex: 1 },
  whpRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  whpValue: { color: '#fff', fontSize: 28, fontWeight: '900' },
  whpUnit: { color: '#3ea8ff', fontSize: 14, fontWeight: '700', paddingTop: 6 },
  deltaBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  deltaText: { fontSize: 10, fontWeight: '700' },
  baselineBadge: { backgroundColor: 'rgba(100,116,139,0.2)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  baselineText: { color: '#64748b', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  subRow: { flexDirection: 'row', gap: 12 },
  subText: { color: '#4a6480', fontSize: 12, fontWeight: '600' },
  notes: { color: '#3d5470', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  right: { alignItems: 'flex-end' },
  date: { color: '#4a6480', fontSize: 13, fontWeight: '600' },
  dateYear: { color: '#2a3f55', fontSize: 11 },
})

// ─── Mod 记录卡 ───────────────────────────────────────────────────────────────
function ModCard({ log, onDelete }: { log: ModLog; onDelete: () => void }) {
  const color = CAT_COLOR[log.category] ?? '#64748b'
  const icon = CAT_ICON[log.category] ?? 'build'

  return (
    <TouchableOpacity
      style={[MC.card, { borderLeftColor: color }]}
      onLongPress={onDelete}
      activeOpacity={0.85}
    >
      <View style={[MC.iconBox, { backgroundColor: color + '18' }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <View style={MC.body}>
        <View style={MC.topRow}>
          <View style={[MC.catBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
            <Text style={[MC.catText, { color }]}>{log.category.toUpperCase()}</Text>
          </View>
          <Text style={MC.date}>{new Date(log.installed_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        </View>
        <Text style={MC.desc} numberOfLines={2}>{log.description}</Text>
        {log.cost != null && (
          <Text style={MC.cost}>${log.cost.toFixed(2)}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const MC = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: '#0d1f30', borderRadius: 12,
    borderWidth: 1, borderColor: '#1c2e40', borderLeftWidth: 3, overflow: 'hidden',
  },
  iconBox: { width: 52, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  catBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  catText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  date: { color: '#3d5470', fontSize: 11 },
  desc: { color: '#fff', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  cost: { color: '#10b981', fontSize: 13, fontWeight: '700' },
})

// ─── 主屏 ─────────────────────────────────────────────────────────────────────
export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('dyno')

  const { vehicles, refetch: refetchVehicles } = useVehicles()
  const vehicle = vehicles.find(v => v.id === id)
  const [updatingPublic, setUpdatingPublic] = useState(false)

  const dyno = useDynoRecords(id)
  const mods = useModLogs(id)

  useFocusEffect(useCallback(() => {
    dyno.refetch()
    mods.refetch()
  }, []))

  const latestWhp = dyno.records[0]?.whp
  const totalCost = mods.logs.reduce((sum, l) => sum + (l.cost ?? 0), 0)

  const handleDeleteDyno = (r: DynoRecord) => {
    Alert.alert('Delete Record', 'Remove this dyno run?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dyno.remove(r.id) },
    ])
  }

  const handleDeleteMod = (l: ModLog) => {
    Alert.alert('Delete Mod', 'Remove this mod log?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => mods.remove(l.id) },
    ])
  }

  const handleShare = async () => {
    try {
      // In a real app we would use deep linking or universal links
      // e.g., https://dynosync.co/public/vehicle/123
      const url = `https://dynosync.co/public/vehicle/${id}`
      await Share.share({
        message: `Check out my ${vehicle?.year} ${vehicle?.make} ${vehicle?.model} build on DynoSync! ${url}`,
        title: `${vehicle?.make} ${vehicle?.model} Build`,
        url,
      })
    } catch (error) {
      console.error(error)
    }
  }

  const handleTogglePublic = async (val: boolean) => {
    if (!vehicle) return
    setUpdatingPublic(true)
    try {
      await api.vehicles.update(vehicle.id, { is_public: val })
      await refetchVehicles()
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update visibility')
    } finally {
      setUpdatingPublic(false)
    }
  }

  if (dyno.loading && mods.loading) return (
    <View style={S.center}>
      <ActivityIndicator color="#3ea8ff" size="large" />
    </View>
  )

  return (
    <View style={S.root}>
      {/* ── Header ── */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#3ea8ff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          {vehicle && (
            <Text style={S.headerTitle} numberOfLines={1}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
          )}
        </View>

        <View style={S.headerActions}>
          <TouchableOpacity
            style={S.shareBtn}
            onPress={() => router.push(`/share-poster?vehicleId=${id}`)}
          >
            <MaterialIcons name="style" size={20} color="#3ea8ff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={S.shareBtn}
            onPress={handleShare}
          >
            <MaterialIcons name="ios-share" size={20} color="#3ea8ff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={S.addBtn}
            onPress={() => router.push(activeTab === 'dyno' ? `/add-dyno?vehicleId=${id}` : `/add-mod?vehicleId=${id}`)}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Vehicle Photo ── */}
      {vehicle?.image_url && (
        <View style={S.coverPhotoContainer}>
          <Image source={{ uri: vehicle.image_url }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
          {/* Subtle gradient/dark overlay to distinct it from background */}
          <View style={S.coverPhotoOverlay} />
        </View>
      )}

      {/* ── Hero Stats ── */}
      <View style={S.heroRow}>
        <View style={S.heroStat}>
          <Text style={S.heroValue}>{latestWhp ?? '—'}</Text>
          <Text style={S.heroLabel}>WHP</Text>
        </View>
        <View style={S.heroDivider} />
        <View style={S.heroStat}>
          <Text style={S.heroValue}>{dyno.records.length}</Text>
          <Text style={S.heroLabel}>DYNOS</Text>
        </View>
        <View style={S.heroDivider} />
        <View style={S.heroStat}>
          <Text style={S.heroValue}>{mods.logs.length}</Text>
          <Text style={S.heroLabel}>MODS</Text>
        </View>
        <View style={S.heroDivider} />
        <View style={S.heroStat}>
          <Text style={[S.heroValue, { color: '#10b981', fontSize: totalCost > 0 ? 18 : 24 }]}>
            {totalCost > 0 ? `$${totalCost > 999 ? (totalCost / 1000).toFixed(1) + 'k' : totalCost}` : '—'}
          </Text>
          <Text style={S.heroLabel}>INVESTED</Text>
        </View>
      </View>

      {/* ── Public Visibility Toggle ── */}
      <View style={S.visibilityRow}>
        <View style={S.visibilityInfo}>
          <MaterialIcons
            name={vehicle?.is_public ? 'public' : 'public-off'}
            size={18}
            color={vehicle?.is_public ? '#3ea8ff' : '#4a6480'}
          />
          <View>
            <Text style={S.visibilityTitle}>Public Visibility</Text>
            <Text style={S.visibilitySub}>
              {vehicle?.is_public ? 'Visible on Global Leaderboard' : 'Hidden from Global Leaderboard'}
            </Text>
          </View>
        </View>
        {updatingPublic ? (
          <ActivityIndicator size="small" color="#3ea8ff" style={{ marginRight: 8 }} />
        ) : (
          <Switch
            value={vehicle?.is_public ?? false}
            onValueChange={handleTogglePublic}
            trackColor={{ false: '#1c2e40', true: 'rgba(62,168,255,0.4)' }}
            thumbColor={vehicle?.is_public ? '#3ea8ff' : '#4a6480'}
          />
        )}
      </View>

      {/* ── Tabs ── */}
      <View style={S.tabs}>
        {(['dyno', 'mods'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[S.tab, activeTab === tab && S.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={tab === 'dyno' ? 'speed' : 'build'}
              size={15}
              color={activeTab === tab ? '#fff' : '#4a6480'}
            />
            <Text style={[S.tabText, activeTab === tab && S.tabTextActive]}>
              {tab === 'dyno' ? 'DYNO RUNS' : 'MOD LOG'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ── */}
      {activeTab === 'dyno' ? (
        <View style={{ flex: 1 }}>
          {dyno.records.length >= 2 && (
            <TouchableOpacity
              style={PD.card}
              onPress={() => router.push({ pathname: '/performance-delta', params: { vehicleId: vehicle?.id } })}
              activeOpacity={0.85}
            >
              <View style={PD.left}>
                <MaterialIcons name="bar-chart" size={20} color="#3ea8ff" />
                <View>
                  <Text style={PD.title}>Performance Delta</Text>
                  <Text style={PD.sub}>Before / After comparison</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={14} color="#3ea8ff" />
            </TouchableOpacity>
          )}
          <FlatList
            data={dyno.records}
            keyExtractor={r => r.id}
            contentContainerStyle={[S.list, dyno.records.length === 0 && { flex: 1 }]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={S.empty}>
                <MaterialIcons name="speed" size={40} color="#1c2e40" />
                <Text style={S.emptyTitle}>NO DYNO RUNS YET</Text>
                <TouchableOpacity style={S.emptyBtn} onPress={() => router.push(`/add-dyno?vehicleId=${id}`)}>
                  <Text style={S.emptyBtnText}>LOG FIRST RUN</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item, index }) => (
              <DynoCard
                record={item}
                prev={dyno.records[index + 1]}
                vehicleId={id}
                onDelete={() => handleDeleteDyno(item)}
              />
            )}
          />
        </View>
      ) : (
        <FlatList
          data={mods.logs}
          keyExtractor={l => l.id}
          contentContainerStyle={[S.list, mods.logs.length === 0 && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={S.empty}>
              <MaterialIcons name="build" size={40} color="#1c2e40" />
              <Text style={S.emptyTitle}>NO MODS LOGGED YET</Text>
              <TouchableOpacity style={S.emptyBtn} onPress={() => router.push(`/add-mod?vehicleId=${id}`)}>
                <Text style={S.emptyBtnText}>LOG FIRST MOD</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <ModCard log={item} onDelete={() => handleDeleteMod(item)} />
          )}
        />
      )}
    </View>
  )
}

const C = { bg: '#0a1520', border: '#1c2e40', blue: '#3ea8ff', muted: '#4a6480', text: '#fff' }

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shareBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(62,168,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center',
  },

  coverPhotoContainer: {
    height: 200, width: '100%', position: 'relative',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  coverPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 21, 32, 0.4)',
  },
  // Hero stats row
  heroRow: {
    flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: '#0d1f30',
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroValue: { color: C.text, fontSize: 24, fontWeight: '900', marginBottom: 2 },
  heroLabel: { color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  heroDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },

  // Tabs
  tabs: {
    flexDirection: 'row', padding: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10, backgroundColor: '#0d1f30',
    borderWidth: 1, borderColor: C.border,
  },
  tabActive: { backgroundColor: C.blue, borderColor: C.blue },
  tabText: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  tabTextActive: { color: C.text },

  // List
  list: { padding: 14, gap: 10, paddingBottom: 110 },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  emptyTitle: { color: C.muted, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  emptyBtn: {
    borderRadius: 10, borderWidth: 1, borderColor: C.blue,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 4,
  },
  emptyBtnText: { color: C.blue, fontSize: 11, fontWeight: '800', letterSpacing: 2 },

  // Visibility Toggle
  visibilityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: 'rgba(13, 31, 48, 0.5)',
  },
  visibilityInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  visibilityTitle: { color: C.text, fontSize: 14, fontWeight: '700' },
  visibilitySub: { color: C.muted, fontSize: 11, marginTop: 1 },
})

// ─── Performance Delta entry card styles ─────────────────────────────────────
const PD = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 14, marginTop: 14, marginBottom: 4,
    backgroundColor: 'rgba(62,168,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(62,168,255,0.25)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sub: { color: '#4a6480', fontSize: 11, marginTop: 1 },
})
