import { useState, useEffect } from 'react'
import {
    View, Text, FlatList, Image, ScrollView,
    StyleSheet, ActivityIndicator, Platform,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { api, Vehicle, DynoRecord, ModLog } from '../../../lib/api'
import { BeforeAfterCard } from '../../../components/BeforeAfterCard'

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
function DynoCard({ record, prev }: { record: DynoRecord; prev?: DynoRecord }) {
    const delta = prev ? record.whp - prev.whp : null
    const deltaPct = delta !== null && prev ? (delta / prev.whp) * 100 : null
    const isBaseline = record.notes === 'Stock baseline'

    return (
        <View style={DC.card}>
            <View style={DC.left}>
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
                <View style={DC.subRow}>
                    {record.torque_nm != null && <Text style={DC.subText}>{record.torque_nm} LB-FT</Text>}
                    {record.zero_to_sixty != null && <Text style={DC.subText}>{record.zero_to_sixty}s 0-60</Text>}
                </View>
                {record.notes && !isBaseline && <Text style={DC.notes} numberOfLines={1}>{record.notes}</Text>}
            </View>
            <View style={DC.right}>
                <Text style={DC.date}>{new Date(record.recorded_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</Text>
                <Text style={DC.dateYear}>{new Date(record.recorded_at).getFullYear()}</Text>
            </View>
        </View>
    )
}

const DC = StyleSheet.create({
    card: { flexDirection: 'row', backgroundColor: '#0d1f30', borderRadius: 12, borderWidth: 1, borderColor: '#1c2e40', padding: 14, marginBottom: 12 },
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
    right: { alignItems: 'flex-end', justifyContent: 'center' },
    date: { color: '#4a6480', fontSize: 13, fontWeight: '600' },
    dateYear: { color: '#2a3f55', fontSize: 11 },
})

// ─── Mod 记录卡 ───────────────────────────────────────────────────────────────
function ModCard({ log }: { log: ModLog }) {
    const color = CAT_COLOR[log.category] ?? '#64748b'
    const icon = CAT_ICON[log.category] ?? 'build'

    return (
        <View style={[MC.card, { borderLeftColor: color }]}>
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
        </View>
    )
}

const MC = StyleSheet.create({
    card: { flexDirection: 'row', backgroundColor: '#0d1f30', borderRadius: 12, borderWidth: 1, borderColor: '#1c2e40', borderLeftWidth: 3, overflow: 'hidden', marginBottom: 12 },
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
export default function PublicVehicleDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const [activeTab, setActiveTab] = useState<Tab>('dyno')

    const [vehicle, setVehicle] = useState<Vehicle & { dyno_records: DynoRecord[], mod_logs: ModLog[], users: { username: string } } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        api.public.getVehicle(id)
            .then((data: any) => setVehicle(data))
            .catch((e) => setError(e.message || 'Failed to load public profile'))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return (
        <View style={S.center}>
            <ActivityIndicator color="#3ea8ff" size="large" />
        </View>
    )

    if (error || !vehicle) return (
        <View style={S.center}>
            <MaterialIcons name="error-outline" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
            <Text style={{ color: '#fff', fontSize: 16 }}>{error || 'Vehicle not found'}</Text>
        </View>
    )

    const dynoRecords: DynoRecord[] = vehicle.dyno_records || []
    const modLogs: ModLog[] = vehicle.mod_logs || []

    // Sort dyno records descending
    const sortedDyno = [...dynoRecords].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    // Sort mod logs descending
    const sortedMods = [...modLogs].sort((a, b) => new Date(b.installed_at).getTime() - new Date(a.installed_at).getTime())

    const latestWhp = sortedDyno[0]?.whp
    const totalCost = sortedMods.reduce((sum, l) => sum + (l.cost ?? 0), 0)

    return (
        <View style={S.root}>
            {/* ── Header ── */}
            <View style={S.header}>
                <View style={{ flex: 1 }}>
                    <Text style={S.headerUserTitle}>BUILT BY: {vehicle.users?.username ?? 'Anonymous'}</Text>
                    <Text style={S.headerTitle} numberOfLines={1}>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                    </Text>
                </View>
                <View style={S.publicBadge}>
                    <MaterialIcons name="public" size={12} color="#4a6480" />
                    <Text style={S.publicBadgeText}>PUBLIC VIEW</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                {/* ── Vehicle Photo ── */}
                {vehicle.image_url && (
                    <View style={S.coverPhotoContainer}>
                        <Image source={{ uri: vehicle.image_url }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
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
                        <Text style={S.heroValue}>{dynoRecords.length}</Text>
                        <Text style={S.heroLabel}>DYNOS</Text>
                    </View>
                    <View style={S.heroDivider} />
                    <View style={S.heroStat}>
                        <Text style={S.heroValue}>{modLogs.length}</Text>
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

                {/* ── Tabs ── */}
                <View style={S.tabs}>
                    <Text style={S.sectionTitle}>BUILD HISTORY</Text>
                </View>

                {/* ── Content ── */}
                <View style={{ paddingHorizontal: 16 }}>
                    {sortedDyno.length >= 2 && (
                        <BeforeAfterCard records={sortedDyno} />
                    )}

                    {sortedDyno.length > 0 && (
                        <Text style={S.listTitle}>DYNO RUNS</Text>
                    )}
                    {sortedDyno.map((item, index) => (
                        <DynoCard key={item.id} record={item} prev={sortedDyno[index + 1]} />
                    ))}

                    {sortedMods.length > 0 && (
                        <Text style={[S.listTitle, { marginTop: 16 }]}>MODIFICATIONS</Text>
                    )}
                    {sortedMods.map(item => (
                        <ModCard key={item.id} log={item} />
                    ))}
                </View>
            </ScrollView>

            {/* Promobanner for web acquisition */}
            <View style={S.promoFooter}>
                <MaterialIcons name="speed" size={16} color="#3ea8ff" />
                <Text style={S.promoText}>Powered by DynoSync</Text>
            </View>
        </View>
    )
}

const C = { bg: '#0a1520', border: '#1c2e40', blue: '#3ea8ff', muted: '#4a6480', text: '#fff' }

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    headerUserTitle: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
    headerTitle: { color: C.text, fontSize: 18, fontWeight: '900' },
    publicBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
    publicBadgeText: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },

    coverPhotoContainer: {
        height: 200, width: '100%', position: 'relative',
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    coverPhotoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 21, 32, 0.4)',
    },

    heroRow: {
        flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 12,
        borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: 'rgba(28,46,64,0.3)',
    },
    heroStat: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    heroValue: { color: C.text, fontSize: 24, fontWeight: '900', marginBottom: 2 },
    heroLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
    heroDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },

    tabs: { padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 16 },
    sectionTitle: { color: C.blue, fontSize: 14, fontWeight: '800', letterSpacing: 2 },

    listTitle: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },

    promoFooter: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#0d1f30', borderTopWidth: 1, borderTopColor: C.border,
        padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
    },
    promoText: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1 }
})
