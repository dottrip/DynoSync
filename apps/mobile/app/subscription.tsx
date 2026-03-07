import { useState } from 'react'
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { useTierLimits } from '../hooks/useTierLimits'
import { UpgradeSuccessModal } from '../components/UpgradeSuccessModal'

// ─── Data ────────────────────────────────────────────────────────────────────
const TIERS = [
    {
        id: 'free',
        name: 'Free',
        monthly: '$0',
        yearly: '$0',
        color: '#64748b',
        buttonText: 'Current Plan',
        highlight: 'Garage features & 20 AI credits'
    },
    {
        id: 'pro',
        name: 'Pro',
        monthly: '$9.99',
        yearly: '$79.99',
        color: '#258cf4',
        buttonText: 'Upgrade to Pro',
        highlight: 'Unlimited essentials & AI features',
        badge: 'MOST POPULAR'
    },
]

const FEATURES = [
    { name: 'Garage vehicles', free: '1', pro: '5' },
    { name: 'Dyno records per vehicle', free: '5', pro: 'Unlimited' },
    { name: 'Mod log entries per vehicle', free: '10', pro: 'Unlimited' },
    { name: 'Scan paper dyno sheet', free: '✓', pro: '✓' },
    { name: 'AI credits / month', free: '20', pro: '100' },
    { name: 'AI mod comparison analysis', free: '✓', pro: '✓' },
    { name: 'Before/after comparison', free: '✗', pro: '✓' },
    { name: 'Social share card', free: 'Watermarked', pro: 'No watermark' },
    { name: 'Export formats', free: 'Image only', pro: 'Image + PDF' },
    { name: 'Public build profile', free: '✗', pro: '✓' },
    { name: 'Build timeline', free: '✗', pro: '✓' },
    { name: 'Multi-device sync', free: '✗', pro: '✓' },
    { name: 'Ads', free: 'Yes', pro: 'No' },
]

