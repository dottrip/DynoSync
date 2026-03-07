import { useState, useEffect } from 'react'
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    ActivityIndicator, ScrollView, Platform
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { useVehicles } from '../hooks/useVehicles'

export default function AdvisorHistoryScreen() {
    const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>()
    const { vehicles } = useVehicles()
    const activeVehicle = vehicles.find(v => v.id === vehicleId)

    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        if (vehicleId) fetchHistory()
    }, [vehicleId])

    const fetchHistory = async () => {
        try {
            setLoading(true)
            const res = await api.ai.getAdvisorHistory(vehicleId)
            setHistory(res)
        } catch (e) {
            console.error('Fetch History Error:', e)
        } finally {
            setLoading(false)
        }
    }

    const renderItem = ({ item }: { item: any }) => {
        const isExpanded = expandedId === item.id
        const date = new Date(item.created_at).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })

        return (
            <View style={S.card}>
                <TouchableOpacity
                    style={S.cardHeader}
                    onPress={() => setExpandedId(isExpanded ? null : item.id)}
                    activeOpacity={0.7}
                >
                    <View style={S.headerMain}>
                        <View style={S.dateBox}>
                            <MaterialIcons name="event" size={14} color="#64748b" />
                            <Text style={S.dateText}>{date}</Text>
                        </View>
                        <Text style={S.performanceSummary}>
                            {item.whp} WHP / {item.torque} {item.torque_unit}
                        </Text>
                    </View>
                    <MaterialIcons
                        name={isExpanded ? "expand-less" : "expand-more"}
                        size={24}
                        color="#258cf4"
                    />
                </TouchableOpacity>

                {isExpanded && (
                    <View style={S.expandedContent}>
                        <View style={S.divider} />
                        <Text style={S.adviceText}>{item.advice}</Text>

                        {item.suggestion && (
                            <View style={S.suggestionBox}>
                                <View style={S.sugTag}>
                                    <MaterialIcons name="stars" size={12} color="#00f2ff" />
                                    <Text style={S.sugTagText}>RECOMMENDED ACTION</Text>
                                </View>
                                <Text style={S.sugTitle}>{item.suggestion.title}</Text>
                                <Text style={S.sugGain}>Est. Gain: {item.suggestion.gain}</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        )
    }

    return (
        <View style={S.root}>
            {/* Header */}
            <View style={S.header}>
                <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={S.headerTitleGroup}>
                    <Text style={S.headerTitle}>Neural History</Text>
                    <Text style={S.headerSub}>
                        {activeVehicle ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}` : 'Loading...'}
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={S.center}><ActivityIndicator color="#258cf4" /></View>
            ) : history.length === 0 ? (
                <View style={S.center}>
                    <MaterialCommunityIcons name="history" size={64} color="#1c2e40" />
                    <Text style={S.emptyTitle}>No History Found</Text>
                    <Text style={S.emptySub}>Run your first performance analysis to start your neural logbook.</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={S.listContent}
                />
            )}
        </View>
    )
}

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#101922' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20,
        paddingHorizontal: 16, backgroundColor: '#101922', gap: 16
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1c2e40', alignItems: 'center', justifyContent: 'center' },
    headerTitleGroup: { flex: 1 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
    headerSub: { color: '#258cf4', fontSize: 13, fontWeight: '700', marginTop: 2 },

    listContent: { padding: 16, paddingBottom: 40 },
    card: { backgroundColor: '#0d1f30', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1c2e40', overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    headerMain: { flex: 1 },
    dateBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    dateText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
    performanceSummary: { color: '#fff', fontSize: 16, fontWeight: '800' },

    expandedContent: { paddingHorizontal: 16, paddingBottom: 20 },
    divider: { height: 1, backgroundColor: '#1c2e40', marginBottom: 16 },
    adviceText: { color: '#8ba3b8', fontSize: 14, lineHeight: 22 },

    suggestionBox: {
        marginTop: 20, padding: 16, borderRadius: 12,
        backgroundColor: '#050a0f', borderWidth: 1, borderColor: '#00f2ff20'
    },
    sugTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    sugTagText: { color: '#00f2ff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    sugTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
    sugGain: { color: '#bc13fe', fontSize: 12, fontWeight: '700', marginTop: 4 },

    emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 20 },
    emptySub: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22 }
})
