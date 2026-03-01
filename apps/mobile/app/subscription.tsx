import { useState } from 'react'
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert
} from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

// ─── Data ────────────────────────────────────────────────────────────────────
const TIERS = [
    {
        id: 'free',
        name: 'Free',
        monthly: '$0',
        yearly: '$0',
        color: '#64748b',
        buttonText: 'Current Plan',
        highlight: 'Basic garage features'
    },
    {
        id: 'pro',
        name: 'Pro',
        monthly: '$9.99',
        yearly: '$79.99',
        color: '#258cf4',
        buttonText: 'Upgrade to Pro',
        highlight: 'Unlimited essentials & AI features'
    },
    {
        id: 'elite',
        name: 'Elite',
        monthly: '$24.99',
        yearly: '$199.00',
        color: '#f59e0b',
        buttonText: 'Upgrade to Elite',
        highlight: 'All Pro + Exclusive Verification'
    }
]

const FEATURES = [
    { name: 'Garage vehicles', free: '1', pro: '5', elite: 'Unlimited' },
    { name: 'Dyno records per vehicle', free: '5', pro: 'Unlimited', elite: 'Unlimited' },
    { name: 'Mod log entries per vehicle', free: '10', pro: 'Unlimited', elite: 'Unlimited' },
    { name: 'Scan paper dyno sheet', free: '✗', pro: '✓', elite: '✓' },
    { name: 'AI mod suggestions', free: '3/month', pro: 'Unlimited', elite: 'Unlimited + priority queue' },
    { name: 'AI mod comparison analysis', free: '✗', pro: '✓', elite: '✓' },
    { name: 'Before/after performance comparison', free: '✗', pro: '✓', elite: '✓' },
    { name: 'Social share card', free: 'With watermark', pro: 'No watermark', elite: 'No watermark + custom branding' },
    { name: 'Export formats', free: 'Image only', pro: 'Image + PDF', elite: 'Image + PDF + raw CSV' },
    { name: 'Leaderboard', free: 'View only', pro: 'Participate', elite: 'Participate' },
    { name: 'Public build profile', free: '✗', pro: '✓', elite: '✓' },
    { name: 'Build timeline', free: '✗', pro: '✓', elite: '✓' },
    { name: 'Achievements', free: 'Basic badges', pro: 'All badges', elite: 'All badges + exclusive Elite badge' },
    { name: 'Parts recommendations', free: 'Generic', pro: 'Personalized', elite: 'Personalized' },
    { name: 'Tuner verified badge', free: '✗', pro: '✗', elite: '✓' },
    { name: 'Private build mode', free: '✗', pro: '✗', elite: '✓' },
    { name: 'Data export API', free: '✗', pro: '✗', elite: '✓' },
    { name: 'Multi-device sync', free: '✗', pro: '✓', elite: '✓' },
    { name: 'Ads', free: 'Yes', pro: 'No', elite: 'No' },
]

export default function SubscriptionScreen() {
    const [isYearly, setIsYearly] = useState(false)

    const handleUpgrade = (tier: string) => {
        if (tier === 'free') return
        Alert.alert('Coming Soon', `In-app purchases for the ${tier} tier will be enabled in the next update.`)
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
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={S.cardsScroll}
                    snapToInterval={280 + 16}
                    decelerationRate="fast"
                >
                    {TIERS.map((tier) => (
                        <View key={tier.id} style={[S.card, tier.id === 'elite' && { borderColor: '#f59e0b' }]}>
                            {tier.id === 'elite' && (
                                <View style={S.eliteBadge}>
                                    <Text style={S.eliteBadgeText}>MOST POPULAR</Text>
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
                                    tier.id === 'free' ? S.btnSecondary : { backgroundColor: tier.color }
                                ]}
                                onPress={() => handleUpgrade(tier.id)}
                            >
                                <Text style={S.upgradeBtnText}>{tier.buttonText}</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                {/* ── Feature Comparison Table ── */}
                <View style={S.tableContainer}>
                    <Text style={S.tableTitle}>Compare Features</Text>

                    <View style={S.tableHeaderRow}>
                        <Text style={[S.th, { flex: 2 }]}></Text>
                        <Text style={[S.th, { flex: 1, textAlign: 'center', color: '#64748b' }]}>Free</Text>
                        <Text style={[S.th, { flex: 1, textAlign: 'center', color: '#3ea8ff' }]}>Pro</Text>
                        <Text style={[S.th, { flex: 1, textAlign: 'center', color: '#f59e0b' }]}>Elite</Text>
                    </View>

                    {FEATURES.map((feat, i) => (
                        <View key={i} style={S.tableRow}>
                            <Text style={[S.tdLabel, { flex: 2 }]}>{feat.name}</Text>
                            <View style={[S.tdValue, { flex: 1 }]}>
                                {renderFeatureStatus(feat.free, '#64748b')}
                            </View>
                            <View style={[S.tdValue, { flex: 1 }]}>
                                {renderFeatureStatus(feat.pro, '#3ea8ff')}
                            </View>
                            <View style={[S.tdValue, { flex: 1 }]}>
                                {renderFeatureStatus(feat.elite, '#f59e0b')}
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
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

    cardsScroll: { paddingHorizontal: 24, paddingBottom: 16, gap: 16 },
    card: {
        width: 280, backgroundColor: '#101922', borderRadius: 20,
        padding: 24, borderWidth: 1, borderColor: '#1c2a38', position: 'relative'
    },
    eliteBadge: {
        position: 'absolute', top: -12, alignSelf: 'center',
        backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
    },
    eliteBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    tierName: { color: '#fff', fontSize: 24, fontWeight: '800' },
    tierHighlight: { color: '#64748b', fontSize: 13, marginTop: 4, minHeight: 36 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 16, marginBottom: 24 },
    priceValue: { color: '#fff', fontSize: 36, fontWeight: '900' },
    pricePeriod: { color: '#64748b', fontSize: 16, fontWeight: '600', marginLeft: 4 },

    upgradeBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    btnSecondary: { backgroundColor: '#1c2a38' },
    upgradeBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

    tableContainer: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#101922', borderRadius: 20, paddingVertical: 20, borderWidth: 1, borderColor: '#1c2a38' },
    tableTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 20, paddingHorizontal: 20 },
    tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1c2a38' },
    th: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#162230', alignItems: 'center' },
    tdLabel: { color: '#e2e8f0', fontSize: 13, fontWeight: '500', paddingRight: 8 },
    tdValue: { alignItems: 'center', justifyContent: 'center' },
    cellText: { color: '#a0aec0', fontSize: 11, textAlign: 'center', fontWeight: '600' },
})
