import { useEffect, useRef, useState } from 'react'
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Share,
    Alert,
    Dimensions,
    Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import ViewShot from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { api, DynoRecord, ModLog } from '../lib/api'

const { width } = Dimensions.get('window')

// ─── 色彩系统 ─────────────────────────────────────────────────────────────────
const C = {
    bg: '#070e16',
    card: '#0d1a26',
    cardBright: '#111f2e',
    border: '#162333',
    cyan: '#00d4ff',
    cyanDim: 'rgba(0,212,255,0.12)',
    cyanBorder: 'rgba(0,212,255,0.3)',
    blue: '#258cf4',
    green: '#10b981',
    red: '#ef4444',
    yellow: '#f59e0b',
    text: '#e8f4f8',
    sub: '#4a7090',
    dim: '#1e3347',
    muted: '#2d4a62',
}

// ─── 打字机 Hook ──────────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 18, startDelay = 600) {
    const [displayed, setDisplayed] = useState('')
    const [done, setDone] = useState(false)

    useEffect(() => {
        setDisplayed('')
        setDone(false)
        const delay = setTimeout(() => {
            let i = 0
            const interval = setInterval(() => {
                i++
                setDisplayed(text.slice(0, i))
                if (i >= text.length) {
                    clearInterval(interval)
                    setDone(true)
                }
            }, speed)
            return () => clearInterval(interval)
        }, startDelay)
        return () => clearTimeout(delay)
    }, [text])

    return { displayed, done }
}

// ─── 进入动画 Hook ────────────────────────────────────────────────────────────
function useEntryAnimation() {
    const slideY = useRef(new Animated.Value(40)).current
    const opacity = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
            Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]).start()
    }, [])

    return { slideY, opacity }
}

// ─── 时间格式化 ───────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const d = Math.floor(diff / 86400000)
    if (d === 0) return 'TODAY'
    if (d === 1) return '1 DAY AGO'
    if (d < 7) return `${d} DAYS AGO`
    if (d < 30) return `${Math.floor(d / 7)} WEEKS AGO`
    return `${Math.floor(d / 30)} MONTHS AGO`
}

function entryId(type: string, id: string) {
    return `DS-${id.slice(0, 4).toUpperCase()}-${type === 'dyno' ? 'DY' : 'MD'}`
}

// ─── 网格背景装饰 ─────────────────────────────────────────────────────────────
function GridBg() {
    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {Array.from({ length: 8 }).map((_, i) => (
                <View
                    key={`h${i}`}
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: i * 80,
                        height: 1,
                        backgroundColor: C.dim,
                        opacity: 0.4,
                    }}
                />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
                <View
                    key={`v${i}`}
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: i * (width / 5),
                        width: 1,
                        backgroundColor: C.dim,
                        opacity: 0.3,
                    }}
                />
            ))}
        </View>
    )
}

