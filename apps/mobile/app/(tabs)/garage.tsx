import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, Platform, Dimensions,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useVehicles } from '../../hooks/useVehicles'
import { useDynoRecords } from '../../hooks/useDynoRecords'
import { useTierLimits } from '../../hooks/useTierLimits'
import { Vehicle } from '../../lib/api'
import { UpgradePrompt } from '../../components/UpgradePrompt'

const { width: SW } = Dimensions.get('window')
const GRID_GAP = 10
const GRID_H_PAD = 16
const CARD_W = (SW - GRID_H_PAD * 2 - GRID_GAP) / 2

type ViewMode = 'grid' | 'list'
type FilterTab = 'all' | 'active' | 'project'

// ─── Vehicle Color Generation (Based on car name hash) ───────────────────────
const PALETTE: [string, string][] = [
  ['#1a2f4a', '#0d3b6e'], ['#1a2a1a', '#0d3b1a'], ['#2a1a1a', '#4a0d0d'],
  ['#1a1a2a', '#1a0d4a'], ['#2a2a1a', '#4a3b0d'], ['#1a2a2a', '#0d3b3b'],
]
function getCardGradient(id: string): [string, string] {
  const idx = id.charCodeAt(0) % PALETTE.length
  return PALETTE[idx]
}

// ─── Blueprint Placeholder (Wireframe Style) ─────────────────────────────────
function BlueprintPlaceholder({ label, color }: { label: string; color: string }) {
  const labelLower = label.toLowerCase()
  const isSUV = labelLower.includes('suv') || labelLower.includes('jeep') || labelLower.includes('truck')
  const iconName = isSUV ? 'airport-shuttle' : 'directions-car'

  return (
    <View style={[BP.root, { borderColor: color + '40' }]}>
      <View style={[BP.corner, BP.tl, { borderColor: color }]} />
      <View style={[BP.corner, BP.tr, { borderColor: color }]} />
      <View style={[BP.corner, BP.bl, { borderColor: color }]} />
      <View style={[BP.corner, BP.br, { borderColor: color }]} />
      <View style={[BP.silhouette, { borderColor: color + '60' }]}>
        <MaterialIcons
          name={iconName}
          size={32}
          color={color + '20'}
          style={{ position: 'absolute', alignSelf: 'center', top: 2 }}
        />
        <View style={[BP.wheel, BP.wheelFL, { backgroundColor: color + '50' }]} />
        <View style={[BP.wheel, BP.wheelFR, { backgroundColor: color + '50' }]} />
        <View style={[BP.wheel, BP.wheelRL, { backgroundColor: color + '50' }]} />
        <View style={[BP.wheel, BP.wheelRR, { backgroundColor: color + '50' }]} />
        <View style={[BP.axle, { backgroundColor: color + '40', top: '30%' }]} />
        <View style={[BP.axle, { backgroundColor: color + '40', top: '70%' }]} />
      </View>
      <Text style={[BP.label, { color: color + '80' }]}>{label}</Text>
    </View>
  )
}
const BP = StyleSheet.create({
  root: {
    flex: 1, borderWidth: 1, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', backgroundColor: 'transparent',
  },
  corner: { position: 'absolute', width: 10, height: 10 },
  tl: { top: 6, left: 6, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  tr: { top: 6, right: 6, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  bl: { bottom: 6, left: 6, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  br: { bottom: 6, right: 6, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
  silhouette: {
    width: 64, height: 36, borderWidth: 1, borderRadius: 8, position: 'relative',
    backgroundColor: 'transparent',
  },
  wheel: { position: 'absolute', width: 8, height: 12, borderRadius: 2 },
  wheelFL: { left: -4, top: 4 },
  wheelFR: { right: -4, top: 4 },
  wheelRL: { left: -4, bottom: 4 },
  wheelRR: { right: -4, bottom: 4 },
  axle: { position: 'absolute', left: 0, right: 0, height: 1 },
  label: { fontSize: 8, fontWeight: '700', letterSpacing: 1, marginTop: 8 },
})

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ hasData }: { hasData: boolean }) {
  return hasData ? (
    <View style={[SB.badge, SB.active]}>
      <MaterialIcons name="flash-on" size={9} color="#3ea8ff" />
      <Text style={[SB.text, { color: '#3ea8ff' }]}>ACTIVE</Text>
    </View>
  ) : (
    <View style={[SB.badge, SB.project]}>
      <MaterialIcons name="build" size={9} color="#f59e0b" />
      <Text style={[SB.text, { color: '#f59e0b' }]}>PROJECT</Text>
    </View>
  )
}
const SB = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1,
  },
  active: { backgroundColor: 'rgba(62,168,255,0.12)', borderColor: 'rgba(62,168,255,0.3)' },
  project: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' },
  text: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
})

