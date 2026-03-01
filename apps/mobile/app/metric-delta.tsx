import { useRef } from 'react'
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert, ScrollView } from 'react-native'
import Animated, { FadeInDown, FadeOutDown, FadeInUp } from 'react-native-reanimated'
import { router, useLocalSearchParams } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import ViewShot from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { useDynoRecords } from '../hooks/useDynoRecords'
import { useSettings } from '../hooks/useSettings'
import { getTorqueUnit } from '../lib/units'
import { DynoRecord } from '../lib/api'

// ─── Progress bar + metric row ────────────────────────────────────────────────
type MetricRowProps = {
    icon: string
    iconColor: string
    label: string
    sub: string
    baselineVal: number | null | undefined
    currentVal: number | null | undefined
    unit: string
    // invertDelta: smaller = better (e.g. 0-60 time). Arrow reflects VALUE direction.
    invertDelta?: boolean
    barColor: string
}

function MetricRow({ icon, iconColor, label, sub, baselineVal, currentVal, unit, invertDelta, barColor }: MetricRowProps) {
    if (baselineVal == null || currentVal == null) return null

    const delta = currentVal - baselineVal
    // "positive" means improvement
    const isImprovement = invertDelta ? delta <= 0 : delta >= 0
    const improvementColor = '#10b981'
    const regressionColor = '#ef4444'
    const deltaColor = isImprovement ? improvementColor : regressionColor

    // Arrow reflects direction of the VALUE (not whether it's good or bad)
    const arrowIcon = delta < 0 ? 'arrow-downward' : 'arrow-upward'
    const prefix = delta > 0 ? '+' : ''
    const deltaStr = `${prefix}${delta.toFixed(1)}${unit}`

    // Progress bars: baseline is reference, current bar fills proportionally
    const maxVal = Math.max(Math.abs(baselineVal), Math.abs(currentVal)) || 1
    const baselineRatio = Math.min(Math.abs(baselineVal) / maxVal, 1)
    const currentRatio = Math.min(Math.abs(currentVal) / maxVal, 1)

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
                    <Text style={MR.oldVal}>{baselineVal.toFixed(1)}{unit}</Text>
                </View>
            </View>

            <View style={MR.bars}>
                <View style={MR.barLabelRow}>
                    <Text style={MR.barLabel}>Baseline</Text>
                    <Text style={MR.barValue}>{currentVal.toFixed(1)}{unit}</Text>
                </View>
                {/* Baseline bar (gray) */}
                <View style={MR.barBg}>
                    <View style={[MR.barFill, { width: `${baselineRatio * 100}%`, backgroundColor: '#2a3f55' }]} />
                </View>
                {/* Current bar (colored) */}
                <View style={MR.barBg}>
                    <View style={[MR.barFill, { width: `${currentRatio * 100}%`, backgroundColor: barColor }]} />
                </View>
            </View>
        </View>
    )
}

