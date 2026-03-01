import { useState } from 'react'
import {
    View, Text, TouchableOpacity, StyleSheet,
    Alert, ScrollView, Switch, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useSettings } from '../hooks/useSettings'
import { usePushNotifications } from '../hooks/usePushNotifications'

// ─── Setting Row ──────────────────────────────────────────────────────────────
function SettingRow({
    icon, iconColor = '#3ea8ff', label, sub, onPress, right, danger,
}: {
    icon: string; iconColor?: string; label: string; sub?: string
    onPress?: () => void; right?: React.ReactNode; danger?: boolean
}) {
    return (
        <TouchableOpacity
            style={SR.row}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            disabled={!onPress && !right}
        >
            <View style={[SR.iconBox, { backgroundColor: (danger ? '#ef4444' : iconColor) + '18' }]}>
                <MaterialIcons name={icon as any} size={18} color={danger ? '#ef4444' : iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[SR.label, danger && { color: '#ef4444' }]}>{label}</Text>
                {sub ? <Text style={SR.sub}>{sub}</Text> : null}
            </View>
            {right ?? (onPress ? <MaterialIcons name="arrow-forward-ios" size={13} color="#2a3f55" /> : null)}
        </TouchableOpacity>
    )
}

const SR = StyleSheet.create({
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 13, paddingHorizontal: 16,
    },
    iconBox: {
        width: 36, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    label: { color: '#fff', fontSize: 14, fontWeight: '600' },
    sub: { color: '#4a6480', fontSize: 12, marginTop: 1 },
})

function SectionCard({ children }: { children: React.ReactNode }) {
    return <View style={S.card}>{children}</View>
}
function SectionTitle({ title }: { title: string }) {
    return <Text style={S.sectionTitle}>{title}</Text>
}
function Divider() {
    return <View style={S.divider} />
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
    const { user, signOut } = useAuth()
    const imperialUnits = useSettings((s: any) => s.imperialUnits)
    const setImperialUnits = useSettings((s: any) => s.setImperialUnits)
    const notificationsEnabled = useSettings((s: any) => s.notificationsEnabled)
    const setNotificationsEnabled = useSettings((s: any) => s.setNotificationsEnabled)

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out', style: 'destructive',
                onPress: async () => {
                    try { await signOut() } catch (e: any) { Alert.alert('Error', e.message) }
                },
            },
        ])
    }

    const { enablePush, isRegistering } = usePushNotifications()

    const handleNotificationsToggle = async (val: boolean) => {
        if (val) {
            // User wants to turn on push notifications
            const result = await enablePush()
            if (result.success) {
                setNotificationsEnabled(true)
            } else {
                setNotificationsEnabled(false)
                Alert.alert('Push Notifications Error', result.error || 'Unable to enable push notifications.')
            }
        } else {
            // Just turn it off in UI state locally
            setNotificationsEnabled(false)
        }
    }

    return (
        <View style={S.root}>
            {/* ── Header ── */}
            <View style={S.header}>
                <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={22} color="#3ea8ff" />
                </TouchableOpacity>
                <Text style={S.headerTitle}>Settings</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

                {/* ── Account ── */}
                <SectionTitle title="ACCOUNT" />
                <SectionCard>
                    <SettingRow
                        icon="person"
                        label={user?.email ?? 'User'}
                        sub="Logged in account"
                        iconColor="#3ea8ff"
                    />
                    <Divider />

                    <SettingRow
                        icon="lock"
                        label="Change Password"
                        sub="Update your account password"
                        iconColor="#8b5cf6"
                        onPress={() => Alert.alert(
                            'Change Password',
                            `A verification code will be sent to ${user?.email}`,
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Send Code', onPress: async () => {
                                        if (!user?.email) return
                                        const { error } = await supabase.auth.signInWithOtp({
                                            email: user.email,
                                            options: { shouldCreateUser: false },
                                        })
                                        if (error) Alert.alert('Error', error.message)
                                        else {
                                            Alert.alert('Code sent', 'Check your email for the verification code.')
                                            router.push('/verify-password-reset')
                                        }
                                    }
                                },
                            ]
                        )}
                    />
                </SectionCard>

                {/* ── Preferences ── */}
                <SectionTitle title="PREFERENCES" />
                <SectionCard>
                    <SettingRow
                        icon="straighten"
                        label="Imperial Units"
                        sub="Use HP, lb-ft, mph instead of metric"
                        iconColor="#f59e0b"
                        right={
                            <Switch
                                value={imperialUnits}
                                onValueChange={setImperialUnits}
                                trackColor={{ false: '#1c2e40', true: 'rgba(62,168,255,0.4)' }}
                                thumbColor={imperialUnits ? '#3ea8ff' : '#4a6480'}
                            />
                        }
                    />
                    <Divider />
                    <SettingRow
                        icon="notifications"
                        label="Push Notifications"
                        sub={isRegistering ? 'Registering device...' : 'Alerts for leaderboard changes'}
                        iconColor="#10b981"
                        right={
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleNotificationsToggle}
                                disabled={isRegistering}
                                trackColor={{ false: '#1c2e40', true: 'rgba(16,185,129,0.4)' }}
                                thumbColor={notificationsEnabled ? '#10b981' : '#4a6480'}
                            />
                        }
                    />
                </SectionCard>

                {/* ── About ── */}
                <SectionTitle title="ABOUT" />
                <SectionCard>
                    <SettingRow
                        icon="info-outline"
                        label="App Version"
                        sub="DynoSync v1.0.0 (build 1)"
                        iconColor="#4a6480"
                    />
                    <Divider />
                    <SettingRow
                        icon="shield"
                        label="Privacy Policy"
                        iconColor="#64748b"
                        onPress={() => Alert.alert('Privacy Policy', 'Opens in browser')}
                    />
                    <Divider />
                    <SettingRow
                        icon="description"
                        label="Terms of Service"
                        iconColor="#64748b"
                        onPress={() => Alert.alert('Terms of Service', 'Opens in browser')}
                    />
                </SectionCard>

                {/* ── Danger Zone ── */}
                <SectionTitle title="ACCOUNT ACTIONS" />
                <SectionCard>
                    <SettingRow
                        icon="logout"
                        label="Sign Out"
                        sub="Log out of your account"
                        onPress={handleSignOut}
                        danger
                    />
                </SectionCard>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0a1520' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 32,
        paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#1c2e40',
    },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: {
        flex: 1, color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center',
    },

    content: { padding: 16, paddingTop: 20 },

    sectionTitle: {
        color: '#4a6480', fontSize: 10, fontWeight: '800',
        letterSpacing: 2, marginBottom: 8, marginLeft: 4,
    },
    card: {
        backgroundColor: '#0d1f30', borderRadius: 14,
        borderWidth: 1, borderColor: '#1c2e40',
        marginBottom: 20, overflow: 'hidden',
    },
    divider: { height: 1, backgroundColor: '#1c2e40', marginLeft: 64 },
})
