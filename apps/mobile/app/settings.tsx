import { useState } from 'react'
import {
    View, Text, TouchableOpacity, StyleSheet,
    Alert, ScrollView, Switch, Platform, Modal, ActivityIndicator,
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
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [modalTitle, setModalTitle] = useState('')
    const [modalMsg, setModalMsg] = useState('')
    const [modalType, setModalType] = useState<'success' | 'error' | 'info' | 'confirm' | 'danger'>('info')
    const [onModalConfirm, setOnModalConfirm] = useState<(() => void) | null>(null)
    const [modalConfirmLabel, setModalConfirmLabel] = useState('CONFIRM')
    const [modalConfirmColor, setModalConfirmColor] = useState('#3ea8ff')

    const showAlert = (
        title: string,
        msg: string,
        type: 'success' | 'error' | 'info' | 'confirm' | 'danger' = 'info',
        onConfirm?: () => void,
        confirmLabel?: string
    ) => {
        setModalTitle(title)
        setModalMsg(msg)
        setModalType(type)
        setModalConfirmLabel(confirmLabel || (type === 'danger' ? 'DELETE' : 'CONFIRM'))
        setModalConfirmColor(type === 'danger' ? '#ef4444' : '#3ea8ff')
        setOnModalConfirm(() => onConfirm || null)
        setShowModal(true)
    }
    const { user, signOut } = useAuth()
    const imperialUnits = useSettings((s: any) => s.imperialUnits)
    const setImperialUnits = useSettings((s: any) => s.setImperialUnits)
    const notificationsEnabled = useSettings((s: any) => s.notificationsEnabled)
    const setNotificationsEnabled = useSettings((s: any) => s.setNotificationsEnabled)

    const handleSignOut = () => {
        setShowSignOutConfirm(true)
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
                showAlert('Push Error', result.error || 'Unable to enable push notifications.', 'error')
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
                        onPress={() => showAlert(
                            'Change Password',
                            'A verification code will be sent to your email. Continue?',
                            'confirm',
                            async () => {
                                if (!user?.email) return
                                const { error } = await supabase.auth.signInWithOtp({
                                    email: user.email,
                                    options: { shouldCreateUser: false },
                                })
                                if (error) showAlert('Error', error.message, 'error')
                                else {
                                    showAlert('Code Sent', 'Check your email for the verification code.', 'success', () => {
                                        router.push('/verify-password-reset')
                                    })
                                }
                            },
                            'SEND CODE'
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
                        sub={isRegistering ? 'Registering device...' : 'Receive alerts and updates'}
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
                        onPress={() => router.push('/privacy')}
                    />
                    <Divider />
                    <SettingRow
                        icon="description"
                        label="Terms of Service"
                        iconColor="#64748b"
                        onPress={() => router.push('/terms')}
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
                    <Divider />
                    <SettingRow
                        icon="delete-forever"
                        label="Delete Account"
                        sub="Permanently delete your data"
                        danger
                        onPress={() => showAlert(
                            'PERMANENT DELETION',
                            'This action is permanent and cannot be undone. All your vehicles and data will be purged. Are you absolutely sure?',
                            'danger',
                            async () => {
                                try {
                                    setLoading(true)
                                    const { api } = require('../lib/api')
                                    await api.auth.deleteAccount()
                                    await signOut()
                                    router.replace('/(auth)/login')
                                } catch (err: any) {
                                    showAlert('Deletion Failed', err.message || 'Unable to delete account.', 'error')
                                } finally {
                                    setLoading(false)
                                }
                            }
                        )}
                    />
                </SectionCard>

                {loading && (
                    <View style={S.loadingOverlay}>
                        <ActivityIndicator size="large" color="#3ea8ff" />
                        <Text style={S.loadingText}>Processing...</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Sign Out Confirmation Modal ── */}
            <Modal
                visible={showSignOutConfirm}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSignOutConfirm(false)}
            >
                <TouchableOpacity
                    style={S.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSignOutConfirm(false)}
                >
                    <View style={S.modalContainer}>
                        <TouchableOpacity activeOpacity={1} style={S.modalCard}>
                            <View style={S.modalIconBox}>
                                <MaterialIcons name="logout" size={28} color="#ef4444" />
                            </View>
                            <Text style={S.modalTitle}>SIGN OUT</Text>
                            <Text style={S.modalMessage}>
                                Are you sure you want to log out of your account?
                            </Text>
                            <Text style={S.modalSubMessage}>
                                You will need to sign in again to access your garage.
                            </Text>
                            <View style={S.modalActions}>
                                <TouchableOpacity
                                    style={S.modalCancelBtn}
                                    onPress={() => setShowSignOutConfirm(false)}
                                >
                                    <Text style={S.modalCancelText}>CANCEL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={S.modalConfirmBtn}
                                    onPress={async () => {
                                        setShowSignOutConfirm(false)
                                        await signOut()
                                        router.replace('/(auth)/login')
                                    }}
                                >
                                    <Text style={S.modalConfirmText}>SIGN OUT</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Generic Alert/Confirm Modal ── */}
            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <TouchableOpacity
                    style={S.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowModal(false)}
                >
                    <View style={S.modalContainer}>
                        <TouchableOpacity activeOpacity={1} style={S.modalCard}>
                            <View style={[
                                S.modalIconBox,
                                {
                                    backgroundColor: (modalType === 'error' || modalType === 'danger') ? 'rgba(239,68,68,0.1)' :
                                        modalType === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(62,168,255,0.1)',
                                    borderColor: (modalType === 'error' || modalType === 'danger') ? 'rgba(239,68,68,0.2)' :
                                        modalType === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(62,168,255,0.2)'
                                }
                            ]}>
                                <MaterialIcons
                                    name={(modalType === 'error' || modalType === 'danger') ? 'report-problem' :
                                        modalType === 'success' ? 'check-circle' :
                                            modalType === 'confirm' ? 'help-outline' : 'info-outline'}
                                    size={30}
                                    color={(modalType === 'error' || modalType === 'danger') ? '#ef4444' :
                                        modalType === 'success' ? '#10b981' : '#3ea8ff'}
                                />
                            </View>
                            <Text style={S.modalTitle}>{modalTitle}</Text>
                            <Text style={[S.modalMessage, { marginBottom: (modalType === 'confirm' || modalType === 'danger') ? 12 : 24 }]}>
                                {modalMsg}
                            </Text>

                            {(modalType === 'confirm' || modalType === 'danger') ? (
                                <View style={S.modalActions}>
                                    <TouchableOpacity
                                        style={S.modalCancelBtn}
                                        onPress={() => setShowModal(false)}
                                    >
                                        <Text style={S.modalCancelText}>CANCEL</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[S.modalConfirmBtn, { backgroundColor: modalConfirmColor }]}
                                        onPress={() => {
                                            setShowModal(false)
                                            if (onModalConfirm) onModalConfirm()
                                        }}
                                    >
                                        <Text style={S.modalConfirmText}>{modalConfirmLabel}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[S.modalConfirmBtn, { backgroundColor: '#1c2e40', width: '100%' }]}
                                    onPress={() => {
                                        setShowModal(false)
                                        if (onModalConfirm) onModalConfirm()
                                    }}
                                >
                                    <Text style={S.modalConfirmText}>GOT IT</Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
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

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
    },
    modalCard: {
        backgroundColor: '#0d1f30',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1c2e40',
        padding: 24,
        alignItems: 'center',
    },
    modalIconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(239,68,68,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 12,
    },
    modalMessage: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 8,
    },
    modalSubMessage: {
        color: '#4a6480',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1c2e40',
    },
    modalCancelText: {
        color: '#4a6480',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
    },
    modalConfirmText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10,21,32,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    loadingText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 12,
    },
})
