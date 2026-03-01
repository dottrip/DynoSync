import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, RefreshControl, ScrollView, Modal, Alert
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { LeaderboardEntry } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'

// ─── 头像占位 ─────────────────────────────────────────────────────────────────
function AvatarBox({ username, size = 36 }: { username: string, size?: number }) {
  const initial = username?.[0]?.toUpperCase() || '?'
  // const colors = ['#3ea8ff', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
  // const bg = colors[username.length % colors.length]
  const bg = '#1d2c3f'

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.45, fontWeight: '800' }}>{initial}</Text>
    </View>
  )
}

// ─── 排名徽章 ────────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <View style={{ alignItems: 'center' }}>
        <MaterialIcons name="emoji-events" size={24} color="#f59e0b" style={{ marginBottom: 2 }} />
        <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>1ST</Text>
      </View>
    )
  }

  let color = '#4a6480'
  let size = 18
  if (rank === 2) { color = '#94a3b8'; size = 22 }
  if (rank === 3) { color = '#d97706'; size = 22 }

  return (
    <Text style={{ color, fontSize: size, fontWeight: '900', fontStyle: 'italic', fontVariant: ['tabular-nums'] }}>
      {rank}
    </Text>
  )
}

// ─── 排行榜条目卡片 ──────────────────────────────────────────────────────────
function LeaderboardCard({ item, rank, isMe, criteria = 'whp' }: { item: LeaderboardEntry; rank: number; isMe: boolean; criteria?: string }) {
  const isFirst = rank === 1

  // Determine which stat to show on the right based on currently selected criteria
  let statValue = item.whp?.toString()
  let statLabel = 'WHP'

  if (criteria === '060') {
    statValue = item.zero_to_sixty ? `${item.zero_to_sixty}s` : '--'
    statLabel = '0-60'
  } else if (criteria === '1/4') {
    statValue = item.quarter_mile ? `${item.quarter_mile}s` : '--'
    statLabel = '1/4 M'
  } else if (criteria === 'mods') {
    statValue = item.whp?.toString() // Fallback since mod count isn't retrieved yet
    statLabel = 'WHP'
  }

  return (
    <TouchableOpacity
      style={[LC.card, isFirst && LC.cardFirst, isMe && !isFirst && LC.cardMe]}
      onPress={() => router.push({ pathname: '/build-profile', params: { vehicleId: item.vehicle.id } })}
      activeOpacity={0.8}
    >
      <View style={LC.body}>
        <View style={LC.rankCol}>
          <RankBadge rank={rank} />
        </View>

        <AvatarBox username={item.user.username} size={44} />

        <View style={LC.infoCol}>
          <View style={LC.userRow}>
            <Text style={LC.username} numberOfLines={1}>{item.user.username}</Text>
            {item.user.tier !== 'free' && (
              <MaterialIcons name="verified" size={14} color="#3ea8ff" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={LC.vehicleName} numberOfLines={1}>
            {item.vehicle.make === 'Audi' && item.vehicle.model.includes('S') ? 'Stage 3 RS4 • Meth Injection' : `${item.vehicle.model} • ${item.vehicle.trim || 'Stock Turbo'}`}
          </Text>
        </View>

        <View style={LC.whpCol}>
          <Text style={[LC.whpVal, isFirst ? { color: '#f59e0b' } : { color: '#fff' }]}>{statValue}</Text>
          <Text style={{ color: '#4a6480', fontSize: 10, fontWeight: '800' }}>{statLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const LC = StyleSheet.create({
  card: {
    backgroundColor: '#0d1f30', borderRadius: 16,
    borderWidth: 1, borderColor: '#1c2e40', marginBottom: 12,
  },
  cardFirst: { borderColor: 'rgba(245,158,11,0.5)', backgroundColor: '#14181f' },
  cardMe: { borderColor: 'rgba(62,168,255,0.4)', backgroundColor: '#0f253a' },

  body: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  rankCol: { width: 32, alignItems: 'center', justifyContent: 'center' },

  infoCol: { flex: 1, justifyContent: 'center' },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  username: { color: '#fff', fontSize: 16, fontWeight: '800' },

  vehicleName: { color: '#8ba3b8', fontSize: 12, fontWeight: '600' },

  whpCol: { alignItems: 'flex-end', minWidth: 60, marginRight: 8 },
  whpVal: { fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
})

// ─── 排行榜筛选模态框 ──────────────────────────────────────────────────────
interface FilterModalProps {
  visible: boolean; onClose: () => void;
  criteria: string; setCriteria: (c: string) => void;
  region: string; setRegion: (r: string) => void;
}
function LeaderboardFiltersModal({ visible, onClose, criteria, setCriteria, region, setRegion }: FilterModalProps) {

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={FM.overlay}>
        <View style={FM.container}>
          {/* Header */}
          <View style={FM.header}>
            <TouchableOpacity onPress={onClose} style={FM.iconBtn}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={FM.title}>LEADERBOARD FILTERS</Text>
            <TouchableOpacity onPress={() => { setCriteria('whp'); setRegion('global') }} style={FM.resetBtn}>
              <Text style={FM.resetText}>RESET</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={FM.scrollContent}>

            {/* ── RANKING CRITERIA ── */}
            <View style={FM.section}>
              <View style={FM.sectionHead}>
                <MaterialIcons name="tune" size={18} color="#3ea8ff" />
                <Text style={FM.sectionTitle}>RANKING CRITERIA</Text>
              </View>

              <CriteriaOption
                id="whp" selectedId={criteria} onSelect={setCriteria}
                title="HIGHEST WHP" sub="Wheel Horsepower rankings" icon="speed"
              />
              <CriteriaOption
                id="060" selectedId={criteria} onSelect={setCriteria}
                title="FASTEST 0-60MPH" sub="Acceleration sprint" icon="timer"
              />
              <CriteriaOption
                id="1/4" selectedId={criteria} onSelect={setCriteria}
                title="QUICKEST 1/4 MILE" sub="Drag strip times" icon="flag"
              />
              <CriteriaOption
                id="mods" selectedId={criteria} onSelect={setCriteria}
                title="MOST MODS" sub="Modification count" icon="build"
              />
            </View>

            {/* ── REGION ── */}
            <View style={[FM.section, { marginTop: 12 }]}>
              <View style={FM.sectionHead}>
                <MaterialIcons name="public" size={18} color="#3ea8ff" />
                <Text style={FM.sectionTitle}>REGION</Text>
              </View>

              <View style={FM.grid}>
                <RegionOption id="global" selectedId={region} onSelect={setRegion} title="GLOBAL" icon="public" />
                <RegionOption id="na" selectedId={region} onSelect={setRegion} title="NORTH AMERICA" icon="place" />
                <RegionOption id="eu" selectedId={region} onSelect={setRegion} title="EUROPE" icon="euro" />
                <RegionOption id="asia" selectedId={region} onSelect={setRegion} title="ASIA" icon="castle" />
              </View>
            </View>

          </ScrollView>

          {/* Fixed Footer */}
          <View style={FM.footer}>
            <TouchableOpacity style={FM.applyBtn} onPress={onClose} activeOpacity={0.8}>
              <MaterialIcons name="filter-list" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={FM.applyText}>APPLY FILTERS</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  )
}

function CriteriaOption({ id, selectedId, onSelect, title, sub, icon }: any) {
  const isSelected = id === selectedId
  return (
    <TouchableOpacity style={[FM.cardRow, isSelected && FM.cardRowSelected]} onPress={() => onSelect(id)} activeOpacity={0.8}>
      <View style={[FM.radioRing, isSelected && FM.radioRingSelected]}>
        {isSelected && <View style={FM.radioDot} />}
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={FM.cardTitle}>{title}</Text>
        <Text style={FM.cardSub}>{sub}</Text>
      </View>
      <MaterialIcons name={icon} size={20} color={isSelected ? "#3ea8ff" : "#4a6480"} />
    </TouchableOpacity>
  )
}

function RegionOption({ id, selectedId, onSelect, title, icon }: any) {
  const isSelected = id === selectedId
  return (
    <TouchableOpacity style={[FM.gridCard, isSelected && FM.gridCardSelected]} onPress={() => onSelect(id)} activeOpacity={0.8}>
      <MaterialIcons name={icon} size={28} color={isSelected ? "#3ea8ff" : "#fff"} style={{ marginBottom: 12 }} />
      <Text style={[FM.gridTitle, isSelected && FM.gridTitleSelected, { textAlign: 'center' }]}>{title}</Text>
    </TouchableOpacity>
  )
}

// ─── 主屏 ─────────────────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const { entries, loading, error, refetch } = useLeaderboard()
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'Global' | 'Regional' | 'Following'>('Global')
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [criteria, setCriteria] = useState('whp')
  const [region, setRegion] = useState('global')

  // Fetch when screen gains focus, filters change, or tab changes
  useFocusEffect(useCallback(() => {
    const effectiveRegion = activeTab === 'Following' ? 'following' : (activeTab === 'Global' ? 'global' : region)
    refetch(criteria, effectiveRegion)
  }, [criteria, region, activeTab, refetch]))

  const onRefresh = async () => {
    setRefreshing(true)
    const effectiveRegion = activeTab === 'Following' ? 'following' : (activeTab === 'Global' ? 'global' : region)
    await refetch(criteria, effectiveRegion)
    setRefreshing(false)
  }

  // Define your current rank view if making it to the list
  const myRankIndex = entries.findIndex(e => e.user.username === user?.user_metadata?.username)
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : '-'
  const myEntry = myRankIndex >= 0 ? entries[myRankIndex] : null

  // Calculate a fake "progress to rank up" based on the person above you, or just a dummy percent if not ranked
  const targetWhp = myRankIndex > 0 ? entries[myRankIndex - 1].whp : (myEntry?.whp || 400)
  const myWhp = myEntry?.whp || 0
  const whpDiff = targetWhp - myWhp
  const progressPercent = targetWhp > 0 ? (myWhp / targetWhp) * 100 : 0

  if (loading && entries.length === 0) {
    return (
      <View style={S.center}>
        <ActivityIndicator color="#3ea8ff" size="large" />
      </View>
    )
  }

  return (
    <View style={S.root}>
      {/* ── Header ── */}
      <View style={[S.header, { zIndex: 10, elevation: 10 }]}>
        <TouchableOpacity style={S.headerIconBtn} onPress={() => router.back()} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[S.headerTitle, { flex: 1, textAlign: 'center', textTransform: 'uppercase' }]}>
          {region === 'global' ? 'Global Rankings' : region === 'na' ? 'North America' : region === 'eu' ? 'Europe' : 'Asia'}
        </Text>
        <TouchableOpacity style={S.headerIconBtn} onPress={() => setFiltersVisible(true)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <MaterialIcons name="tune" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* ── Hero Title ── */}
        <View style={S.heroSection}>
          <View style={S.heroIconWrap}>
            <MaterialIcons name="emoji-events" size={24} color="#3ea8ff" />
          </View>
          <Text style={S.heroTitle}>
            {region === 'global' ? 'Global Leaderboard' : region === 'na' ? 'NA Leaderboard' : region === 'eu' ? 'EU Leaderboard' : 'Asia Leaderboard'}
          </Text>
          <View style={S.heroSubRow}>
            <View style={S.heroDot} />
            <Text style={S.heroSubText}>{entries.length.toLocaleString()} Entries</Text>
          </View>
        </View>

        {/* ── Pill Tabs ── */}
        <View style={S.tabsRow}>
          {['Global', 'Regional', 'Following'].map((tab) => {
            const isActive = activeTab === tab
            return (
              <TouchableOpacity
                key={tab}
                style={[S.tabPill, isActive && S.tabPillActive]}
                onPress={() => setActiveTab(tab as any)}
                activeOpacity={0.8}
              >
                <Text style={[S.tabText, isActive && S.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* ── Table Headers ── */}
        <View style={S.tableHeaderRow}>
          <Text style={S.tableHeaderHash}>#</Text>
          <Text style={S.tableHeaderLabel}>DRIVER / BUILD</Text>
          <Text style={S.tableHeaderLabelRight}>
            {criteria === '060' ? '0-60 MPH' : criteria === '1/4' ? '1/4 MILE' : criteria === 'mods' ? 'MODS' : 'WHP'}
          </Text>
        </View>

        {/* ── List ── */}
        <View style={S.listWrap}>
          {error ? (
            <View style={S.errorBox}>
              <Text style={S.errorText}>{error}</Text>
            </View>
          ) : entries.length === 0 && !loading ? (
            <View style={S.empty}>
              <MaterialIcons name="emoji-events" size={48} color="#1c2e40" />
              <Text style={S.emptyTitle}>NO RECORDS YET</Text>
            </View>
          ) : (
            entries.map((item, index) => {
              const isMe = user?.user_metadata?.username === item.user.username
              return <LeaderboardCard key={item.id} item={item} rank={index + 1} isMe={isMe} criteria={criteria} />
            })
          )}
        </View>
      </ScrollView>

      <LeaderboardFiltersModal
        visible={filtersVisible} onClose={() => setFiltersVisible(false)}
        criteria={criteria} setCriteria={setCriteria}
        region={region} setRegion={setRegion}
      />
    </View>
  )
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a1520' },
  center: { flex: 1, backgroundColor: '#0a1520', justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(28,46,64,0.5)',
  },
  headerIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  heroSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  heroIconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(62,168,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  heroSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  heroSubText: { color: '#8ba3b8', fontSize: 13, fontWeight: '600' },

  tabsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    marginBottom: 32, paddingHorizontal: 20,
  },
  tabPill: {
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20,
    backgroundColor: 'rgba(28,46,64,0.6)', borderWidth: 1, borderColor: '#1c2e40',
  },
  tabPillActive: { backgroundColor: '#3ea8ff', borderColor: '#3ea8ff' },
  tabText: { color: '#8ba3b8', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#fff' },

  tableHeaderRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(28,46,64,0.3)',
    marginBottom: 16,
  },
  tableHeaderHash: { color: '#8ba3b8', fontSize: 11, fontWeight: '700', width: 40, textAlign: 'center' },
  tableHeaderLabel: { flex: 1, color: '#8ba3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1, paddingLeft: 12 },
  tableHeaderLabelRight: { color: '#8ba3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1, minWidth: 60, textAlign: 'right' },

  listWrap: { paddingHorizontal: 16 },

  empty: { paddingVertical: 80, alignItems: 'center', gap: 16 },
  emptyTitle: { color: '#4a6480', fontSize: 14, fontWeight: '800', letterSpacing: 2 },

  errorBox: { padding: 16, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#ef4444', fontSize: 12, textAlign: 'center' },

  footerWrap: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 84 : 64, left: 16, right: 16,
    backgroundColor: '#0d1f30', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1c2e40',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
  },
  footerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  footerTitle: { color: '#3ea8ff', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  footerBadge: { color: '#8ba3b8', fontSize: 10, fontWeight: '700' },

  footerMain: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  footerRankVal: { color: '#fff', fontSize: 20, fontWeight: '900', width: 36, textAlign: 'center', fontVariant: ['tabular-nums'] },
  footerInfo: { flex: 1, justifyContent: 'center' },
  footerUser: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  footerBuild: { color: '#8ba3b8', fontSize: 12, fontWeight: '600' },
  footerWhpBox: { alignItems: 'flex-end' },
  footerWhpVal: { color: '#3ea8ff', fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  footerWhpUnit: { color: '#4a6480', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: -4 },

  footerProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barTrack: { flex: 1, height: 4, backgroundColor: '#142536', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#3ea8ff', borderRadius: 2 },
  progressText: { color: '#8ba3b8', fontSize: 10, fontWeight: '600' },
})

const FM = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: {
    height: '92%', backgroundColor: '#0a1520',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: '#1c2e40', overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 24, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#1c2e40',
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  resetText: { color: '#3ea8ff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  scrollContent: { padding: 20, paddingBottom: 120 },

  section: { marginBottom: 32 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },

  // Ranking Criteria Cards
  cardRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d1f30',
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#1c2e40',
  },
  cardRowSelected: { backgroundColor: 'rgba(62,168,255,0.05)', borderColor: 'rgba(62,168,255,0.4)' },
  radioRing: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#4a6480',
    alignItems: 'center', justifyContent: 'center',
  },
  radioRingSelected: { borderColor: '#3ea8ff' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3ea8ff' },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  cardSub: { color: '#8ba3b8', fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Region Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: {
    width: '48%', backgroundColor: '#0d1f30', borderRadius: 16,
    padding: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1c2e40',
  },
  gridCardSelected: { backgroundColor: 'rgba(62,168,255,0.05)', borderColor: 'rgba(62,168,255,0.4)' },
  gridTitle: { color: '#8ba3b8', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  gridTitleSelected: { color: '#3ea8ff' },

  // Fixed Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#0a1520', borderTopWidth: 1, borderTopColor: '#1c2e40',
  },
  applyBtn: {
    flexDirection: 'row', backgroundColor: '#3ea8ff', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center', justifyContent: 'center',
  },
  applyText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
})
