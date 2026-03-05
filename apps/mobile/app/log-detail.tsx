import { useEffect, useRef, useState, useCallback } from 'react'
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Share,
    Dimensions,
    Platform,
    Alert,
    Modal,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { router, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { api, DynoRecord, ModLog } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'
import { formatTorqueValueOnly, getTorqueUnit } from '../lib/units'
import { useImagePicker } from '../hooks/useImagePicker'
import ViewShot from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { setCache } from '../lib/cache'

const { width } = Dimensions.get('window')

// ─── Color System ─────────────────────────────────────────────────────────────
const C = {
    bg: '#0a1520',
    card: '#0d1f30',
    cardBright: '#12253a',
    border: '#1c2e40',
    blue: '#3ea8ff',
    blueDim: 'rgba(62,168,255,0.1)',
    blueBorder: 'rgba(62,168,255,0.3)',
    green: '#10b981',
    red: '#ef4444',
    yellow: '#f59e0b',
    text: '#ffffff',
    sub: '#4a6480',
    dim: '#162333',
    muted: '#2a3f55',
}

// ─── Typewriter Hook ──────────────────────────────────────────────────────────
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

// ─── Entry Animation Hook ────────────────────────────────────────────────────
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

// ─── Time Formatting ─────────────────────────────────────────────────────────
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

// ─── Grid Background Decoration ──────────────────────────────────────────────
function GridBg() {
    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {Array.from({ length: 12 }).map((_, i) => (
                <View
                    key={`h${i}`}
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: i * 60,
                        height: 0.5,
                        backgroundColor: C.blue,
                        opacity: 0.05,
                    }}
                />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
                <View
                    key={`v${i}`}
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: i * (width / 6),
                        width: 0.5,
                        backgroundColor: C.blue,
                        opacity: 0.05,
                    }}
                />
            ))}
        </View>
    )
}

