import { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { api, DynoRecord, ModLog, Vehicle } from '../lib/api'
import { useVehicles } from '../hooks/useVehicles'

// --- Color System (Consistent with Dash/Log Detail) ---
const C = {
    bg: '#0a1520',
    card: '#0d1f30',
    border: '#1c2e40',
    blue: '#258cf4',
    green: '#10b981',
    text: '#ffffff',
    sub: '#4a6480',
    dim: '#162333',
}

type TimelineEntry = {
    id: string
    rawId: string
    type: 'dyno' | 'mod'
    title: string
    sub: string
    date: string
    icon: keyof typeof MaterialIcons.glyphMap
    color: string
}

const MOD_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
    ecu: 'settings',
    intake: 'air',
    exhaust: 'waves',
    fuel: 'local-gas-station',
    turbo: 'flash-on',
    suspension: 'compress',
    brakes: 'brightness-1',
}

function getModIcon(category: string): keyof typeof MaterialIcons.glyphMap {
    const key = category.toLowerCase()
    for (const k of Object.keys(MOD_ICONS)) {
        if (key.includes(k)) return MOD_ICONS[k]
    }
    return 'build'
}

export default function BuildTimelineScreen() {
    const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>()
    const { vehicles } = useVehicles()
    const vehicle: Vehicle | undefined = vehicles.find((v: Vehicle) => v.id === vehicleId)

    const [items, setItems] = useState<TimelineEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (vehicleId) loadData()
    }, [vehicleId])

    const loadData = async () => {
        try {
            setLoading(true)
            const [dynos, mods] = await Promise.all([
                api.dyno.list(vehicleId),
                api.mods.list(vehicleId),
            ])

            const merged: TimelineEntry[] = [
                ...dynos.map((r: DynoRecord, i: number) => ({
                    id: `dyno-${r.id}`,
                    rawId: r.id,
                    type: 'dyno' as const,
                    title: `DYNO SESSION`,
                    sub: `${r.whp} WHP ${r.notes ? `• ${r.notes}` : ''}`,
                    date: r.recorded_at,
                    icon: 'speed' as const,
                    color: C.blue,
                })),
                ...mods.map((m: ModLog) => ({
                    id: `mod-${m.id}`,
                    rawId: m.id,
                    type: 'mod' as const,
                    title: m.description.toUpperCase(),
                    sub: m.category,
                    date: m.installed_at,
                    icon: getModIcon(m.category),
                    color: C.green,
                })),
            ]

            // Sort newest first
            merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            setItems(merged)
        } catch (e) {
            console.error('Failed to load timeline:', e)
        } finally {
            setLoading(false)
        }
    }

    const renderItem = ({ item }: { item: TimelineEntry }) => {
        const d = new Date(item.date)
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

        return (
            <View style={S.itemRow}>
                <View style={S.timelineMarker}>
                    <View style={[S.dot, { backgroundColor: item.color }]} />
                    <View style={S.line} />
                </View>

                <TouchableOpacity
                    style={S.card}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/log-detail?vehicleId=${vehicleId}&logId=${item.rawId}&type=${item.type}`)}
                >
                    <View style={S.cardHeader}>
                        <View style={[S.iconBox, { backgroundColor: item.color + '15' }]}>
                            <MaterialIcons name={item.icon} size={20} color={item.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={S.itemTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={S.itemDate}>{dateStr}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={C.sub} />
                    </View>
                    <Text style={S.itemSub} numberOfLines={2}>{item.sub}</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={S.root}>
            {/* Header */}
            <View style={S.header}>
                <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={20} color={C.text} />
                </TouchableOpacity>
                <View style={S.headerCenter}>
                    <Text style={S.headerTitle}>BUILD TIMELINE</Text>
                    <Text style={S.headerSub}>
                        {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toUpperCase() : 'LOADING...'}
                    </Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={S.center}><ActivityIndicator color={C.blue} /></View>
            ) : items.length === 0 ? (
                <View style={S.center}>
                    <MaterialIcons name="history" size={64} color={C.dim} />
                    <Text style={S.emptyTitle}>NO HISTORY YET</Text>
                    <Text style={S.emptySub}>Start logging your build details to see the timeline.</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={S.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    )
}

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: C.bg,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: C.dim,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { color: C.text, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
    headerSub: { color: C.blue, fontSize: 10, fontWeight: '700', marginTop: 4 },

    listContent: { padding: 20, paddingTop: 30 },
    itemRow: { flexDirection: 'row', minHeight: 110 },
    timelineMarker: { alignItems: 'center', width: 24, marginRight: 16 },
    dot: { width: 12, height: 12, borderRadius: 6, zIndex: 2, borderWidth: 2, borderColor: C.bg },
    line: { flex: 1, width: 2, backgroundColor: C.dim, marginTop: -4 },

    card: {
        flex: 1,
        backgroundColor: C.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: C.border,
        justifyContent: 'center'
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    itemTitle: { color: C.text, fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
    itemDate: { color: C.sub, fontSize: 10, fontWeight: '600', marginTop: 2 },
    itemSub: { color: '#8ba3b8', fontSize: 13, lineHeight: 18 },

    emptyTitle: { color: C.text, fontSize: 16, fontWeight: '800', marginTop: 20, letterSpacing: 1 },
    emptySub: { color: C.sub, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
})
