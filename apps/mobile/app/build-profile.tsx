import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform, StatusBar, Linking, Alert, Animated, Share } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

import { usePublicVehicle } from '../hooks/usePublicVehicle'
import { useFollowBuild } from '../hooks/useFollowBuild'
import { useSettings } from '../hooks/useSettings'
import { formatTorqueValueOnly, getTorqueUnit } from '../lib/units'

export default function BuildProfileScreen() {
    const { vehicleId } = useLocalSearchParams()
    const { data, loading, error } = usePublicVehicle(vehicleId as string)
    const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile')
    const scrollY = useRef(new Animated.Value(0)).current

    if (loading) {
        return (
            <View style={[S.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#fff' }}>Loading profile...</Text>
            </View>
        )
    }

    if (error || !data) {
        return (
            <View style={[S.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#ff3333' }}>{error || 'Vehicle not found'}</Text>
            </View>
        )
    }


    const headerBgColor = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [
            activeTab === 'history' ? 'rgba(10, 21, 32, 1)' : 'rgba(10, 21, 32, 0.3)',
            'rgba(10, 21, 32, 1)'
        ],
        extrapolate: 'clamp'
    })

    const handleShare = async () => {
        try {
            const shareTitle = `${data.model} on DynoSync`
            const shareMessage = `Check out this ${shareTitle} pushing ${data.whp} WHP and ${data.torque} Nm! Ranked #X Worldwide. 🏎️💨\n\nhttps://dynosync.app/build/${data.id}`

            await Share.share({
                message: shareMessage,
                title: shareTitle,
                // url: `https://dynosync.app/build/${data.id}`, // iOS only for rich links
            })
        } catch (err: any) {
            Alert.alert('Share Error', err.message)
        }
    }

    return (
        <View style={S.root}>
            {/* Absolute Header & Tabs Container (Overlay) */}
            <Animated.View style={[
                S.headerContainer,
                { backgroundColor: headerBgColor },
                activeTab === 'history' && { borderBottomWidth: 1, borderBottomColor: '#1c2e40' }
            ]}>
                <View style={S.headerRow}>
                    <TouchableOpacity style={S.iconBtn} onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={S.headerTitle}>{activeTab === 'profile' ? 'Build Profile' : 'Build History'}</Text>
                        {activeTab === 'history' && <Text style={{ color: '#3ea8ff', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 2 }}>VERIFIED PROOF</Text>}
                    </View>
                    <TouchableOpacity style={S.iconBtn} onPress={handleShare}>
                        <MaterialIcons name="share" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* TABS SWITCHER */}
                <View style={S.tabsRow}>
                    <TouchableOpacity style={[S.tabBtn, activeTab === 'profile' && S.tabBtnActive]} onPress={() => setActiveTab('profile')}>
                        <Text style={[S.tabBtnText, activeTab === 'profile' && S.tabBtnTextActive]}>PROFILE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[S.tabBtn, activeTab === 'history' && S.tabBtnActive]} onPress={() => setActiveTab('history')}>
                        <Text style={[S.tabBtnText, activeTab === 'history' && S.tabBtnTextActive]}>HISTORY</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {activeTab === 'profile' ? (
                    <ProfileView data={data} />
                ) : (
                    <HistoryView data={data} />
                )}
            </Animated.ScrollView>
        </View>
    )
}