// ─── HUD 角线 ─────────────────────────────────────────────────────────────────
function HudCorners({ color = C.cyan, size = 12, thickness = 2 }: { color?: string; size?: number; thickness?: number }) {
    const s = { position: 'absolute' as const, width: size, height: size, borderColor: color }
    return (
        <>
            <View style={[s, { top: 0, left: 0, borderTopWidth: thickness, borderLeftWidth: thickness }]} />
            <View style={[s, { top: 0, right: 0, borderTopWidth: thickness, borderRightWidth: thickness }]} />
            <View style={[s, { bottom: 0, left: 0, borderBottomWidth: thickness, borderLeftWidth: thickness }]} />
            <View style={[s, { bottom: 0, right: 0, borderBottomWidth: thickness, borderRightWidth: thickness }]} />
        </>
    )
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function LogDetailScreen() {
    const { vehicleId, logId, type } = useLocalSearchParams<{
        vehicleId: string
        logId: string
        type: 'dyno' | 'mod'
    }>()

    const [dyno, setDyno] = useState<DynoRecord | null>(null)
    const [mod, setMod] = useState<ModLog | null>(null)
    const [prevDyno, setPrevDyno] = useState<DynoRecord | null>(null)
    const [loading, setLoading] = useState(true)

    const { slideY, opacity } = useEntryAnimation()

    useEffect(() => {
        const load = async () => {
            try {
                if (type === 'dyno') {
                    const records = await api.dyno.list(vehicleId)
                    const sorted = records.sort(
                        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
                    )
                    const idx = sorted.findIndex(r => r.id === logId)
                    if (idx !== -1) {
                        setDyno(sorted[idx])
                        if (idx > 0) setPrevDyno(sorted[idx - 1])
                    }
                } else {
                    const logs = await api.mods.list(vehicleId)
                    const found = logs.find(l => l.id === logId)
                    if (found) setMod(found)
                }
            } catch (e) {
                Alert.alert('Error', 'Failed to load log entry')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [vehicleId, logId, type])

    // --- 内容提取 ---
    const title = type === 'dyno'
        ? `DYNO_RUN_SESSION`
        : (mod?.description.toUpperCase().replace(/\s+/g, '_') ?? 'MOD_LOG')

    const timeStr = type === 'dyno'
        ? (dyno ? timeAgo(dyno.recorded_at) : '')
        : (mod ? timeAgo(mod.installed_at) : '')

    const notes = type === 'dyno'
        ? (dyno?.notes ?? 'No additional notes recorded for this session.')
        : (mod ? `Category: ${mod.category}\n${mod.description}${mod.cost ? `\nCost: $${mod.cost}` : ''}` : '')

    const techNotes = [
        '>> INITIALIZING LOG READING...\n',
        notes,
        '\n_waiting_for_input',
    ].join('')

    const { displayed, done } = useTypewriter(techNotes, 14, 800)

    // --- 性能变化计算 ---
    const whpDelta = dyno && prevDyno
        ? Math.round(((dyno.whp - prevDyno.whp) / prevDyno.whp) * 100)
        : null
    const torqueDelta = dyno?.torque_nm && prevDyno?.torque_nm
        ? Math.round(((dyno.torque_nm - prevDyno.torque_nm) / prevDyno.torque_nm) * 100)
        : null

    const viewShotRef = useRef<ViewShot>(null)

    const handleShare = async () => {
        try {
            const uri = await viewShotRef.current?.capture?.()
            if (uri) {
                await Sharing.shareAsync(uri, { dialogTitle: 'DynoSync Log Entry' })
            } else {
                // Fallback to text if capture fails somehow
                const shareText = type === 'dyno' && dyno
                    ? `🏎️ DynoSync | ${dyno.whp} WHP${whpDelta ? ` (+${whpDelta}%)` : ''}\n${dyno.notes ?? ''}\n\nLogged via DynoSync`
                    : `🔧 DynoSync | ${mod?.description}\nCategory: ${mod?.category}\n\nLogged via DynoSync`
                await Share.share({ message: shareText, title: 'DynoSync Log Entry' })
            }
        } catch { }
    }

    const handleEdit = () => {
        if (type === 'dyno') {
            router.push(`/add-dyno?vehicleId=${vehicleId}`)
        } else {
            router.push(`/add-mod?vehicleId=${vehicleId}`)
        }
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <Text style={styles.loadingText}>LOADING LOG...</Text>
            </View>
        )
    }

    return (
        <View style={styles.root}>
            <ViewShot ref={viewShotRef} style={{ flex: 1, backgroundColor: C.bg }} options={{ format: 'jpg', quality: 0.9 }}>
                <GridBg />

                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={20} color={C.cyan} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>LOG DETAIL</Text>
                        <Text style={styles.headerSub}>ENTRY ID: {entryId(type, logId)}</Text>
                    </View>
                    <TouchableOpacity style={styles.headerBtn}>
                        <MaterialIcons name="more-vert" size={20} color={C.sub} />
                    </TouchableOpacity>
                </View>

                <Animated.ScrollView
                    style={{ transform: [{ translateY: slideY }], opacity }}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Entry Title Block ── */}
                    <View style={styles.entryBlock}>
                        <Text style={styles.entryTime}>{timeStr}</Text>
                        <Text style={styles.entryTitle} numberOfLines={2}>{title}</Text>
                        <View style={styles.entryTags}>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>
                                    {type === 'dyno' ? 'DYNO RUN' : (mod?.category?.toUpperCase() ?? 'MOD')}
                                </Text>
                            </View>
                            <View style={[styles.tag, { borderColor: C.cyanBorder, backgroundColor: C.cyanDim }]}>
                                <Text style={[styles.tagText, { color: C.cyan }]}>
                                    {type === 'dyno' ? `${dyno?.whp ?? '—'} WHP` : 'LOGGED'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Performance Impact ── */}
                    {type === 'dyno' && dyno && (
                        <View style={styles.perfCard}>
                            <HudCorners color={C.cyan} size={14} thickness={2} />
                            <View style={styles.perfHeader}>
                                <MaterialIcons name="flash-on" size={14} color={C.cyan} />
                                <Text style={styles.perfHeaderText}>PERFORMANCE IMPACT</Text>
                            </View>
                            <View style={styles.perfMetrics}>
                                {/* WHP */}
                                <View style={styles.perfMetric}>
                                    <Text style={styles.perfMetricLabel}>MAX OUTPUT</Text>
                                    <View style={styles.perfValueRow}>
                                        <Text style={styles.perfDelta}>
                                            {whpDelta !== null ? (whpDelta >= 0 ? `+${whpDelta}%` : `${whpDelta}%`) : `${dyno.whp}`}
                                        </Text>
                                        <Text style={styles.perfUnit}>WHP</Text>
                                    </View>
                                    <View style={styles.perfBar}>
                                        <View style={[styles.perfBarFill, { width: `${Math.min((dyno.whp / 600) * 100, 100)}%` }]} />
                                    </View>
                                </View>

                                {/* Torque / 0-60 */}
                                <View style={[styles.perfMetric, { borderLeftWidth: 1, borderLeftColor: C.dim, paddingLeft: 16 }]}>
                                    {dyno.torque_nm ? (
                                        <>
                                            <Text style={styles.perfMetricLabel}>TORQUE PEAK</Text>
                                            <View style={styles.perfValueRow}>
                                                <Text style={styles.perfDelta}>
                                                    {torqueDelta !== null ? (torqueDelta >= 0 ? `+${torqueDelta}%` : `${torqueDelta}%`) : `${dyno.torque_nm}`}
                                                </Text>
                                                <Text style={styles.perfUnit}>NM</Text>
                                            </View>
                                            <View style={styles.perfBar}>
                                                <View style={[styles.perfBarFill, { width: `${Math.min((dyno.torque_nm / 700) * 100, 100)}%`, backgroundColor: C.green }]} />
                                            </View>
                                        </>
                                    ) : dyno.zero_to_sixty ? (
                                        <>
                                            <Text style={styles.perfMetricLabel}>0-60 TIME</Text>
                                            <View style={styles.perfValueRow}>
                                                <Text style={styles.perfDelta}>{dyno.zero_to_sixty}</Text>
                                                <Text style={styles.perfUnit}>SEC</Text>
                                            </View>
                                            <View style={styles.perfBar}>
                                                <View style={[styles.perfBarFill, { width: '60%', backgroundColor: C.yellow }]} />
                                            </View>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.perfMetricLabel}>BOOST PEAK</Text>
                                            <View style={styles.perfValueRow}>
                                                <Text style={styles.perfDelta}>—</Text>
                                                <Text style={styles.perfUnit}>PSI</Text>
                                            </View>
                                            <View style={styles.perfBar}>
                                                <View style={[styles.perfBarFill, { width: '0%' }]} />
                                            </View>
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ── Technical Notes (typewriter) ── */}
                    <View style={styles.notesSection}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.sectionAccent} />
                            <Text style={styles.sectionTitle}>TECHNICAL NOTES</Text>
                            <TouchableOpacity style={styles.copyBtn} onPress={() => { }}>
                                <MaterialIcons name="content-copy" size={14} color={C.sub} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.terminalBox}>
                            <HudCorners color={C.sub} size={10} thickness={1} />
                            <Text style={styles.terminalText}>
                                {displayed}
                                {!done && <Text style={styles.cursor}>█</Text>}
                            </Text>
                            {done && (
                                <Text style={styles.waitingText}>_waiting_for_input</Text>
                            )}
                        </View>
                    </View>

                    {/* ── Media Gallery (placeholder) ── */}
                    <View style={styles.mediaSection}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.sectionAccent} />
                            <Text style={styles.sectionTitle}>MEDIA GALLERY</Text>
                            <Text style={styles.mediaCount}>0 FILES</Text>
                        </View>

                        {/* 空状态 / 占位格 */}
                        <View style={styles.mediaGrid}>
                            {[0, 1].map(i => (
                                <TouchableOpacity key={i} style={styles.mediaPlaceholder} activeOpacity={0.7}>
                                    <View style={styles.mediaInner}>
                                        <MaterialIcons
                                            name={i === 0 ? 'photo-camera' : 'bar-chart'}
                                            size={24}
                                            color={C.muted}
                                        />
                                        <Text style={styles.mediaPlaceholderLabel}>
                                            {i === 0 ? 'ADD PHOTO' : 'ADD CHART'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* 底部留白 */}
                    <View style={{ height: 160 }} />
                </Animated.ScrollView>
            </ViewShot>

            {/* ── 底部操作栏 ── */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.sharBtn} onPress={handleShare} activeOpacity={0.85}>
                    <MaterialIcons name="share" size={18} color={C.bg} />
                    <Text style={styles.shareBtnText}>SOCIAL FLEX</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.85}>
                    <MaterialIcons name="edit" size={18} color={C.text} />
                    <Text style={styles.editBtnText}>EDIT LOG</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: C.cyan, fontSize: 12, letterSpacing: 3, fontWeight: '700' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.dim,
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.dim,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { color: C.text, fontSize: 13, fontWeight: '800', letterSpacing: 3 },
    headerSub: { color: C.cyan, fontSize: 9, letterSpacing: 2, marginTop: 2, fontWeight: '600' },

    // Content
    content: { paddingHorizontal: 16, paddingTop: 20 },

    // Entry title block
    entryBlock: { marginBottom: 20 },
    entryTime: {
        color: C.cyan,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 3,
        marginBottom: 8,
    },
    entryTitle: {
        color: C.text,
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 1,
        lineHeight: 32,
        marginBottom: 12,
        fontVariant: ['tabular-nums'],
    },
    entryTags: { flexDirection: 'row', gap: 8 },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: C.muted,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    tagText: { color: C.sub, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

    // Performance Impact Card
    perfCard: {
        backgroundColor: C.card,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.cyanBorder,
        padding: 16,
        marginBottom: 20,
        position: 'relative',
    },
    perfHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: C.dim,
    },
    perfHeaderText: { color: C.cyan, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
    perfMetrics: { flexDirection: 'row', gap: 0 },
    perfMetric: { flex: 1 },
    perfMetricLabel: { color: C.sub, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
    perfValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 10 },
    perfDelta: {
        color: C.cyan,
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
    },
    perfUnit: { color: C.sub, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
    perfBar: { height: 3, backgroundColor: C.dim, borderRadius: 2, overflow: 'hidden' },
    perfBarFill: { height: '100%', backgroundColor: C.cyan, borderRadius: 2 },

    // Technical Notes
    notesSection: { marginBottom: 20 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: C.cyan },
    sectionTitle: { color: C.text, fontSize: 12, fontWeight: '800', letterSpacing: 2.5, flex: 1 },
    copyBtn: {
        width: 28,
        height: 28,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: C.dim,
        justifyContent: 'center',
        alignItems: 'center',
    },
    terminalBox: {
        backgroundColor: C.cardBright,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.dim,
        padding: 16,
        minHeight: 160,
        position: 'relative',
    },
    terminalText: {
        color: C.text,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        letterSpacing: 0.3,
    },
    cursor: { color: C.cyan, fontSize: 13 },
    waitingText: {
        color: C.cyan,
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        marginTop: 8,
        opacity: 0.7,
    },

    // Media Gallery
    mediaSection: { marginBottom: 20 },
    mediaCount: { color: C.sub, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    mediaGrid: { flexDirection: 'row', gap: 10 },
    mediaPlaceholder: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.dim,
        borderStyle: 'dashed',
        overflow: 'hidden',
        backgroundColor: C.card,
    },
    mediaInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    mediaPlaceholderLabel: {
        color: C.muted,
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 16,
        backgroundColor: C.bg,
        borderTopWidth: 1,
        borderTopColor: C.dim,
    },
    sharBtn: {
        flex: 1.4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: C.cyan,
        borderRadius: 10,
        paddingVertical: 16,
    },
    shareBtnText: {
        color: C.bg,
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: C.muted,
        borderRadius: 10,
        paddingVertical: 16,
        backgroundColor: C.card,
    },
    editBtnText: {
        color: C.text,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
})