const MR = StyleSheet.create({
    row: {
        backgroundColor: '#0d1f30', borderRadius: 14,
        borderWidth: 1, borderColor: '#1c2e40',
        padding: 14, marginBottom: 10,
    },
    top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    label: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 1 },
    sub: { color: '#4a6480', fontSize: 11 },
    right: { alignItems: 'flex-end' },
    delta: { fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
    oldVal: { fontSize: 11, color: '#4a6480', textDecorationLine: 'line-through' },
    bars: {},
    barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    barLabel: { color: '#4a6480', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    barValue: { color: '#aac4de', fontSize: 10, fontWeight: '600' },
    barBg: { height: 5, backgroundColor: '#0a1520', borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },
})

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MetricDeltaScreen() {
    const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>()
    const { imperialUnits } = useSettings()
    const { records } = useDynoRecords(vehicleId)
    const viewShotRef = useRef<ViewShot>(null)

    const sorted = [...records].sort((a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )
    const baseline = sorted[0]
    const current = sorted[sorted.length - 1]

    if (!baseline || !current || sorted.length < 2) {
        return (
            <View style={S.center}>
                <MaterialIcons name="bar-chart" size={48} color="#1c2e40" />
                <Text style={{ color: '#4a6480', marginTop: 12 }}>Need ≥ 2 dyno runs to compare.</Text>
            </View>
        )
    }

    const handleShare = async () => {
        try {
            const uri = await viewShotRef.current?.capture?.()
            if (!uri) { Alert.alert('Error', 'Could not capture screenshot'); return }
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Metric Delta' })
            } else {
                Alert.alert('Sharing not available on this device')
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to share')
        }
    }

    const whpDelta = current.whp - baseline.whp
    const isOverallPositive = whpDelta >= 0
    const baselineLabel = baseline.notes || 'Stock Tune'
    const currentLabel = current.notes || `Run ${sorted.length}`
    const baselineDate = new Date(baseline.recorded_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
    const currentDate = new Date(current.recorded_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })

    return (
        <View style={S.root}>
            {/* ── Header ── */}
            <View style={S.header}>
                <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={22} color="#3ea8ff" />
                </TouchableOpacity>
                <Text style={S.headerTitle}>Metric Delta Analysis</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Capture area */}
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

                    {/* ── BASELINE vs CURRENT ── */}
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

                    {/* ── Section Title ── */}
                    <View style={S.sectionHeader}>
                        <Text style={S.sectionTitle}>Performance Metrics</Text>
                        <View style={[S.overallBadge, { backgroundColor: isOverallPositive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                            <MaterialIcons name={isOverallPositive ? 'trending-up' : 'trending-down'} size={12} color={isOverallPositive ? '#10b981' : '#ef4444'} />
                            <Text style={[S.overallText, { color: isOverallPositive ? '#10b981' : '#ef4444' }]}>
                                {isOverallPositive ? 'Overall Improved' : 'Overall Declined'}
                            </Text>
                        </View>
                    </View>

                    {/* ── Metric Rows ── */}
                    <MetricRow icon="speed" iconColor="#3ea8ff" label="Peak WHP" sub="Wheel Horsepower"
                        baselineVal={baseline.whp} currentVal={current.whp} unit=" HP" barColor="#3ea8ff" />

                    {baseline.torque_nm != null && current.torque_nm != null && (
                        <MetricRow icon="bolt" iconColor="#f59e0b" label="Peak Torque" sub={getTorqueUnit(imperialUnits)}
                            baselineVal={baseline.torque_nm} currentVal={current.torque_nm} unit={` ${getTorqueUnit(imperialUnits)}`} barColor="#f59e0b" />
                    )}

                    {baseline.zero_to_sixty != null && current.zero_to_sixty != null && (
                        <MetricRow icon="timer" iconColor="#8b5cf6" label="0–60 mph" sub="Acceleration"
                            baselineVal={baseline.zero_to_sixty} currentVal={current.zero_to_sixty} unit="s" invertDelta barColor="#8b5cf6" />
                    )}

                    {baseline.quarter_mile != null && current.quarter_mile != null && (
                        <MetricRow icon="flag" iconColor="#10b981" label="1/4 Mile" sub="Drag Time"
                            baselineVal={baseline.quarter_mile} currentVal={current.quarter_mile} unit="s" invertDelta barColor="#10b981" />
                    )}

                    {/* Spacer for share button */}
                    <View style={{ height: 80 }} />
                </ScrollView>
            </ViewShot>

            {/* ── Share Comparison CTA (fixed bottom) ── */}
            <View style={S.shareBar}>
                <TouchableOpacity style={S.shareBtn} onPress={handleShare} activeOpacity={0.85}>
                    <MaterialIcons name="ios-share" size={20} color="#fff" />
                    <Text style={S.shareBtnText}>Share Comparison</Text>
                </TouchableOpacity>
                <Text style={S.shareSubText}>Post to Social Flex Engine</Text>
            </View>
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
        backgroundColor: '#0a1520',
    },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center' },

    content: { padding: 16, paddingBottom: 16 },

    compareRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    compareCard: {
        flex: 1, backgroundColor: '#0d1f30',
        borderRadius: 12, borderWidth: 1, borderColor: '#1c2e40', padding: 12,
    },
    compareCardActive: { borderColor: '#3ea8ff', backgroundColor: 'rgba(62,168,255,0.06)' },
    compareTag: { color: '#4a6480', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
    compareName: { color: '#aac4de', fontSize: 14, fontWeight: '700', marginBottom: 2 },
    compareDate: { color: '#2a3f55', fontSize: 10 },
    vsCircle: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#3ea8ff', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#3ea8ff', shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
    },
    vsText: { color: '#fff', fontSize: 11, fontWeight: '900' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
    overallBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    overallText: { fontSize: 11, fontWeight: '700' },

    // Fixed bottom share bar
    shareBar: {
        backgroundColor: '#0a1520',
        borderTopWidth: 1, borderTopColor: '#1c2e40',
        paddingHorizontal: 16, paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        alignItems: 'center',
    },
    shareBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#3ea8ff', borderRadius: 14,
        paddingVertical: 14, width: '100%', marginBottom: 6,
    },
    shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    shareSubText: { color: '#2a3f55', fontSize: 11 },
})