// ─── PROFILE VIEW ─────────────────────────────────────────────────────────
function ProfileView({ data }: { data: any }) {
    const { isFollowing, acting, toggleFollow } = useFollowBuild(data.id)
    const { imperialUnits } = useSettings()

    const handleContact = () => {
        if (data.social?.instagram) {
            Linking.openURL(`https://instagram.com/${data.social.instagram}`).catch(() => {
                Alert.alert('Error', 'Could not open Instagram app or web browser.')
            })
        } else if (data.social?.discord) {
            Alert.alert('Contact via Discord', `Owner Discord ID: ${data.social.discord}`)
        } else {
            Alert.alert('No Contact Info', 'This owner has not linked any social accounts.')
        }
    }

    return (
        <View>
            {/* ─── HERO IMAGE SECTION ─── */}
            <View style={[S.heroContainer, { marginTop: -60 }]}>
                <Image source={{ uri: data.image }} style={S.heroImage} />
                <LinearGradient
                    colors={['rgba(10,21,32,0)', '#0a1520']}
                    style={S.heroGradient}
                />
                <View style={S.rankBadgeWrap}>
                    <View style={S.rankBadge}>
                        <MaterialIcons name="emoji-events" size={14} color="#fff" />
                        <Text style={S.rankText}>#{data.rank} WORLD RANK</Text>
                    </View>
                </View>
            </View>

            {/* ─── IDENTITY PANEL ─── */}
            <View style={S.identityPanel}>
                <Text style={S.buildName}>{data.name}</Text>
                <Text style={S.buildModel}>{data.model}</Text>
                <View style={S.ownerRow}>
                    <View style={S.ownerAvatar}><MaterialIcons name="person" size={14} color="#3ea8ff" /></View>
                    <Text style={S.ownerText}>{data.owner}</Text>
                </View>

                <View style={S.metricsRow}>
                    <View style={S.metricBlock}>
                        <Text style={S.metricLabel}>PEAK WHP</Text>
                        <Text style={S.metricValue}>{data.whp} <Text style={S.metricUnit}>hp</Text></Text>
                        <View style={S.deltaRow}>
                            <MaterialIcons name="trending-up" size={12} color="#10b981" />
                            <Text style={S.deltaTextGood}>{data.whpDelta}</Text>
                        </View>
                    </View>
                    <View style={S.metricDivider} />
                    <View style={S.metricBlock}>
                        <Text style={S.metricLabel}>TORQUE</Text>
                        <Text style={S.metricValue}>{formatTorqueValueOnly(data.torque, imperialUnits)} <Text style={S.metricUnit}>{getTorqueUnit(imperialUnits)}</Text></Text>
                        <View style={S.deltaRow}>
                            <MaterialIcons name="trending-up" size={12} color="#10b981" />
                            <Text style={S.deltaTextGood}>{data.torqueDelta}</Text>
                        </View>
                    </View>
                    <View style={S.metricDivider} />
                    <View style={S.metricBlock}>
                        <Text style={S.metricLabel}>0-60MPH</Text>
                        <Text style={S.metricValue}>{data.zeroSixty} <Text style={S.metricUnit}>s</Text></Text>
                        <View style={S.deltaRow}>
                            <MaterialIcons name="trending-down" size={12} color="#f59e0b" />
                            <Text style={S.deltaTextImprove}>{data.zeroSixtyDelta}</Text>
                        </View>
                    </View>
                </View>

                {/* ACTION BUTTONS */}
                <View style={S.actionRow}>
                    <TouchableOpacity
                        style={[S.actionBtn, isFollowing && S.actionBtnActive]}
                        onPress={toggleFollow}
                        disabled={acting}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name={isFollowing ? "bookmark" : "bookmark-border"} size={16} color={isFollowing ? "#fff" : "#3ea8ff"} />
                        <Text style={[S.actionBtnText, isFollowing && S.actionBtnTextActive]}>
                            {isFollowing ? 'Following' : 'Follow Build'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={S.actionBtnGhost} onPress={handleContact} activeOpacity={0.7}>
                        <MaterialIcons name="forum" size={16} color="#3ea8ff" />
                        <Text style={S.actionBtnTextGhost}>Contact Owner</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── ENGINEERING OVERVIEW ─── */}
            <View style={S.section}>
                <View style={S.sectionHeader}>
                    <MaterialIcons name="architecture" size={20} color="#3ea8ff" />
                    <Text style={S.sectionTitle}>Engineering Overview</Text>
                </View>
                <View style={S.grid2x2}>
                    <View style={S.gridBox}>
                        <Text style={S.gridLabel}>ENGINE</Text>
                        <Text style={S.gridVal}>{data.overview.engine}</Text>
                    </View>
                    <View style={S.gridBox}>
                        <Text style={S.gridLabel}>DRIVETRAIN</Text>
                        <Text style={S.gridVal}>{data.overview.drivetrain}</Text>
                    </View>
                    <View style={S.gridBox}>
                        <Text style={S.gridLabel}>TURBO SETUP</Text>
                        <Text style={S.gridVal}>{data.overview.turbo}</Text>
                    </View>
                    <View style={S.gridBox}>
                        <Text style={S.gridLabel}>FUEL SYSTEM</Text>
                        <Text style={S.gridVal}>{data.overview.fuel}</Text>
                    </View>
                </View>
            </View>

            {/* ─── MOD LIST ─── */}
            <View style={S.section}>
                <View style={S.sectionHeader}>
                    <MaterialIcons name="settings" size={20} color="#3ea8ff" />
                    <Text style={S.sectionTitle}>Mod List</Text>
                </View>

                <ModCategory title="POWERTRAIN" count={data.mods.powertrain?.length || 0} list={data.mods.powertrain || []} />
                <ModCategory title="SUSPENSION" count={data.mods.suspension?.length || 0} list={data.mods.suspension || []} />
                <ModCategory title="AERO" count={data.mods.aero?.length || 0} list={data.mods.aero || []} />
            </View>
        </View>
    )
}