// ─── HUD Corner Lines ────────────────────────────────────────────────────────
function HudCorners({ color = C.blue, size = 10, thickness = 1.5 }: { color?: string; size?: number; thickness?: number }) {
    const s = { position: 'absolute' as const, width: size, height: size, borderColor: color }
    return (
        <>
            <View style={[s, { top: -1, left: -1, borderTopWidth: thickness, borderLeftWidth: thickness, borderTopLeftRadius: 2 }]} />
            <View style={[s, { top: -1, right: -1, borderTopWidth: thickness, borderRightWidth: thickness, borderTopRightRadius: 2 }]} />
            <View style={[s, { bottom: -1, left: -1, borderBottomWidth: thickness, borderLeftWidth: thickness, borderBottomLeftRadius: 2 }]} />
            <View style={[s, { bottom: -1, right: -1, borderBottomWidth: thickness, borderRightWidth: thickness, borderBottomRightRadius: 2 }]} />
        </>
    )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function LogDetailScreen() {
    const router = useRouter()
    const { user } = useAuth()
    const { imperialUnits } = useSettings()
    const { pickImage, uploadImage, uploading } = useImagePicker()
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
    const [showOptionsModal, setShowOptionsModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                try {
                    if (type === 'dyno') {
                        const records = await api.dyno.list(vehicleId)
                        // Seed the global cache so other screens (like Edit) see fresh data
                        setCache(`dyno:${vehicleId}`, records)

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
    )

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

    const handleCopy = async () => {
        if (!notes) return
        await Clipboard.setStringAsync(notes)
        Alert.alert('Copied', 'Technical notes copied to clipboard.')
    }

    const handleMore = () => {
        setShowOptionsModal(true)
    }

    const handleMedia = async (mediaType: 'photo' | 'chart') => {
        const uri = await pickImage()
        if (uri) {
            // Upload logic would go here, currently just a placeholder success
            Alert.alert('Success', `${mediaType === 'photo' ? 'Photo' : 'Chart'} upload started!`)
        }
    }

    const handleEdit = () => {
        if (type === 'dyno') {
            router.push(`/add-dyno?vehicleId=${vehicleId}&editRecordId=${logId}`)
        } else {
            router.push(`/add-mod?vehicleId=${vehicleId}&editLogId=${logId}`)
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
                        <MaterialIcons name="arrow-back" size={20} color={C.blue} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>LOG DETAIL</Text>
                        <View style={styles.idBadge}>
                            <Text style={styles.headerSub}>{entryId(type, logId)}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.headerBtn} onPress={handleMore}>
                        <MaterialIcons name="more-vert" size={20} color={C.muted} />
                    </TouchableOpacity>
                </View>

                <Animated.ScrollView
                    style={{ transform: [{ translateY: slideY }], opacity }}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Entry Title Block ── */}
                    <View style={styles.entryBlock}>
                        <View style={styles.entryTimeRow}>
                            <MaterialIcons name="event" size={12} color={C.blue} />
                            <Text style={styles.entryTime}>{timeStr}</Text>
                        </View>
                        <Text style={styles.entryTitle} numberOfLines={2}>{title}</Text>
                        <View style={styles.entryTags}>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>
                                    {type === 'dyno' ? 'DYNO SESSION' : (mod?.category?.toUpperCase() ?? 'MOD')}
                                </Text>
                            </View>
                            <View style={[styles.tag, { borderColor: C.blueBorder, backgroundColor: C.blueDim }]}>
                                <Text style={[styles.tagText, { color: C.blue }]}>
                                    {type === 'dyno' ? `${dyno?.whp ?? '—'} WHP` : 'RECORDED'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Performance Impact ── */}
                    {type === 'dyno' && dyno && (
                        <View style={styles.perfCard}>
                            <HudCorners color={C.blue} size={14} thickness={1.5} />
                            <View style={styles.perfHeader}>
                                <MaterialIcons name="flash-on" size={14} color={C.blue} />
                                <Text style={styles.perfHeaderText}>PERFORMANCE IMPACT</Text>
                            </View>
                            <View style={styles.perfMetricsGrid}>
                                {/* Row 1: WHP & Torque */}
                                <View style={styles.perfGridRow}>
                                    <View style={styles.perfMetricItem}>
                                        <View style={styles.perfMetricHeader}>
                                            <Text style={styles.perfMetricLabel}>MAX OUTPUT</Text>
                                            <MaterialIcons name="trending-up" size={10} color={C.blue} />
                                        </View>
                                        <View style={styles.perfValueRow}>
                                            <Text style={styles.perfDelta}>
                                                {whpDelta !== null ? (whpDelta >= 0 ? `+${whpDelta}%` : `${whpDelta}%`) : `${dyno.whp}`}
                                            </Text>
                                            <Text style={styles.perfUnit}>WHP</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.perfMetricItem, { borderLeftWidth: 1, borderLeftColor: C.border, paddingLeft: 16 }]}>
                                        <View style={styles.perfMetricHeader}>
                                            <Text style={styles.perfMetricLabel}>TORQUE PEAK</Text>
                                            <MaterialIcons name="rotate-right" size={10} color={C.green} />
                                        </View>
                                        <View style={styles.perfValueRow}>
                                            <Text style={styles.perfDelta}>
                                                {dyno.torque_nm ? formatTorqueValueOnly(dyno.torque_nm, imperialUnits) : '—'}
                                            </Text>
                                            <Text style={styles.perfUnit}>{getTorqueUnit(imperialUnits).toUpperCase()}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Row 2: 0-60 & 1/4 Mile */}
                                <View style={[styles.perfGridRow, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border }]}>
                                    <View style={styles.perfMetricItem}>
                                        <View style={styles.perfMetricHeader}>
                                            <Text style={styles.perfMetricLabel}>0-60 TIME</Text>
                                            <MaterialIcons name="timer" size={10} color={C.yellow} />
                                        </View>
                                        <View style={styles.perfValueRow}>
                                            <Text style={styles.perfDelta}>{dyno.zero_to_sixty ?? '—'}</Text>
                                            <Text style={styles.perfUnit}>SEC</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.perfMetricItem, { borderLeftWidth: 1, borderLeftColor: C.border, paddingLeft: 16 }]}>
                                        <View style={styles.perfMetricHeader}>
                                            <Text style={styles.perfMetricLabel}>1/4 MILE</Text>
                                            <MaterialIcons name="speed" size={10} color="#00f2ff" />
                                        </View>
                                        <View style={styles.perfValueRow}>
                                            <Text style={styles.perfDelta}>{dyno.quarter_mile ?? '—'}</Text>
                                            <Text style={styles.perfUnit}>SEC</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ── Technical Notes (typewriter) ── */}
                    <View style={styles.notesSection}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.sectionAccent} />
                            <Text style={styles.sectionTitle}>SYSTEM LOG / NOTES</Text>
                            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                                <MaterialIcons name="content-copy" size={14} color={C.blue} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.terminalBox}>
                            <HudCorners color={C.blueBorder} size={10} thickness={1} />
                            <Text style={styles.terminalText}>
                                {displayed}
                                {!done && <Text style={styles.cursor}>█</Text>}
                            </Text>
                            {done && (
                                <Text style={styles.waitingText}>_ready_for_input</Text>
                            )}
                        </View>
                    </View>

                    {/* ── Media Gallery ── */}
                    <View style={styles.mediaSection}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.sectionAccent} />
                            <Text style={styles.sectionTitle}>ACHIEVEMENT / PROOF</Text>
                            <Text style={styles.mediaCount}>0 FILES</Text>
                        </View>

                        {/* 空状态 / 占位格 */}
                        <View style={styles.mediaGrid}>
                            <TouchableOpacity style={styles.mediaPlaceholder} activeOpacity={0.7} onPress={() => handleMedia('photo')}>
                                <View style={styles.mediaInner}>
                                    <View style={styles.mediaIconBox}>
                                        <MaterialIcons name="photo-camera" size={22} color={C.blue} />
                                    </View>
                                    <Text style={styles.mediaPlaceholderLabel}>UPLOAD PHOTO</Text>
                                    <Text style={styles.mediaPlaceholderSub}>Visual proof of work</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.mediaPlaceholder} activeOpacity={0.7} onPress={() => handleMedia('chart')}>
                                <View style={styles.mediaInner}>
                                    <View style={styles.mediaIconBox}>
                                        <MaterialIcons name="bar-chart" size={22} color={C.blue} />
                                    </View>
                                    <Text style={styles.mediaPlaceholderLabel}>ADD DYNO SHEET</Text>
                                    <Text style={styles.mediaPlaceholderSub}>Verify your power</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 底部留白 */}
                    <View style={{ height: 160 }} />
                </Animated.ScrollView>
            </ViewShot>

            {/* ── 底部操作栏 ── */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.sharBtn} onPress={handleShare} activeOpacity={0.85}>
                    <MaterialIcons name="share" size={18} color={C.text} />
                    <Text style={styles.shareBtnText}>SOCIAL FLEX</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.85}>
                    <MaterialIcons name="edit" size={18} color={C.text} />
                    <Text style={styles.editBtnText}>EDIT LOG</Text>
                </TouchableOpacity>
            </View>

            {/* ── Custom Options Modal ── */}
            <Modal
                visible={showOptionsModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowOptionsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.optionModal}>
                        {!showDeleteConfirm ? (
                            <>
                                <Text style={styles.modalTitle}>LOG OPTIONS</Text>
                                <View style={styles.optionList}>
                                    <TouchableOpacity style={styles.optionBtn} onPress={() => { setShowOptionsModal(false); handleEdit(); }}>
                                        <Text style={styles.optionBtnText}>Edit Log</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.optionBtn} onPress={() => setShowDeleteConfirm(true)}>
                                        <Text style={[styles.optionBtnText, { color: C.red }]}>Delete Log</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.optionBtn}
                                        onPress={async () => {
                                            setShowOptionsModal(false);
                                            await Clipboard.setStringAsync(entryId(type, logId));
                                            Alert.alert('Copied', 'Entry ID copied to clipboard.');
                                        }}
                                    >
                                        <Text style={styles.optionBtnText}>Copy Entry ID</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.optionBtn, { borderBottomWidth: 0 }]} onPress={() => setShowOptionsModal(false)}>
                                        <Text style={styles.optionBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.deleteIconBox}>
                                    <MaterialIcons name="delete-forever" size={32} color={C.red} />
                                </View>
                                <Text style={styles.modalTitle}>CONFIRM DELETE</Text>
                                <Text style={styles.modalSub}>Are you sure you want to delete this record? This action cannot be undone.</Text>
                                <View style={styles.deleteActions}>
                                    <TouchableOpacity
                                        style={styles.deleteConfirmBtn}
                                        onPress={async () => {
                                            try {
                                                if (type === 'dyno') await api.dyno.delete(vehicleId, logId);
                                                else await api.mods.delete(vehicleId, logId);
                                                setShowOptionsModal(false);
                                                router.back();
                                            } catch (e: any) {
                                                Alert.alert('Error', e.message);
                                            }
                                        }}
                                    >
                                        <Text style={styles.deleteConfirmText}>DELETE RECORD</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => setShowDeleteConfirm(false)}>
                                        <Text style={styles.deleteCancelText}>BACK</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: C.blue, fontSize: 12, letterSpacing: 3, fontWeight: '700' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: C.bg,
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
    idBadge: {
        backgroundColor: C.blueDim,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 4,
        borderWidth: 1,
        borderColor: C.blueBorder,
    },
    headerSub: { color: C.blue, fontSize: 9, letterSpacing: 1, fontWeight: '800' },

    // Content
    content: { paddingHorizontal: 16, paddingTop: 20 },

    // Entry title block
    entryBlock: { marginBottom: 24 },
    entryTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    entryTime: {
        color: C.sub,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
    },
    entryTitle: {
        color: C.text,
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -0.5,
        lineHeight: 38,
        marginBottom: 16,
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
        borderColor: C.blueBorder,
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
        borderBottomColor: C.border,
    },
    perfHeaderText: { color: C.blue, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
    perfMetricsGrid: { marginTop: 8 },
    perfGridRow: { flexDirection: 'row' },
    perfMetricItem: { flex: 1 },
    perfMetricHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
    perfMetricLabel: { color: C.sub, fontSize: 9, fontWeight: '700', letterSpacing: 2 },
    perfValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    perfDelta: {
        color: C.blue,
        fontSize: 32,
        fontWeight: '900',
    },
    perfUnit: { color: C.sub, fontSize: 12, fontWeight: '700' },

    // Technical Notes
    notesSection: { marginBottom: 24 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    sectionAccent: { width: 4, height: 16, borderRadius: 2, backgroundColor: C.blue },
    sectionTitle: { color: C.text, fontSize: 13, fontWeight: '900', letterSpacing: 1.5, flex: 1 },
    copyBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: C.card,
    },
    terminalBox: {
        backgroundColor: C.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        minHeight: 180,
        position: 'relative',
    },
    terminalText: {
        color: C.text,
        fontSize: 13,
        lineHeight: 22,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        opacity: 0.9,
    },
    cursor: { color: C.blue, fontSize: 13, fontWeight: '700' },
    waitingText: {
        color: C.blue,
        fontSize: 11,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginTop: 12,
        opacity: 0.6,
        fontWeight: '700',
    },

    // Media Gallery
    mediaSection: { marginBottom: 20 },
    mediaCount: { color: C.sub, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    mediaGrid: { flexDirection: 'row', gap: 12 },
    mediaPlaceholder: {
        flex: 1,
        aspectRatio: 0.85,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: C.blue + '30',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(37, 140, 244, 0.05)',
    },
    mediaInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    mediaIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: C.blueDim,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    mediaPlaceholderLabel: {
        color: C.text,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    mediaPlaceholderSub: {
        color: C.sub,
        fontSize: 9,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 16,
        backgroundColor: C.bg,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    sharBtn: {
        flex: 1.4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: C.blue,
        borderRadius: 14,
        paddingVertical: 16,
        elevation: 8,
        shadowColor: C.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    shareBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 14,
        paddingVertical: 16,
        backgroundColor: C.card,
    },
    editBtnText: {
        color: C.text,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },

    // Custom Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    optionModal: {
        backgroundColor: '#0f172a',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        color: C.text,
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalSub: {
        color: C.sub,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    optionList: {
        width: '100%',
    },
    optionBtn: {
        width: '100%',
        paddingVertical: 18,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        marginBottom: 8,
    },
    optionBtnText: {
        color: C.text,
        fontSize: 16,
        fontWeight: '700',
    },
    deleteIconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteActions: {
        width: '100%',
        gap: 12,
    },
    deleteConfirmBtn: {
        backgroundColor: C.red,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    deleteConfirmText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 1,
    },
    deleteCancelBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    deleteCancelText: {
        color: C.sub,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1,
    },
})
