import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Modal,
  Alert,
  Platform,
  Animated,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { useVehicles } from '../../hooks/useVehicles'
import { useAuth } from '../../hooks/useAuth'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import { useTierLimits } from '../../hooks/useTierLimits'
import { useSettings } from '../../hooks/useSettings'
import { api, DynoRecord, ModLog, Vehicle, UserProfile } from '../../lib/api'
import { formatTorqueValueOnly, getTorqueUnit } from '../../lib/units'
import { Avatar } from './profile'

const { width } = Dimensions.get('window')
const CHART_W = width - 48
const CHART_H = 160
const CARD_W = width - 64   // Carousel card width (32px padding to show adjacent cards)
const CARD_GAP = 12

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
      ])
    ).start()
  }, [])

  return (
    <Animated.View style={[
      styles.linkDot,
      { transform: [{ scale }], opacity }
    ]} />
  )
}

// ─── Precision Line Chart (Pure View Implementation) ─────────────────────────
const CHART_PAD_LEFT = 36  // Y轴标签宽度
const CHART_PAD_TOP = 12
const CHART_PAD_BTM = 18   // X轴标签预留空间

// X 轴日期格式：按 points 数量自动选择精简格式
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtXLabel(dateStr: string, totalPoints: number): string {
  const d = new Date(dateStr)
  if (totalPoints <= 6) return `${MONTHS[d.getMonth()]} ${d.getDate()}`  // 月+日
  return MONTHS[d.getMonth()]                                               // 仅月份
}

// 智能抽取 X 轴展示的索引（首/尾 + 均匀内部节点，总数不超过 4 个）
function pickXIndices(n: number): number[] {
  if (n <= 4) return Array.from({ length: n }, (_, i) => i)
  return [0, Math.round(n / 3), Math.round((2 * n) / 3), n - 1]
}