// ─── Grid Mode Card ───────────────────────────────────────────────────────────
function GridCard({ vehicle, onLongPress }: { vehicle: Vehicle; onLongPress: () => void }) {
  const { records } = useDynoRecords(vehicle.id)
  const hasData = records.length > 0
  const latestWhp = records[0]?.whp
  const [dark, mid] = getCardGradient(vehicle.id)
  const accentColor = hasData ? '#3ea8ff' : '#f59e0b'

  return (
    <TouchableOpacity
      style={[GC.card, { width: CARD_W }]}
      onPress={() => router.push(`/vehicle/${vehicle.id}`)}
      onLongPress={onLongPress}
      activeOpacity={0.88}
    >
      {/* Photo / blueprint area */}
      <View style={[GC.photoArea, { backgroundColor: dark }]}>
        {vehicle.image_url ? (
          <Image
            source={{ uri: vehicle.image_url }}
            style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
          />
        ) : (
          <BlueprintPlaceholder label={`${vehicle.make} ${vehicle.model}`} color={accentColor} />
        )}
        {/* Status badge overlay */}
        <View style={GC.badgeOverlay}>
          <StatusBadge hasData={hasData} />
        </View>
        {/* WHP overlay if has data */}
        {latestWhp != null && (
          <View style={GC.whpOverlay}>
            <Text style={GC.whpOverlayVal}>{latestWhp}</Text>
            <Text style={GC.whpOverlayUnit}>WHP</Text>
          </View>
        )}
      </View>
      {/* Caption */}
      <View style={GC.caption}>
        <Text style={GC.makeText}>{vehicle.make.toUpperCase()}</Text>
        <Text style={GC.modelText} numberOfLines={1}>{vehicle.model} {vehicle.trim ?? ''}</Text>
      </View>
    </TouchableOpacity>
  )
}
const GC = StyleSheet.create({
  card: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#0d1f30' },
  photoArea: { height: CARD_W * 0.85, position: 'relative', padding: 12 },
  badgeOverlay: { position: 'absolute', top: 8, right: 8 },
  whpOverlay: {
    position: 'absolute', bottom: 8, left: 10,
    flexDirection: 'row', alignItems: 'baseline', gap: 2,
  },
  whpOverlayVal: { color: '#fff', fontSize: 18, fontWeight: '900' },
  whpOverlayUnit: { color: '#3ea8ff', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  caption: { padding: 10, paddingTop: 8 },
  makeText: { color: '#4a6480', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  modelText: { color: '#fff', fontSize: 13, fontWeight: '800' },
})

// ─── List Mode Card ───────────────────────────────────────────────────────────
function ListCard({ vehicle, onLongPress }: { vehicle: Vehicle; onLongPress: () => void }) {
  const { records } = useDynoRecords(vehicle.id)
  const hasData = records.length > 0
  const latestWhp = records[0]?.whp
  const dtColors: Record<string, string> = { AWD: '#3ea8ff', RWD: '#f59e0b', FWD: '#10b981' }
  const accentColor = vehicle.drivetrain ? (dtColors[vehicle.drivetrain] ?? '#4a6480') : '#4a6480'

  return (
    <TouchableOpacity
      style={LC.card}
      onPress={() => router.push(`/vehicle/${vehicle.id}`)}
      onLongPress={onLongPress}
      activeOpacity={0.88}
    >
      <View style={[LC.accent, { backgroundColor: accentColor }]} />
      <View style={LC.body}>
        <View style={LC.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={LC.year}>{vehicle.year}</Text>
            <Text style={LC.name}>{vehicle.make} {vehicle.model}{vehicle.trim ? ` · ${vehicle.trim}` : ''}</Text>
          </View>
          <View style={LC.rightCol}>
            {latestWhp != null ? (
              <>
                <Text style={LC.whp}>{latestWhp}</Text>
                <Text style={LC.whpUnit}>WHP</Text>
              </>
            ) : (
              <Text style={LC.whpNone}>—</Text>
            )}
          </View>
        </View>
        <View style={LC.bottomRow}>
          <StatusBadge hasData={hasData} />
          {vehicle.drivetrain && (
            <View style={[LC.dtBadge, { borderColor: accentColor + '50', backgroundColor: accentColor + '15' }]}>
              <Text style={[LC.dtText, { color: accentColor }]}>{vehicle.drivetrain}</Text>
            </View>
          )}
          <Text style={LC.stat}>{records.length} RUNS</Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={18} color="#4a6480" />
    </TouchableOpacity>
  )
}
const LC = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0d1f30', borderRadius: 12,
    borderWidth: 1, borderColor: '#1c2e40', overflow: 'hidden',
  },
  accent: { width: 3, alignSelf: 'stretch' },
  body: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  year: { color: '#4a6480', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  name: { color: '#fff', fontSize: 16, fontWeight: '800' },
  rightCol: { alignItems: 'flex-end', minWidth: 56 },
  whp: { color: '#3ea8ff', fontSize: 24, fontWeight: '900', lineHeight: 26 },
  whpUnit: { color: '#4a6480', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  whpNone: { color: '#2a3f55', fontSize: 20, fontWeight: '700' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dtBadge: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1 },
  dtText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  stat: { color: '#2a3f55', fontSize: 9, fontWeight: '700', letterSpacing: 1, flex: 1 },
})

// ─── ADD BUILD Card (Grid / List) ────────────────────────────────────────────
function AddBuildCard({ mode, slotsLeft, onPress }: { mode: ViewMode; slotsLeft: number; onPress: () => void }) {
  const isGrid = mode === 'grid'
  return (
    <TouchableOpacity
      style={isGrid
        ? [AB.gridCard, { width: CARD_W }]
        : AB.listCard
      }
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={isGrid ? AB.gridInner : AB.listInner}>
        <View style={AB.plusBox}>
          <MaterialIcons name="add" size={22} color="#3ea8ff" />
        </View>
        <Text style={AB.label}>ADD BUILD</Text>
        {slotsLeft >= 0 && (
          <Text style={AB.slots}>{slotsLeft} SLOTS REMAINING</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}
const AB = StyleSheet.create({
  gridCard: {
    borderRadius: 12, borderWidth: 1.5, borderColor: '#1c2e40',
    borderStyle: 'dashed', height: CARD_W * 0.85 + 46, overflow: 'hidden',
  },
  listCard: {
    borderRadius: 12, borderWidth: 1.5, borderColor: '#1c2e40',
    borderStyle: 'dashed', paddingVertical: 18,
  },
  gridInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  listInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  plusBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(62,168,255,0.1)', borderWidth: 1,
    borderColor: 'rgba(62,168,255,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  label: { color: '#4a6480', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  slots: { color: '#2a3f55', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
})

// ─── Main Screen ──────────────────────────────────────────────────────────────
const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'ALL BUILDS' },
  { key: 'active', label: 'ACTIVE' },
  { key: 'project', label: 'PROJECT' },
]

export default function GarageScreen() {
  const { vehicles, loading, error, refetch, archive } = useVehicles()
  const { limits, tier } = useTierLimits()
  const active = vehicles.filter(v => !v.is_archived)
  const canAddVehicle = limits.vehicles === Infinity || active.length < limits.vehicles

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [showUpgrade, setShowUpgrade] = useState(false)

  const handleAddVehicle = () => {
    if (canAddVehicle) router.push('/add-vehicle');
    else setShowUpgrade(true);
  }

  useFocusEffect(useCallback(() => { refetch() }, []))

  // Tab filtering — active/project requires dyno data check
  // We simple filter name-wise; actual data check is inside each card
  // (For simplicity, we don't cross-filter by dyno count here — that would
  //  require lifting all dyno data up. Instead show all + badge in cards.)
  const displayed = active  // all tabs show same list; badge clarifies status

  const slotsLeft = limits.vehicles === Infinity ? -1 : Math.max(0, limits.vehicles - active.length)

  const handleArchive = (v: Vehicle) =>
    Alert.alert('Archive Vehicle', `Archive ${v.year} ${v.make} ${v.model}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => archive(v.id) },
    ])

  if (loading) return (
    <View style={S.center}><ActivityIndicator color="#3ea8ff" size="large" /></View>
  )
  if (error) return (
    <View style={S.center}>
      <Text style={S.errText}>{error}</Text>
      <TouchableOpacity onPress={refetch} style={S.retryBtn}>
        <Text style={S.retryText}>RETRY</Text>
      </TouchableOpacity>
    </View>
  )

  // Build list data: vehicle items + one ADD BUILD cell if limit allows
  const gridData: (Vehicle | 'ADD_BUILD')[] = [...displayed, ...(canAddVehicle ? ['ADD_BUILD' as const] : [])]

  return (
    <View style={S.root}>
      {/* ── Header ── */}
      <View style={S.header}>
        <View>
          <Text style={S.title}>MY GARAGE</Text>
          <Text style={S.sub}>{active.length} BUILD{active.length !== 1 ? 'S' : ''}</Text>
        </View>
        {/* View mode toggle */}
        <View style={S.toggleRow}>
          <TouchableOpacity
            style={[S.toggleBtn, viewMode === 'grid' && S.toggleBtnActive]}
            onPress={() => setViewMode('grid')}
          >
            <MaterialIcons name="grid-view" size={18} color={viewMode === 'grid' ? '#3ea8ff' : '#4a6480'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.toggleBtn, viewMode === 'list' && S.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <MaterialIcons name="format-list-bulleted" size={18} color={viewMode === 'list' ? '#3ea8ff' : '#4a6480'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter Tabs ── */}
      <View style={S.tabsRow}>
        {FILTER_TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[S.tab, filterTab === t.key && S.tabActive]}
            onPress={() => setFilterTab(t.key)}
          >
            <Text style={[S.tabText, filterTab === t.key && S.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ── */}
      {viewMode === 'grid' ? (
        <FlatList
          key="grid"
          data={gridData}
          keyExtractor={(item, i) => typeof item === 'string' ? 'add' : item.id}
          numColumns={2}
          columnWrapperStyle={S.gridRow}
          contentContainerStyle={S.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) =>
            typeof item === 'string'
              ? <AddBuildCard mode="grid" slotsLeft={slotsLeft} onPress={handleAddVehicle} />
              : <GridCard vehicle={item} onLongPress={() => handleArchive(item)} />
          }
        />
      ) : (
        <FlatList
          key="list"
          data={gridData}
          keyExtractor={(item, i) => typeof item === 'string' ? 'add' : item.id}
          contentContainerStyle={S.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) =>
            typeof item === 'string'
              ? <AddBuildCard mode="list" slotsLeft={slotsLeft} onPress={handleAddVehicle} />
              : <ListCard vehicle={item} onLongPress={() => handleArchive(item)} />
          }
        />
      )}

      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Vehicle Limit Reached"
        message={tier === 'pro'
          ? `You have reached the maximum limit of ${limits.vehicles} vehicles. Please archive an existing vehicle to add a new one.`
          : `You've reached the limit of ${limits.vehicles} vehicle${limits.vehicles > 1 ? 's' : ''} on your current plan.`
        }
        feature="Up to 5 vehicles"
        tier={tier}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a1520' },
  center: { flex: 1, backgroundColor: '#0a1520', justifyContent: 'center', alignItems: 'center', gap: 12 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1c2e40',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  sub: { color: '#4a6480', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 2 },

  toggleRow: {
    flexDirection: 'row', gap: 4,
    backgroundColor: '#0d1f30', borderRadius: 10, padding: 4,
    borderWidth: 1, borderColor: '#1c2e40',
  },
  toggleBtn: { width: 34, height: 34, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  toggleBtnActive: { backgroundColor: 'rgba(62,168,255,0.15)' },

  // Filter tabs
  tabsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 6,
    borderBottomWidth: 1, borderBottomColor: '#1c2e40',
  },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tabActive: { backgroundColor: 'rgba(62,168,255,0.12)', borderWidth: 1, borderColor: 'rgba(62,168,255,0.3)' },
  tabText: { color: '#4a6480', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  tabTextActive: { color: '#3ea8ff' },

  // Grid
  gridContent: { padding: GRID_H_PAD, paddingBottom: 110, gap: GRID_GAP },
  gridRow: { gap: GRID_GAP },

  // List
  listContent: { padding: 16, paddingBottom: 110, gap: 16 },

  // Error
  errText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  retryBtn: { borderRadius: 10, borderWidth: 1, borderColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: '#ef4444', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
})
