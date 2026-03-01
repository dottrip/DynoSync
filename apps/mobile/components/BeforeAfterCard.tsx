import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { DynoRecord } from '../lib/api'

// ─── Metric Row 子组件 ────────────────────────────────────────────────────────
type MetricRowProps = {
    icon: string
    iconColor: string
    label: string
    sub: string
    baselineVal: number | null | undefined
    currentVal: number | null | undefined
    unit: string
    // smaller = better (e.g., 0-60 time)
    invertDelta?: boolean
    barColor: string
}

function MetricRow({ icon, iconColor, label, sub, baselineVal, currentVal, unit, invertDelta, barColor }: MetricRowProps) {
    if (baselineVal == null || currentVal == null) return null

    const delta = currentVal - baselineVal
    const isPositive = invertDelta ? delta <= 0 : delta >= 0
    const positiveColor = '#10b981'
    const negativeColor = '#ef4444'
    const deltaColor = isPositive ? positiveColor : negativeColor

    const prefix = delta > 0 ? '+' : ''
    const deltaStr = `${prefix}${delta.toFixed(1)}${unit}`
    const baselineStr = `${baselineVal.toFixed(1)}${unit}`

    // progress bar: how much have we improved relative to baseline (capped at full bar)
    const ratio = Math.min(Math.abs(delta) / (Math.abs(baselineVal) || 1), 0.6) // cap visual at 60% of baseline
    const barWidth = Math.min(0.4 + ratio, 1) // current bar always >= 40% for visual clarity

    return (
        <View style={MR.row}>
            <View style={MR.top}>
                <View style={[MR.iconBox, { backgroundColor: iconColor + '18' }]}>
                    <MaterialIcons name={icon as any} size={18} color={iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={MR.label}>{label}</Text>
                    <Text style={MR.sub}>{sub}</Text>
                </View>
                <View style={MR.right}>
                    <Text style={[MR.delta, { color: deltaColor }]}>{deltaStr}</Text>
                    <Text style={MR.baseline}>{baselineStr}</Text>
                </View>
            </View>

            {/* Progress bars */}
            <View style={MR.bars}>
                <View style={MR.barLabelRow}>
                    <Text style={MR.barLabel}>Baseline</Text>
                    <Text style={MR.barValue}>{baselineStr}</Text>
                </View>
                <View style={MR.barBg}>
                    <View style={[MR.barFill, { width: '40%', backgroundColor: '#2a3f55' }]} />
                </View>
                <View style={MR.barBg}>
                    <View style={[MR.barFill, { width: `${barWidth * 100}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={MR.barCurrent}>{currentVal.toFixed(1)}{unit}</Text>
            </View>
        </View>
    )
}

const MR = StyleSheet.create({
    row: {
        backgroundColor: '#0d1f30',
        borderRadius: 14,
        borderWidth: 1, borderColor: '#1c2e40',
        padding: 14,
        marginBottom: 10,
    },
    top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    label: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 1 },
    sub: { color: '#4a6480', fontSize: 11 },
    right: { alignItems: 'flex-end' },
    delta: { fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
    baseline: { fontSize: 11, color: '#4a6480', textDecorationLine: 'line-through' },
    bars: {},
    barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    barLabel: { color: '#4a6480', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    barValue: { color: '#4a6480', fontSize: 10 },
    barBg: {
        height: 5, backgroundColor: '#0a1520', borderRadius: 3,
        marginBottom: 4, overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 3 },
    barCurrent: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: 2 },
})

// ─── Main Card ────────────────────────────────────────────────────────────────
export function BeforeAfterCard({ records, vehicleId }: { records: DynoRecord[]; vehicleId?: string }) {
    if (!records || records.length < 2) return null

    const sorted = [...records].sort((a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )

    const baseline = sorted[0]
    const current = sorted[sorted.length - 1]

    const whpDelta = current.whp - baseline.whp
    const isOverallPositive = whpDelta >= 0

    const baselineLabel = baseline.notes === 'Stock baseline' ? 'Stock Tune' : (baseline.notes || 'Run 1')
    const currentLabel = current.notes || `Run ${sorted.length}`
    const baselineDate = new Date(baseline.recorded_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
    const currentDate = new Date(current.recorded_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })

    return (
        <View style={S.container}>
            {/* ── Section Header ── */}
            <View style={S.sectionHeader}>
                <Text style={S.sectionTitle}>Performance Metrics</Text>
                <View style={[S.overallBadge, { backgroundColor: isOverallPositive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                    <MaterialIcons
                        name={isOverallPositive ? 'trending-up' : 'trending-down'}
                        size={12}
                        color={isOverallPositive ? '#10b981' : '#ef4444'}
                    />
                    <Text style={[S.overallText, { color: isOverallPositive ? '#10b981' : '#ef4444' }]}>
                        {isOverallPositive ? 'Overall Improved' : 'Overall Declined'}
                    </Text>
                </View>
            </View>

            {/* ── Baseline vs Current Header ── */}
            <View style={S.compareRow}>
                <View style={S.compareCard}>
                    <Text style={S.compareTag}>BASELINE</Text>
                    <Text style={S.compareName} numberOfLines={1}>{baselineLabel}</Text>
                    <Text style={S.compareDate}>{baselineDate}</Text>
                </View>

                <View style={S.vsCircle}>
                    <Text style={S.vsText}>VS</Text>
                </View>

                <View style={[S.compareCard, S.compareCardActive]}>
                    <Text style={[S.compareTag, { color: '#3ea8ff' }]}>CURRENT</Text>
                    <Text style={[S.compareName, { color: '#fff' }]} numberOfLines={1}>{currentLabel}</Text>
                    <Text style={S.compareDate}>{currentDate}</Text>
                </View>
            </View>

            {/* ── Metric Rows ── */}
            <MetricRow
                icon="speed"
                iconColor="#3ea8ff"
                label="Peak WHP"
                sub="Wheel Horsepower"
                baselineVal={baseline.whp}
                currentVal={current.whp}
                unit=" HP"
                barColor="#3ea8ff"
            />

            {baseline.torque_nm != null && current.torque_nm != null && (
                <MetricRow
                    icon="bolt"
                    iconColor="#f59e0b"
                    label="Peak Torque"
                    sub="lb-ft"
                    baselineVal={baseline.torque_nm}
                    currentVal={current.torque_nm}
                    unit=" lb-ft"
                    barColor="#f59e0b"
                />
            )}

            {baseline.zero_to_sixty != null && current.zero_to_sixty != null && (
                <MetricRow
                    icon="timer"
                    iconColor="#8b5cf6"
                    label="0–60 mph"
                    sub="Acceleration"
                    baselineVal={baseline.zero_to_sixty}
                    currentVal={current.zero_to_sixty}
                    unit="s"
                    invertDelta
                    barColor="#8b5cf6"
                />
            )}

            {/* ── Full Analysis Button ── */}
            {vehicleId && (
                <TouchableOpacity
                    style={S.fullBtn}
                    onPress={() => router.push({ pathname: '/performance-delta', params: { vehicleId } })}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="bar-chart" size={15} color="#3ea8ff" />
                    <Text style={S.fullBtnText}>Full Analysis</Text>
                    <MaterialIcons name="arrow-forward" size={15} color="#3ea8ff" />
                </TouchableOpacity>
            )}
        </View>
    )
}

const S = StyleSheet.create({
    container: { marginBottom: 20 },

    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
    overallBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    },
    overallText: { fontSize: 11, fontWeight: '700' },

    compareRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginBottom: 14,
    },
    compareCard: {
        flex: 1, backgroundColor: '#0d1f30',
        borderRadius: 12, borderWidth: 1, borderColor: '#1c2e40',
        padding: 12,
    },
    compareCardActive: {
        borderColor: '#3ea8ff',
        backgroundColor: 'rgba(62,168,255,0.06)',
    },
    compareTag: { color: '#4a6480', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
    compareName: { color: '#aac4de', fontSize: 14, fontWeight: '700', marginBottom: 2 },
    compareDate: { color: '#2a3f55', fontSize: 10 },
    vsCircle: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#3ea8ff', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#3ea8ff', shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
    },
    vsText: { color: '#fff', fontSize: 11, fontWeight: '900' },
    fullBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 10, marginTop: 4,
        borderTopWidth: 1, borderTopColor: '#1c2e40',
    },
    fullBtnText: { color: '#3ea8ff', fontSize: 13, fontWeight: '700' },
})