function PerfChart({ data, dates, currentWhp }: {
  data: number[]
  dates?: string[]
  currentWhp?: number
}) {
  if (data.length < 2) return null

  const [touchedIdx, setTouchedIdx] = useState<number | null>(null)

  const chartInnerW = CHART_W - CHART_PAD_LEFT
  const chartInnerH = CHART_H   // 纯绘图区高度，padding 单独计算

  // Y 轴取整到合适范围
  const rawMin = Math.min(...data)
  const rawMax = Math.max(...data)
  const yStep = rawMax <= 200 ? 50 : 100
  const yMin = Math.floor(rawMin / yStep) * yStep
  const yMax = Math.ceil(rawMax / yStep) * yStep + yStep
  const yRange = yMax - yMin || 1

  // Y 轴刻度
  const yTicks: number[] = []
  for (let v = yMin; v <= yMax; v += yStep) yTicks.push(v)

  const toX = (i: number) => CHART_PAD_LEFT + (i / (data.length - 1)) * chartInnerW
  const toY = (v: number) => CHART_PAD_TOP + chartInnerH - ((v - yMin) / yRange) * chartInnerH

  const points = data.map((v, i) => ({ x: toX(i), y: toY(v), v }))
  const lastPt = points[points.length - 1]

  const onTouch = (e: any) => {
    const x = e.nativeEvent.locationX - CHART_PAD_LEFT
    const idx = Math.round((x / chartInnerW) * (data.length - 1))
    if (idx >= 0 && idx < data.length) setTouchedIdx(idx)
  }

  return (
    <View
      style={{ height: CHART_PAD_TOP + CHART_H + CHART_PAD_BTM, width: CHART_W, position: 'relative' }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={onTouch}
      onResponderMove={onTouch}
      onResponderRelease={() => setTouchedIdx(null)}
    >
      {/* ── Y-Axis Grid Dashed Lines ── */}
      {yTicks.map(tick => {
        const ty = toY(tick)
        return (
          <View key={tick} style={{ position: 'absolute', left: CHART_PAD_LEFT, right: 0, top: ty }}>
            {Array.from({ length: Math.ceil(chartInnerW / 10) }).map((_, si) => (
              <View
                key={si}
                style={{
                  position: 'absolute',
                  left: si * 10,
                  width: 5,
                  height: 1,
                  backgroundColor: 'rgba(37,140,244,0.12)',
                }}
              />
            ))}
          </View>
        )
      })}

      {/* ── Y-Axis Labels ── */}
      {yTicks.map(tick => {
        const ty = toY(tick)
        return (
          <Text
            key={`lbl-${tick}`}
            style={{
              position: 'absolute',
              left: 0,
              top: ty - 7,
              width: CHART_PAD_LEFT - 6,
              textAlign: 'right',
              color: 'rgba(100,140,180,0.5)',
              fontSize: 9,
              fontWeight: '600',
            }}
          >
            {tick}
          </Text>
        )
      })}

      {/* ── Line Segments ── */}
      {points.slice(0, -1).map((p, i) => {
        const next = points[i + 1]
        const dx = next.x - p.x
        const dy = next.y - p.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y - 1,
              width: len + 1,
              height: 2,
              backgroundColor: '#3ea8ff',
              transformOrigin: 'left center',
              transform: [{ rotate: `${angle}deg` }],
              opacity: touchedIdx !== null && (touchedIdx === i || touchedIdx === i + 1) ? 1 : 0.6,
            }}
          />
        )
      })}

      {/* ── Data Points ── */}
      {points.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: p.x - 3,
            top: p.y - 3,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === data.length - 1 ? '#3ea8ff' : '#0a1520',
            borderWidth: 1.5,
            borderColor: '#3ea8ff',
            zIndex: 2,
            transform: [{ scale: touchedIdx === i ? 1.5 : 1 }],
          }}
        />
      ))}

      {/* ── Tooltip ── */}
      {(touchedIdx !== null || currentWhp !== undefined) && (() => {
        const idx = touchedIdx ?? data.length - 1
        const p = points[idx]
        const val = data[idx]
        const date = dates ? fmtXLabel(dates[idx], data.length) : ''

        return (
          <View
            style={{
              position: 'absolute',
              left: Math.min(Math.max(p.x - 50, 0), CHART_W - 100),
              top: Math.max(p.y - 50, 0),
              backgroundColor: 'rgba(8,20,34,0.95)',
              borderWidth: 1,
              borderColor: 'rgba(62,168,255,0.4)',
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 6,
              zIndex: 10,
              minWidth: 80,
            }}
          >
            <Text style={{ color: '#3ea8ff', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>
              {dates ? dates[idx].split('T')[0] : 'OUTPUT'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>
              {val} <Text style={{ fontSize: 9, color: '#64748b' }}>WHP</Text>
            </Text>
          </View>
        )
      })()}

      {/* ── X-Axis Time Labels ── */}
      {dates && dates.length >= 2 && (() => {
        const indices = pickXIndices(dates.length)
        return indices.map((idx, ii) => {
          const px = toX(idx)
          const label = fmtXLabel(dates[idx], dates.length)
          const isLast = idx === dates.length - 1
          const LABEL_W = 48
          let leftPos = px - LABEL_W / 2
          if (ii === 0) leftPos = px
          if (ii === indices.length - 1) leftPos = px - LABEL_W
          return (
            <Text
              key={idx}
              style={{
                position: 'absolute',
                left: leftPos,
                bottom: 0,
                width: LABEL_W,
                textAlign: ii === 0 ? 'left' : ii === indices.length - 1 ? 'right' : 'center',
                color: idx === touchedIdx ? '#3ea8ff' : 'rgba(100,140,180,0.5)',
                fontSize: 9,
                fontWeight: idx === touchedIdx || isLast ? '700' : '500',
              }}
            >
              {label}
            </Text>
          )
        })
      })()}
    </View>
  )
}


// ─── Time Formatting ─────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'today'
  if (d === 1) return '1d ago'
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

// ─── Log Entry Icons ─────────────────────────────────────────────────────────
const MOD_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  ecu: 'settings',
  intake: 'air',
  exhaust: 'waves',
  fuel: 'local-gas-station',
  turbo: 'flash-on',
  suspension: 'compress',
  brakes: 'brightness-1',
}
function modIcon(category: string): keyof typeof MaterialIcons.glyphMap {
  const key = category.toLowerCase()
  for (const k of Object.keys(MOD_ICONS)) {
    if (key.includes(k)) return MOD_ICONS[k]
  }
  return 'build'
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user, signOut } = useAuth()
  const { tier } = useTierLimits()
  const { imperialUnits } = useSettings()
  const { vehicles, loading: vehiclesLoading, refetch: refetchVehicles } = useVehicles()
  const { totalWhp, loading: statsLoading } = useDashboardStats()

  const [dynoRecords, setDynoRecords] = useState<DynoRecord[]>([])
  const [modLogs, setModLogs] = useState<ModLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [chartFilter, setChartFilter] = useState<'ALL' | '3M' | '1M'>('ALL')
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const drawerX = useRef(new Animated.Value(-DRAWER_W)).current
  const carouselRef = useRef<FlatList>(null)

  const openDrawer = () => {
    setMenuOpen(true)
    Animated.spring(drawerX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start()
  }
  const closeDrawer = () => {
    Animated.timing(drawerX, { toValue: -DRAWER_W, duration: 220, useNativeDriver: true }).start(() => setMenuOpen(false))
  }

  const activeVehicles = vehicles.filter(v => !v.is_archived)
  const selectedVehicle: Vehicle | undefined = activeVehicles[selectedVehicleIdx] ?? activeVehicles[0]

  useFocusEffect(
    useCallback(() => {
      refetchVehicles()
      api.profile.getMe().then(setProfile).catch(() => { })
    }, [])
  )

  useEffect(() => {
    // Unconditionally clear state so residual data doesn't persist when selecting 
    // an empty state or after deleting the last vehicle.
    setDynoRecords([])
    setModLogs([])

    if (!selectedVehicle) return

    const load = async () => {
      setLogsLoading(true)
      try {
        const [dynos, mods] = await Promise.all([
          api.dyno.list(selectedVehicle.id),
          api.mods.list(selectedVehicle.id),
        ])
        setDynoRecords(dynos.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()))
        setModLogs(mods)
      } catch { }
      setLogsLoading(false)
    }
    load()
  }, [selectedVehicle?.id])

  const loading = vehiclesLoading || statsLoading

  // Latest Dyno Data
  const latestDyno = dynoRecords.length > 0 ? dynoRecords[dynoRecords.length - 1] : null
  const prevDyno = dynoRecords.length > 1 ? dynoRecords[dynoRecords.length - 2] : null
  const whpGrowth = latestDyno && prevDyno && prevDyno.whp > 0
    ? Math.round(((latestDyno.whp - prevDyno.whp) / prevDyno.whp) * 100)
    : null
  const torqueGrowth = latestDyno && prevDyno && prevDyno.torque_nm && latestDyno.torque_nm
    ? Math.round(((latestDyno.torque_nm! - prevDyno.torque_nm!) / prevDyno.torque_nm!) * 100)
    : null

  // Chart Data (Filtered)
  const now = Date.now()
  const filteredRecords = dynoRecords.filter(r => {
    if (chartFilter === 'ALL') return true
    const months = chartFilter === '3M' ? 3 : 1
    return now - new Date(r.recorded_at).getTime() <= months * 30 * 24 * 60 * 60 * 1000
  })
  const chartData = filteredRecords.map(r => r.whp)
  const chartDates = filteredRecords.map(r => r.recorded_at)

  // Merge Logs (Dyno + Mod), Reverse Chronological
  type LogEntry = {
    id: string
    rawId: string
    logType: 'dyno' | 'mod'
    title: string
    sub: string
    time: string
    icon: keyof typeof MaterialIcons.glyphMap
    color: string
  }
  const logs: LogEntry[] = [
    ...dynoRecords.map((r, i) => ({
      id: `dyno-${r.id}`,
      rawId: r.id,
      logType: 'dyno' as const,
      title: `DYNO_RUN_${String(i + 1).padStart(2, '0')}`,
      sub: `${r.whp} whp${r.notes ? ` • ${r.notes}` : ''}`,
      time: timeAgo(r.recorded_at),
      icon: 'speed' as keyof typeof MaterialIcons.glyphMap,
      color: '#258cf4',
    })),
    ...modLogs.map(m => ({
      id: `mod-${m.id}`,
      rawId: m.id,
      logType: 'mod' as const,
      title: m.description.toUpperCase().replace(/\s+/g, '_').slice(0, 24),
      sub: m.category,
      time: timeAgo(m.installed_at),
      icon: modIcon(m.category),
      color: '#10b981',
    })),
  ]

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#258cf4" size="large" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={openDrawer}>
          <MaterialIcons name="menu" size={22} color="#64748b" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>DYNOSYNC</Text>
          <View style={styles.linkRow}>
            <PulseDot />
            <Text style={styles.linkText}>LINK ESTABLISHED</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Left Drawer ── */}
      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={closeDrawer}>
        {/* Dimmed overlay */}
        <TouchableOpacity style={MENU.overlay} activeOpacity={1} onPress={closeDrawer} />
        {/* Animated drawer panel */}
        <Animated.View style={[MENU.drawer, { transform: [{ translateX: drawerX }] }]}>
          {/* User avatar & info */}
          <View style={MENU.userSection}>
            <Avatar avatarUrl={profile?.avatar_url} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={MENU.userName}>
                {user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'User'}
              </Text>
              <Text style={MENU.userEmail}>{user?.email}</Text>
            </View>
            <TouchableOpacity onPress={closeDrawer} style={MENU.closeBtn}>
              <MaterialIcons name="close" size={20} color="#4a6480" />
            </TouchableOpacity>
          </View>

          <View style={MENU.divider} />

          <TouchableOpacity style={MENU.item} onPress={() => { closeDrawer(); router.push('/add-vehicle') }}>
            <View style={[MENU.iconBox, { backgroundColor: 'rgba(62,168,255,0.12)' }]}>
              <MaterialIcons name="directions-car" size={20} color="#3ea8ff" />
            </View>
            <View style={MENU.itemText}>
              <Text style={MENU.itemLabel}>Add Vehicle</Text>
              <Text style={MENU.itemSub}>Register a new build</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={MENU.item} onPress={() => { closeDrawer(); router.push('/(tabs)/garage') }}>
            <View style={[MENU.iconBox, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <MaterialIcons name="garage" size={20} color="#10b981" />
            </View>
            <View style={MENU.itemText}>
              <Text style={MENU.itemLabel}>My Garage</Text>
              <Text style={MENU.itemSub}>View all vehicles</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={MENU.item} onPress={() => { closeDrawer(); router.push('/settings') }}>
            <View style={[MENU.iconBox, { backgroundColor: 'rgba(100,116,139,0.12)' }]}>
              <MaterialIcons name="settings" size={20} color="#64748b" />
            </View>
            <View style={MENU.itemText}>
              <Text style={MENU.itemLabel}>Settings</Text>
              <Text style={MENU.itemSub}>App preferences</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={MENU.item} onPress={() => { closeDrawer(); setTimeout(() => router.push('/feedback'), 260) }}>
            <View style={[MENU.iconBox, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <MaterialIcons name="feedback" size={20} color="#10b981" />
            </View>
            <View style={MENU.itemText}>
              <Text style={MENU.itemLabel}>Send Feedback</Text>
              <Text style={MENU.itemSub}>Report bugs or suggestions</Text>
            </View>
          </TouchableOpacity>

          {tier === 'free' && (
            <TouchableOpacity style={MENU.item} onPress={() => { closeDrawer(); router.push('/subscription') }}>
              <View style={[MENU.iconBox, { backgroundColor: 'rgba(37,140,244,0.12)' }]}>
                <MaterialIcons name="star" size={20} color="#258cf4" />
              </View>
              <View style={MENU.itemText}>
                <Text style={[MENU.itemLabel, { color: '#258cf4' }]}>Upgrade to Pro</Text>
                <Text style={MENU.itemSub}>Unlock premium features</Text>
              </View>
            </TouchableOpacity>
          )}
          {tier === 'pro' && (
            <TouchableOpacity style={MENU.item} onPress={() => { closeDrawer(); router.push('/subscription') }}>
              <View style={[MENU.iconBox, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                <MaterialIcons name="star" size={20} color="#f59e0b" />
              </View>
              <View style={MENU.itemText}>
                <Text style={[MENU.itemLabel, { color: '#f59e0b' }]}>Pro Member</Text>
                <Text style={MENU.itemSub}>Manage subscription</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={MENU.item} onPress={() => { closeDrawer(); router.push('/(tabs)/profile') }}>
            <View style={[MENU.iconBox, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
              <MaterialIcons name="person" size={20} color="#8b5cf6" />
            </View>
            <View style={MENU.itemText}>
              <Text style={MENU.itemLabel}>Profile</Text>
              <Text style={MENU.itemSub}>Account & subscription</Text>
            </View>
          </TouchableOpacity>

          <View style={MENU.divider} />

          <TouchableOpacity style={MENU.item} onPress={() => {
            closeDrawer()
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out', style: 'destructive', onPress: async () => {
                  await signOut()
                  router.replace('/(auth)/login')
                }
              },
            ])
          }}>
            <View style={[MENU.iconBox, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <MaterialIcons name="logout" size={20} color="#ef4444" />
            </View>
            <View style={MENU.itemText}>
              <Text style={[MENU.itemLabel, { color: '#ef4444' }]}>Sign Out</Text>
              <Text style={MENU.itemSub}>Log out of your account</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      {/* ── Vehicle Carousel ── */}
      {activeVehicles.length === 0 ? (
        <TouchableOpacity style={styles.heroCardEmpty} onPress={() => router.push('/add-vehicle')}>
          <MaterialIcons name="add-circle-outline" size={32} color="#258cf4" />
          <Text style={styles.heroEmptyText}>ADD YOUR FIRST VEHICLE</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ marginBottom: 0 }}>
          <FlatList
            ref={carouselRef}
            data={activeVehicles}
            horizontal
            keyExtractor={v => v.id}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + CARD_GAP}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: (width - CARD_W) / 2,
              gap: CARD_GAP,
            }}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + CARD_GAP))
              setSelectedVehicleIdx(Math.max(0, Math.min(idx, activeVehicles.length - 1)))
              setChartFilter('ALL')
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.heroCard, { width: CARD_W }]}
                activeOpacity={0.9}
                onPress={() => router.push(`/vehicle/${item.id}`)}
              >
                <View style={styles.heroBg} />
                <View style={styles.heroSilhouette}>
                  <MaterialIcons name="directions-car" size={160} color="rgba(37,140,244,0.03)" />
                </View>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />

                <View style={styles.heroBadgeRow}>
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>ACTIVE MAP</Text>
                  </View>
                  {item.id === selectedVehicle?.id && latestDyno && (
                    <View style={[styles.heroBadge, { backgroundColor: 'rgba(37,140,244,0.15)', borderColor: '#258cf4' }]}>
                      <Text style={[styles.heroBadgeText, { color: '#258cf4' }]}>{latestDyno.whp} WHP</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.heroVehicleName}>
                  {item.year} {item.make.toUpperCase()} {item.model.toUpperCase()}
                </Text>
                <Text style={styles.heroVehicleSub}>
                  {item.drivetrain ?? 'N/A'}{item.trim ? ` | ${item.trim.toUpperCase()}` : ''}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Pagination Dots */}
          {activeVehicles.length > 1 && (
            <View style={styles.paginationRow}>
              {activeVehicles.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.paginationDot,
                    i === selectedVehicleIdx && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Quick Entry Anchors */}
          {selectedVehicle && (
            <View style={styles.quickEntryBar}>
              <TouchableOpacity
                style={styles.quickEntryBtn}
                onPress={() => router.push(`/add-dyno?vehicleId=${selectedVehicle.id}`)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="speed" size={15} color="#258cf4" />
                <Text style={styles.quickEntryText}>Log Dyno</Text>
              </TouchableOpacity>
              <View style={styles.quickEntryDivider} />
              <TouchableOpacity
                style={styles.quickEntryBtn}
                onPress={() => router.push(`/add-mod?vehicleId=${selectedVehicle.id}`)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="build" size={15} color="#10b981" />
                <Text style={[styles.quickEntryText, { color: '#10b981' }]}>Log Mod</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── WHP / Torque Metrics ── */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>WHP</Text>
            <MaterialIcons name="flash-on" size={16} color="#258cf4" />
          </View>
          <Text style={styles.metricValue}>{latestDyno ? latestDyno.whp : logsLoading ? '…' : '—'}</Text>
          {whpGrowth !== null && (
            <View style={styles.metricGrowth}>
              <MaterialIcons name={whpGrowth >= 0 ? 'arrow-upward' : 'arrow-downward'} size={12} color={whpGrowth >= 0 ? '#10b981' : '#ef4444'} />
              <Text style={[styles.metricGrowthText, { color: whpGrowth >= 0 ? '#10b981' : '#ef4444' }]}>
                {Math.abs(whpGrowth)}%
              </Text>
            </View>
          )}
          <View style={styles.metricBar}>
            <View style={[styles.metricBarFill, { width: latestDyno ? `${Math.min((latestDyno.whp / 600) * 100, 100)}%` : '0%' }]} />
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>TORQUE ({getTorqueUnit(imperialUnits)})</Text>
            <MaterialIcons name="speed" size={16} color="#258cf4" />
          </View>
          <Text style={styles.metricValue}>{formatTorqueValueOnly(latestDyno?.torque_nm, imperialUnits)}</Text>
          {torqueGrowth !== null && (
            <View style={styles.metricGrowth}>
              <MaterialIcons name={torqueGrowth >= 0 ? 'arrow-upward' : 'arrow-downward'} size={12} color={torqueGrowth >= 0 ? '#10b981' : '#ef4444'} />
              <Text style={[styles.metricGrowthText, { color: torqueGrowth >= 0 ? '#10b981' : '#ef4444' }]}>
                {Math.abs(torqueGrowth)}%
              </Text>
            </View>
          )}
          <View style={styles.metricBar}>
            <View style={[styles.metricBarFill, { width: latestDyno?.torque_nm ? `${Math.min((latestDyno.torque_nm / 800) * 100, 100)}%` : '0%' }]} />
          </View>
        </View>
      </View>

      {/* ── Perf Growth Chart ── */}
      {chartData.length >= 2 && (
        <View style={styles.chartSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>PERF. GROWTH</Text>
            <View style={styles.chartFilters}>
              {(['ALL', '3M', '1M'] as const).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, f === chartFilter && styles.filterChipActive]}
                  onPress={() => setChartFilter(f)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterText, f === chartFilter && styles.filterTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.chartArea}>
            <PerfChart data={chartData} dates={chartDates} currentWhp={latestDyno?.whp} />
          </View>
        </View>
      )}

      {/* ── Logs ── */}
      <View style={styles.logsSection}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>LOGS</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/garage')}>
            <Text style={styles.viewAll}>VIEW ALL {'>'}</Text>
          </TouchableOpacity>
        </View>

        {logsLoading ? (
          <ActivityIndicator color="#258cf4" style={{ marginTop: 16 }} />
        ) : logs.length === 0 ? (
          <View style={styles.emptyLogs}>
            <MaterialIcons name="receipt-long" size={24} color="#314d68" />
            <Text style={styles.emptyLogsText}>No activity yet</Text>
          </View>
        ) : (
          logs.slice(0, 4).map(entry => (
            <TouchableOpacity
              key={entry.id}
              style={styles.logItem}
              activeOpacity={0.75}
              onPress={() =>
                selectedVehicle &&
                router.push(
                  `/log-detail?vehicleId=${selectedVehicle.id}&logId=${entry.rawId}&type=${entry.logType}`
                )
              }
            >
              <View style={[styles.logIcon, { borderColor: entry.color + '40', backgroundColor: entry.color + '15' }]}>
                <MaterialIcons name={entry.icon} size={18} color={entry.color} />
              </View>
              <View style={styles.logBody}>
                <Text style={styles.logTitle}>{entry.title}</Text>
                <Text style={styles.logSub}>{entry.sub}</Text>
              </View>
              <View style={styles.logRight}>
                <Text style={styles.logTime}>{entry.time}</Text>
                <MaterialIcons name="chevron-right" size={16} color="#314d68" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0a1520',
  card: '#111d2b',
  border: '#1c2e40',
  blue: '#258cf4',
  green: '#10b981',
  dim: '#3d5470',
  muted: '#4a6480',
  text: '#ffffff',
  sub: '#64748b',
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: 110 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.card,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 4,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  linkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  linkText: { color: C.green, fontSize: 9, fontWeight: '700', letterSpacing: 2 },

  // Hero Card
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 20,
    minHeight: 140,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.blue + '50',
    justifyContent: 'flex-end',
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d1e30',
  },
  heroSilhouette: {
    position: 'absolute',
    right: -20,
    bottom: -10,
    transform: [{ rotate: '-10deg' }],
  },
  // HUD 角线装饰
  corner: { position: 'absolute', width: 14, height: 14, borderColor: C.blue },
  cornerTL: { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2 },

  heroBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  heroBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: '#10b98150',
  },
  heroBadgeText: { color: C.green, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  heroVehicleName: {
    color: C.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroVehicleSub: { color: C.muted, fontSize: 11, letterSpacing: 2, fontWeight: '600' },

  heroCardEmpty: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 32,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card,
  },
  heroEmptyText: { color: C.blue, fontSize: 12, fontWeight: '700', letterSpacing: 2 },

  // Metrics
  metricsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 20 },
  metricCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  metricLabel: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  metricValue: { color: C.text, fontSize: 32, fontWeight: '900', marginBottom: 4 },
  metricGrowth: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 10 },
  metricGrowthText: { fontSize: 11, fontWeight: '700' },
  metricBar: { height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  metricBarFill: { height: '100%', backgroundColor: C.blue, borderRadius: 2 },

  // Chart
  chartSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#0d1e30',
    borderRadius: 12,
    padding: 16,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  chartArea: { marginTop: 8, position: 'relative' },

  // Section shared
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionAccent: { width: 3, height: 16, borderRadius: 2, backgroundColor: C.blue },
  sectionTitle: { color: C.text, fontSize: 13, fontWeight: '800', letterSpacing: 2, flex: 1 },

  // Chart filters
  chartFilters: { flexDirection: 'row', gap: 6 },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.blue + '20', borderColor: C.blue },
  filterText: { color: C.muted, fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: C.blue },

  // Logs
  logsSection: { paddingHorizontal: 16, marginBottom: 20 },
  viewAll: { color: C.blue, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  logIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logBody: { flex: 1 },
  logTitle: { color: C.text, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  logSub: { color: C.muted, fontSize: 11, fontFamily: 'monospace' },
  logRight: { alignItems: 'flex-end', gap: 4 },
  logTime: { color: C.dim, fontSize: 10, fontWeight: '600' },

  emptyLogs: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyLogsText: { color: C.muted, fontSize: 12, fontWeight: '600' },

  // Carousel 分页点
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.muted,
  },
  paginationDotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.blue,
  },

  // 快速录入锚点
  quickEntryBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 16,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  quickEntryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  quickEntryText: {
    color: C.blue,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  quickEntryDivider: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: 8,
  },
})

// ─── Hamburger left drawer styles ──────────────────────────────────────────────
const { height: SCREEN_H } = Dimensions.get('window')
const DRAWER_W = width * 0.75 // 75% screen width

const MENU = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    width: DRAWER_W,
    backgroundColor: '#0a1520',
    borderRightWidth: 1, borderRightColor: '#1c2e40',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
  },
  userSection: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 20, paddingHorizontal: 4,
  },
  userName: {
    color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2,
  },
  userEmail: {
    color: '#4a6480', fontSize: 12,
  },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 32, paddingHorizontal: 4,
  },
  drawerLogo: {
    color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 3,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#0d1f30',
    alignItems: 'center', justifyContent: 'center',
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 4,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  itemText: { flex: 1 },
  itemLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  itemSub: { color: '#4a6480', fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#1c2e40', marginVertical: 12 },
})


