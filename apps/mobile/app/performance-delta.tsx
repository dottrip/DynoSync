import { useState, useEffect } from 'react'
import {
    View, Text, TouchableOpacity, ScrollView, Image,
    StyleSheet, ActivityIndicator, Alert, Share, Platform, Dimensions,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Circle, Line, Text as SvgText } from 'react-native-svg'
import { useVehicles } from '../hooks/useVehicles'
import { useDynoRecords } from '../hooks/useDynoRecords'
import { useSettings } from '../hooks/useSettings'
import { useModLogs } from '../hooks/useModLogs'
import { getTorqueUnit } from '../lib/units'
import { DynoRecord, ModLog } from '../lib/api'

const { width: SCREEN_W } = Dimensions.get('window')
// 32px = page padding (16 each side), 24px = chartBox padding (12 each side)
const CHART_W = SCREEN_W - 32 - 24
const CHART_H = 180

function DynoCurve({ whp, maxWhp, color, dashed = false }: { whp: number; maxWhp: number; color: string; dashed?: boolean }) {
    const points: { x: number; y: number }[] = []
    const rpmSteps = 8
    for (let i = 0; i < rpmSteps; i++) {
        const t = i / (rpmSteps - 1)
        let normalized: number
        if (t < 0.6) {
            normalized = Math.pow(t / 0.6, 0.5) * 0.85
        } else {
            normalized = 0.85 + 0.15 * (1 - (t - 0.6) / 0.4)
        }
        const x = t * CHART_W
        // Normalize y against shared maxWhp so lower-WHP curve appears shorter
        const yVal = normalized * whp
        const y = CHART_H - (yVal / maxWhp) * (CHART_H * 0.8) - CHART_H * 0.05
        points.push({ x, y })
    }

    const pathD = points.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`
        const prev = points[i - 1]
        const cp1x = prev.x + (p.x - prev.x) * 0.5
        const cp2y = p.y
        return `${acc} C ${cp1x} ${prev.y}, ${cp1x} ${cp2y}, ${p.x} ${p.y}`
    }, '')

    const fillD = `${pathD} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`

    return (
        <>
            {!dashed && <Path d={fillD} fill={color + '16'} />}
            <Path
                d={pathD}
                stroke={color}
                strokeWidth={dashed ? 1.8 : 2.5}
                fill="none"
                strokeDasharray={dashed ? '6 4' : undefined}
            />
        </>
    )
}

// ─── 指标格子 ──────────────────────────────────────────────────────────────────
function StatCell({
    label, icon, iconColor, current, baseline, unit, invertDelta, accent
}: {
    label: string; icon: string; iconColor: string
    current: number | null | undefined; baseline: number | null | undefined
    unit: string; invertDelta?: boolean; accent?: string
}) {
    if (current == null || baseline == null) return null
    const delta = current - baseline
    const isPositive = invertDelta ? delta <= 0 : delta >= 0
    const color = isPositive ? '#10b981' : '#ef4444'
    const prefix = delta > 0 ? '+' : ''
    return (
        <View style={ST.cell}>
            <View style={ST.cellTop}>
                <Text style={ST.cellLabel}>{label}</Text>
                <MaterialIcons name={icon as any} size={16} color={iconColor} />
            </View>
            <Text style={ST.cellValue}>{current}<Text style={ST.cellUnit}> {unit}</Text></Text>
            <View style={[ST.badge, { backgroundColor: (accent || color) + '18' }]}>
                {/* Arrow reflects VALUE direction (down = decreased), color reflects improvement */}
                <MaterialIcons name={delta < 0 ? 'arrow-downward' : 'arrow-upward'} size={10} color={accent || color} />
                <Text style={[ST.badgeText, { color: accent || color }]}>{prefix}{Math.abs(delta).toFixed(1)} {unit}</Text>
            </View>
            <Text style={ST.stock}>Stock: {baseline} {unit}</Text>
        </View>
    )
}

const ST = StyleSheet.create({
    cell: {
        flex: 1, backgroundColor: '#0d1f30', borderRadius: 12,
        borderWidth: 1, borderColor: '#1c2e40', padding: 14,
    },
    cellTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    cellLabel: { color: '#4a6480', fontSize: 11, fontWeight: '700' },
    cellValue: { color: '#fff', fontSize: 28, fontWeight: '900' },
    cellUnit: { fontSize: 13, fontWeight: '600', color: '#aac4de' },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 2,
        alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2,
        marginTop: 4, marginBottom: 2,
    },
    badgeText: { fontSize: 11, fontWeight: '800' },
    stock: { color: '#3d5470', fontSize: 11 },
})

// ─── Mod 行 ──────────────────────────────────────────────────────────────────
function ModRow({ log }: { log: ModLog }) {
    const CAT_ICON: Record<string, string> = {
        engine: 'settings', exhaust: 'waves', intake: 'air',
        suspension: 'airline-seat-flat', brakes: 'stop-circle', wheels: 'radio-button-unchecked',
        aero: 'flight', interior: 'weekend', electronics: 'memory', other: 'build',
    }
    const icon = CAT_ICON[log.category] ?? 'build'
    return (
        <View style={MOD.row}>
            <View style={MOD.iconCircle}>
                <MaterialIcons name={icon as any} size={18} color="#4a6480" />
            </View>
            <View style={MOD.body}>
                <Text style={MOD.name} numberOfLines={1}>{log.description.split(' ').slice(0, 4).join(' ')}</Text>
                <Text style={MOD.sub}>{log.category.charAt(0).toUpperCase() + log.category.slice(1)}</Text>
            </View>
            {log.cost != null && (
                <Text style={MOD.cost}>+${log.cost}</Text>
            )}
        </View>
    )
}

const MOD = StyleSheet.create({
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#0d1f30', borderRadius: 10, borderWidth: 1,
        borderColor: '#1c2e40', padding: 12, marginBottom: 8,
    },
    iconCircle: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#1c2e40', alignItems: 'center', justifyContent: 'center',
    },
    body: { flex: 1 },
    name: { color: '#fff', fontSize: 14, fontWeight: '600' },
    sub: { color: '#4a6480', fontSize: 11 },
    cost: { color: '#10b981', fontSize: 13, fontWeight: '800' },
})

// ─── Main Screen ──────────────────────────────────────────────────────────────
type Tab = 'before' | 'after'

export default function PerformanceDeltaScreen() {
    const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>()
    const { imperialUnits } = useSettings()
    const { vehicles } = useVehicles()
    const { records } = useDynoRecords(vehicleId)
    const { logs } = useModLogs(vehicleId)
    const [activeTab, setActiveTab] = useState<Tab>('after')

    const vehicle = vehicles.find(v => v.id === vehicleId)

    const sorted = [...records].sort((a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )
    const baseline = sorted[0]
    const current = sorted[sorted.length - 1]

    const displayed = activeTab === 'before' ? baseline : current
    const hasData = baseline && current && sorted.length >= 2

    const handleShare = async () => {
        if (!vehicle || !hasData) return
        try {
            await Share.share({
                message: `🚗 ${vehicle.year} ${vehicle.make} ${vehicle.model} — Before: ${baseline.whp} WHP → After: ${current.whp} WHP (+${current.whp - baseline.whp} WHP gain!) via DynoSync`,
                title: 'My Performance Delta',
            })
        } catch { }
    }

    if (!vehicle) {
        return (
            <View style={S.center}>
                <ActivityIndicator color="#3ea8ff" />
            </View>
        )
    }

    if (!hasData) {
        return (
            <View style={S.center}>
                <MaterialIcons name="bar-chart" size={48} color="#1c2e40" />
                <Text style={{ color: '#4a6480', marginTop: 12, fontSize: 14 }}>Need ≥ 2 dyno runs to compare.</Text>
            </View>
        )
    }

    const whpDelta = current.whp - baseline.whp
    const isImproved = whpDelta >= 0

    return (
        <View style={S.root}>
            {/* ── Header ── */}
            <View style={S.header}>
                <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={22} color="#3ea8ff" />
                </TouchableOpacity>
                <Text style={S.headerTitle}>Performance Delta</Text>
                <TouchableOpacity style={S.shareBtn} onPress={handleShare}>
                    <MaterialIcons name="ios-share" size={20} color="#3ea8ff" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>
                {/* ── Vehicle Info ── */}
                <View style={S.vehicleRow}>
                    {vehicle.image_url ? (
                        <Image source={{ uri: vehicle.image_url }} style={S.vehicleThumb} />
                    ) : (
                        <View style={[S.vehicleThumb, { backgroundColor: '#1c2e40', alignItems: 'center', justifyContent: 'center' }]}>
                            <MaterialIcons name="directions-car" size={20} color="#4a6480" />
                        </View>
                    )}
                    <View style={S.vehicleInfo}>
                        <Text style={S.vehicleName}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
                        <View style={S.badges}>
                            {vehicle.trim && (
                                <View style={S.badge}>
                                    <Text style={S.badgeText}>{vehicle.trim}</Text>
                                </View>
                            )}
                            {vehicle.drivetrain && (
                                <View style={S.badge}>
                                    <Text style={S.badgeText}>{vehicle.drivetrain.toUpperCase()}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* ── Before / After Tabs ── */}
                <View style={S.tabs}>
                    {(['before', 'after'] as Tab[]).map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[S.tab, activeTab === t && S.tabActive]}
                            onPress={() => setActiveTab(t)}
                        >
                            <Text style={[S.tabText, activeTab === t && S.tabTextActive]}>
                                {t === 'before' ? 'Before (Stock)' : `After (${current.notes?.split(' ').slice(0, 3).join(' ') || vehicle.trim || 'Stage 2+'})`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Dyno Curve Chart ── */}
                <View style={S.chartBox}>
                    <Text style={S.chartLabel}>POWER / TORQUE</Text>
                    <Svg width={CHART_W} height={CHART_H}>
                        {/* Grid lines */}
                        {[0.25, 0.5, 0.75, 1].map((frac) => (
                            <Line
                                key={frac}
                                x1={0} y1={frac * CHART_H}
                                x2={CHART_W} y2={frac * CHART_H}
                                stroke="#1c2e40" strokeWidth={1}
                            />
                        ))}

                        {/* Baseline (Stock) — always shown as dashed */}
                        <DynoCurve whp={baseline.whp} maxWhp={Math.max(baseline.whp, current.whp)} color="#4a6480" dashed />
                        {/* Current / Active tab curve */}
                        {activeTab === 'after' && (
                            <DynoCurve whp={current.whp} maxWhp={Math.max(baseline.whp, current.whp)} color="#3ea8ff" />
                        )}

                        {/* Peak bubble */}
                        <Rect x={CHART_W * 0.55} y={20} width={85} height={22} rx={6} fill="#1c2e40" />
                        <SvgText
                            x={CHART_W * 0.55 + 8} y={36}
                            fill="#3ea8ff" fontSize={12} fontWeight="bold"
                        >
                            Peak: {displayed.whp} HP
                        </SvgText>

                        {/* RPM label */}
                        <SvgText x={CHART_W - 30} y={CHART_H - 4} fill="#2a3f55" fontSize={10}>RPM</SvgText>
                    </Svg>
                </View>

                {/* ── 2 × 2 Stat Grid ── */}
                <View style={S.statGrid}>
                    <View style={S.statRow}>
                        <StatCell
                            label="Horsepower" icon="speed" iconColor="#4a6480"
                            current={displayed?.whp} baseline={baseline.whp} unit="HP"
                        />
                        <View style={{ width: 8 }} />
                        <StatCell
                            label="Torque" icon="bolt" iconColor="#f59e0b"
                            current={displayed?.torque_nm} baseline={baseline.torque_nm} unit={getTorqueUnit(imperialUnits)}
                            accent="#f59e0b"
                        />
                    </View>
                    <View style={[S.statRow, { marginTop: 8 }]}>
                        <StatCell
                            label="0-60 mph" icon="timer" iconColor="#8b5cf6"
                            current={displayed?.zero_to_sixty} baseline={baseline.zero_to_sixty} unit="s"
                            invertDelta
                        />
                        <View style={{ width: 8 }} />
                        <StatCell
                            label="1/4 Mile" icon="flag" iconColor="#10b981"
                            current={displayed?.quarter_mile} baseline={baseline.quarter_mile} unit="s"
                            invertDelta
                        />
                    </View>
                </View>

                {/* ── Modifications List ── */}
                {logs.length > 0 && (
                    <>
                        <Text style={S.sectionTitle}>MODIFICATIONS LIST</Text>
                        {[...logs]
                            .sort((a, b) => new Date(b.installed_at).getTime() - new Date(a.installed_at).getTime())
                            .map(log => <ModRow key={log.id} log={log} />)
                        }
                    </>
                )}

                {/* ── Metric Delta CTA ── */}
                <TouchableOpacity
                    style={S.metricBtn}
                    onPress={() => router.push({ pathname: '/metric-delta', params: { vehicleId } })}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="analytics" size={20} color="#fff" />
                    <Text style={S.metricBtnText}>Metric Delta Analysis</Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
            </ScrollView>
        </View>
    )
}

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0a1520' },
    center: { flex: 1, backgroundColor: '#0a1520', alignItems: 'center', justifyContent: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 32,
        paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#1c2e40',
    },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center' },
    shareBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(62,168,255,0.1)', alignItems: 'center', justifyContent: 'center',
    },

    content: { padding: 16, paddingBottom: 48 },

    vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    vehicleThumb: { width: 56, height: 40, borderRadius: 8, overflow: 'hidden' },
    vehicleInfo: { flex: 1 },
    vehicleName: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 4 },
    badges: { flexDirection: 'row', gap: 6 },
    badge: {
        backgroundColor: '#1c2e40', borderRadius: 6,
        paddingHorizontal: 6, paddingVertical: 2,
    },
    stageBadge: { backgroundColor: 'rgba(62,168,255,0.12)', borderWidth: 1, borderColor: 'rgba(62,168,255,0.3)' },
    badgeText: { color: '#4a6480', fontSize: 10, fontWeight: '700' },

    tabs: {
        flexDirection: 'row', backgroundColor: '#0d1f30',
        borderRadius: 10, borderWidth: 1, borderColor: '#1c2e40',
        padding: 3, marginBottom: 16,
    },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    tabActive: { backgroundColor: '#3ea8ff' },
    tabText: { color: '#4a6480', fontSize: 12, fontWeight: '700' },
    tabTextActive: { color: '#fff' },

    chartBox: {
        backgroundColor: '#0d1f30', borderRadius: 12,
        borderWidth: 1, borderColor: '#1c2e40',
        padding: 12, marginBottom: 16, overflow: 'hidden',
    },
    chartLabel: { color: '#2a3f55', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },

    statGrid: { marginBottom: 20 },
    statRow: { flexDirection: 'row' },

    sectionTitle: {
        color: '#4a6480', fontSize: 11, fontWeight: '800', letterSpacing: 1.5,
        marginBottom: 10,
    },
    metricBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#3ea8ff', borderRadius: 14,
        paddingVertical: 14, marginTop: 8, marginBottom: 8,
    },
    metricBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', flex: 1, textAlign: 'center' },
})