export default function SubscriptionScreen() {
    const [isYearly, setIsYearly] = useState(false)
    const [loadingTier, setLoadingTier] = useState<string | null>(null)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const { tier: currentTier, refetchTier } = useTierLimits()

    const handleUpgrade = async (tierId: string) => {
        if (tierId === currentTier) return
        if (tierId === 'free') {
            Alert.alert('Downgrade', 'Please contact support to cancel your subscription.')
            return
        }

        setLoadingTier(tierId)
        try {
            // Simulated payment delay
            await new Promise(resolve => setTimeout(resolve, 1500))

            await api.profile.upgradeTier(tierId)
            await refetchTier()
            setShowSuccessModal(true)
        } catch (e: any) {
            Alert.alert('Upgrade Failed', e.message || 'Something went wrong during the upgrade.')
        } finally {
            setLoadingTier(null)
        }
    }

    const renderFeatureStatus = (val: string, color: string) => {
        if (val === '✓') return <MaterialIcons name="check" size={18} color={color} />
        if (val === '✗') return <MaterialIcons name="close" size={18} color="#4a6480" />
        return <Text style={S.cellText}>{val}</Text>
    }

    return (
        <View style={S.root}>
            {/* ── Header ── */}
            <View style={S.header}>
                <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#3ea8ff" />
                </TouchableOpacity>
                <Text style={S.headerTitle}>Unlock DynoSync</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

                {/* ── Toggle ── */}
                <View style={S.toggleContainer}>
                    <TouchableOpacity
                        style={[S.toggleBtn, !isYearly && S.toggleActive]}
                        onPress={() => setIsYearly(false)}
                        activeOpacity={0.8}
                    >
                        <Text style={[S.toggleText, !isYearly && S.toggleTextActive]}>Monthly</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[S.toggleBtn, isYearly && S.toggleActive]}
                        onPress={() => setIsYearly(true)}
                        activeOpacity={0.8}
                    >
                        <Text style={[S.toggleText, isYearly && S.toggleTextActive]}>Annually (Save 20%)</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Tier Cards ── */}
                <View style={S.cardsRow}>
                    {TIERS.map((tier) => (
                        <View key={tier.id} style={[S.card, tier.badge && { borderColor: '#258cf4' }]}>
                            {tier.badge && (
                                <View style={S.proBadge}>
                                    <Text style={S.proBadgeText}>{tier.badge}</Text>
                                </View>
                            )}
                            <Text style={S.tierName}>{tier.name}</Text>
                            <Text style={S.tierHighlight}>{tier.highlight}</Text>

                            <View style={S.priceRow}>
                                <Text style={S.priceValue}>{isYearly ? tier.yearly : tier.monthly}</Text>
                                <Text style={S.pricePeriod}>{tier.id === 'free' ? '' : (isYearly ? '/yr' : '/mo')}</Text>
                            </View>

                            <TouchableOpacity
                                style={[
                                    S.upgradeBtn,
                                    tier.id === 'free' ? S.btnSecondary : { backgroundColor: tier.color },
                                    (loadingTier === tier.id || tier.id === currentTier) && { opacity: 0.7 }
                                ]}
                                onPress={() => handleUpgrade(tier.id)}
                                disabled={!!loadingTier || tier.id === currentTier}
                            >
                                {loadingTier === tier.id ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={S.upgradeBtnText}>
                                        {tier.id === currentTier ? 'Current Plan' : tier.buttonText}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* ── Feature Comparison Table ── */}
                <View style={S.tableContainer}>
                    <Text style={S.tableTitle}>Compare Features</Text>

                    <View style={S.tableHeaderRow}>
                        <Text style={[S.th, { flex: 2 }]}></Text>
                        <Text style={[S.th, { flex: 1, textAlign: 'center', color: '#64748b' }]}>Free</Text>
                        <Text style={[S.th, { flex: 1, textAlign: 'center', color: '#258cf4' }]}>Pro</Text>
                    </View>

                    {FEATURES.map((feat, i) => (
                        <View key={i} style={S.tableRow}>
                            <Text style={[S.tdLabel, { flex: 2 }]}>{feat.name}</Text>
                            <View style={[S.tdValue, { flex: 1 }]}>
                                {renderFeatureStatus(feat.free, '#64748b')}
                            </View>
                            <View style={[S.tdValue, { flex: 1 }]}>
                                {renderFeatureStatus(feat.pro, '#258cf4')}
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>

            <UpgradeSuccessModal
                visible={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false)
                    router.back()
                }}
            />
        </View>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0a1520' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 12,
        backgroundColor: 'rgba(10,21,32,0.9)', zIndex: 10,
    },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
    content: { paddingTop: 16 },

    toggleContainer: {
        flexDirection: 'row', backgroundColor: '#1c2a38',
        borderRadius: 30, marginHorizontal: 24, padding: 4, marginBottom: 24,
    },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 26 },
    toggleActive: { backgroundColor: '#258cf4' },
    toggleText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
    toggleTextActive: { color: '#fff' },

    cardsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 8 },
    card: {
        flex: 1, backgroundColor: '#101922', borderRadius: 20,
        padding: 20, borderWidth: 1, borderColor: '#1c2a38', position: 'relative'
    },
    proBadge: {
        position: 'absolute', top: -12, alignSelf: 'center',
        backgroundColor: '#258cf4', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
    },
    proBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    tierName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 8 },
    tierHighlight: { color: '#64748b', fontSize: 12, marginTop: 4, minHeight: 32 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12, marginBottom: 20 },
    priceValue: { color: '#fff', fontSize: 30, fontWeight: '900' },
    pricePeriod: { color: '#64748b', fontSize: 14, fontWeight: '600', marginLeft: 4 },

    upgradeBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    btnSecondary: { backgroundColor: '#1c2a38' },
    upgradeBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

    tableContainer: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#101922', borderRadius: 20, paddingVertical: 20, borderWidth: 1, borderColor: '#1c2a38' },
    tableTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 20, paddingHorizontal: 20 },
    tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1c2a38' },
    th: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#162230', alignItems: 'center' },
    tdLabel: { color: '#e2e8f0', fontSize: 13, fontWeight: '500', paddingRight: 8 },
    tdValue: { alignItems: 'center', justifyContent: 'center' },
    cellText: { color: '#a0aec0', fontSize: 11, textAlign: 'center', fontWeight: '600' },
})