// ─── HISTORY VIEW ─────────────────────────────────────────────────────────
function HistoryView({ data }: { data: any }) {
    const { imperialUnits } = useSettings()

    return (
        <View style={S.historyRoot}>
            {/* Top Banner */}
            <View style={S.historyBanner}>
                <Image source={{ uri: data.image }} style={S.historyThumb} />
                <View style={{ flex: 1 }}>
                    <Text style={S.historyName}>{data.name}</Text>
                    <Text style={S.historySub}>{data.whp} WHP / {formatTorqueValueOnly(data.torque, imperialUnits)} {getTorqueUnit(imperialUnits)}</Text>
                    <View style={S.ownerRowHist}>
                        <MaterialIcons name="verified" size={14} color="#3ea8ff" />
                        <Text style={S.ownerTextHist}>Owner: {data.owner}</Text>
                    </View>
                </View>
            </View>

            {/* Stats Row */}
            <View style={S.historyStatsRow}>
                <View style={S.histStatBox}>
                    <Text style={S.histStatLabel}>TOTAL MODS</Text>
                    <Text style={S.histStatVal}>{data.history.stats.mods}</Text>
                </View>
                <View style={[S.histStatBox, { borderColor: 'rgba(62,168,255,0.3)', backgroundColor: 'rgba(62,168,255,0.05)' }]}>
                    <Text style={[S.histStatLabel, { color: '#3ea8ff' }]}>DYNO SHEETS</Text>
                    <Text style={[S.histStatVal, { color: '#3ea8ff' }]}>{data.history.stats.sheets}</Text>
                </View>
                <View style={S.histStatBox}>
                    <Text style={S.histStatLabel}>BUILD TIME</Text>
                    <Text style={S.histStatVal}>{data.history.stats.time}</Text>
                </View>
            </View>

            {/* Dyno Proof Gallery */}
            <View style={S.section}>
                <View style={[S.sectionHeader, { justifyContent: 'space-between' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialIcons name="insert-chart" size={20} color="#3ea8ff" />
                        <Text style={S.sectionTitle}>Dyno Proof Gallery</Text>
                    </View>
                    <Text style={S.viewAllText}>View All</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                    {data.history.dynoGallery.map((sheet: any) => (
                        <TouchableOpacity key={sheet.id} style={S.dynoCard} activeOpacity={0.8}>
                            <Image source={{ uri: sheet.img }} style={S.dynoImg} />
                            <LinearGradient colors={['transparent', 'rgba(10,21,32,0.9)']} style={S.dynoGradient} />
                            <View style={S.dynoInfo}>
                                <Text style={S.dynoTitle}>{sheet.title}</Text>
                                <Text style={S.dynoSub}>{sheet.whp} WHP / {formatTorqueValueOnly(sheet.tq, imperialUnits)} {getTorqueUnit(imperialUnits)}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Build Timeline */}
            <View style={[S.section, { marginTop: 40 }]}>
                <View style={S.sectionHeader}>
                    <MaterialIcons name="history" size={20} color="#3ea8ff" />
                    <Text style={S.sectionTitle}>Build Timeline</Text>
                </View>

                <View style={S.timelineWrapper}>
                    <View style={S.timelineLine} />
                    {data.history.timeline.map((event: any, idx: number) => (
                        <View key={idx} style={S.timelineEvent}>
                            <View style={[S.timelineDot, idx === 0 && S.timelineDotActive]} />
                            <View style={S.timelineCard}>
                                <View style={S.timeRowWrapper}>
                                    <View style={S.timeBadge}><Text style={S.timeBadgeText}>{event.date}</Text></View>
                                    {idx === 0 && <MaterialIcons name="verified" size={16} color="#3ea8ff" />}
                                </View>
                                <Text style={S.tlTitle}>{event.title}</Text>
                                <Text style={S.tlDesc}>{event.desc}</Text>
                                {event.impact && (
                                    <View style={S.tlImpactRow}>
                                        <Text style={S.tlImpactLabel}>IMPACT</Text>
                                        <Text style={S.tlImpactVal}>{event.impact}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    )
}

function ModCategory({ title, count, list }: any) {
    return (
        <View style={S.modCategory}>
            <View style={S.modCatHead}>
                <Text style={S.modCatTitle}>{title}</Text>
                <Text style={S.modCatCount}>{count} MODS</Text>
            </View>
            {list.map((m: any, idx: number) => (
                <View key={idx} style={S.modItem}>
                    <View style={S.modItemTextWrap}>
                        <Text style={S.modItemName}>{m.name}</Text>
                        <Text style={S.modItemDesc}>{m.desc}</Text>
                    </View>
                    <MaterialIcons name="verified" size={16} color="#8ba3b8" />
                </View>
            ))}
        </View>
    )
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0a1520' },

    headerContainer: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    headerRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 16,
    },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

    heroContainer: { position: 'relative', width: '100%', height: 320 },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
    rankBadgeWrap: { position: 'absolute', top: Platform.OS === 'ios' ? 120 : 100, left: 20 },
    rankBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#3ea8ff',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 4
    },
    rankText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

    identityPanel: {
        backgroundColor: '#0d1f30', borderRadius: 16, marginHorizontal: 20,
        marginTop: -40, padding: 20, borderWidth: 1, borderColor: '#1c2e40',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
    },
    buildName: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
    buildModel: { color: '#3ea8ff', fontSize: 13, fontWeight: '700', marginBottom: 16 },
    ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
    ownerAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(62,168,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    ownerText: { color: '#8ba3b8', fontSize: 13, fontWeight: '600' },

    metricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metricBlock: { flex: 1 },
    metricDivider: { width: 1, height: 40, backgroundColor: '#1c2e40', marginHorizontal: 12 },
    metricLabel: { color: '#64748b', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
    metricValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
    metricUnit: { fontSize: 14, color: '#8a9ab0', fontWeight: '500' },
    deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    deltaTextGood: { fontSize: 12, fontWeight: '700', color: '#10b981' },
    deltaTextImprove: { fontSize: 12, fontWeight: '700', color: '#f59e0b' },

    // ACTION BUTTONS
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(62,168,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(62,168,255,0.3)',
        paddingVertical: 10,
        borderRadius: 8,
    },
    actionBtnActive: {
        backgroundColor: '#3ea8ff',
        borderColor: '#3ea8ff',
    },
    actionBtnText: {
        color: '#3ea8ff',
        fontSize: 14,
        fontWeight: '700',
    },
    actionBtnTextActive: {
        color: '#fff',
    },
    actionBtnGhost: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#2a3b4c',
        paddingVertical: 10,
        borderRadius: 8,
    },
    actionBtnTextGhost: {
        color: '#8a9ab0',
        fontSize: 14,
        fontWeight: '600',
    },

    // OVERVIEW
    section: { marginTop: 32, paddingHorizontal: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },

    grid2x2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridBox: {
        width: (width - 40 - 12) / 2, backgroundColor: '#0d1f30', borderRadius: 12,
        padding: 16, borderWidth: 1, borderColor: '#1c2e40'
    },
    gridLabel: { color: '#64748b', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
    gridVal: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 20 },

    modCategory: { marginBottom: 24 },
    modCatHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1c2e40', paddingBottom: 8, marginBottom: 12 },
    modCatTitle: { color: '#3ea8ff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    modCatCount: { color: '#8ba3b8', fontSize: 10, fontWeight: '700' },
    modItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    modItemTextWrap: { flex: 1, paddingRight: 16 },
    modItemName: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
    modItemDesc: { color: '#64748b', fontSize: 12, fontWeight: '500' },

    stickyFooterWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'box-none' },
    footerGradient: { height: 40, width: '100%' },
    footerContent: {
        flexDirection: 'row', padding: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        backgroundColor: '#0a1520', gap: 12
    },
    btnPrimary: {
        flex: 1, backgroundColor: '#3ea8ff', borderRadius: 12, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', height: 50
    },
    btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    btnSecondary: {
        width: 60, height: 50, backgroundColor: '#1c2e40', borderRadius: 12,
        alignItems: 'center', justifyContent: 'center'
    },

    tabsRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    },
    tabBtn: { paddingVertical: 8, paddingHorizontal: 20 },
    tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#3ea8ff' },
    tabBtnText: { color: '#8ba3b8', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    tabBtnTextActive: { color: '#fff' },

    historyRoot: { paddingTop: 180 },
    historyBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
    historyThumb: { width: 72, height: 72, borderRadius: 12, marginRight: 16 },
    historyName: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
    historySub: { color: '#3ea8ff', fontSize: 13, fontWeight: '700', marginBottom: 8 },
    ownerRowHist: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ownerTextHist: { color: '#8ba3b8', fontSize: 12, fontWeight: '600' },

    historyStatsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 32 },
    histStatBox: { flex: 1, backgroundColor: '#0d1f30', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1c2e40' },
    histStatLabel: { color: '#64748b', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
    histStatVal: { color: '#fff', fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },

    viewAllText: { color: '#3ea8ff', fontSize: 12, fontWeight: '700' },
    dynoCard: { width: 280, height: 160, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1c2e40' },
    dynoImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    dynoGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
    dynoInfo: { position: 'absolute', bottom: 12, left: 16 },
    dynoTitle: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 2 },
    dynoSub: { color: '#3ea8ff', fontSize: 12, fontWeight: '700' },

    timelineWrapper: { marginLeft: 8 },
    timelineLine: { position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, backgroundColor: '#1c2e40' },
    timelineEvent: { flexDirection: 'row', marginBottom: 32 },
    timelineDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#4a6480', marginTop: 8, marginRight: 20, borderWidth: 2, borderColor: '#0a1520' },
    timelineDotActive: { backgroundColor: '#3ea8ff', shadowColor: '#3ea8ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10 },
    timelineCard: { flex: 1, backgroundColor: '#0d1f30', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1c2e40' },
    timeRowWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    timeBadge: { backgroundColor: 'rgba(62,168,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    timeBadgeText: { color: '#3ea8ff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    tlTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 },
    tlDesc: { color: '#8ba3b8', fontSize: 13, lineHeight: 20, marginBottom: 16 },
    tlImpactRow: {},
    tlImpactLabel: { color: '#64748b', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    tlImpactVal: { color: '#10b981', fontSize: 14, fontWeight: '800' }
})
