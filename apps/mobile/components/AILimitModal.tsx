import React from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTierLimits } from '../hooks/useTierLimits'

interface AILimitModalProps {
    visible: boolean
    onClose: () => void
}

export function AILimitModal({ visible, onClose }: AILimitModalProps) {
    const { tier } = useTierLimits()
    const isPro = tier === 'pro'

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={S.limitModalOverlay}>
                <View style={S.limitModal}>
                    <View style={S.limitIconContainer}>
                        <MaterialIcons name="bolt" size={32} color="#3ea8ff" />
                    </View>

                    <Text style={S.limitTitle}>AI Credits Exhausted</Text>
                    <Text style={S.limitMessage}>
                        {isPro
                            ? "You've used all your PRO AI credits for this billing cycle. Your credits will automatically reset on your next billing date."
                            : "You've used all your monthly AI credits. Upgrade to PRO for 100 credits per month or wait until your next billing cycle."}
                    </Text>

                    <View style={S.limitActions}>
                        {!isPro && (
                            <TouchableOpacity
                                style={S.upgradeActionBtn}
                                onPress={() => {
                                    onClose()
                                    router.push('/subscription')
                                }}
                            >
                                <Text style={S.upgradeActionText}>VIEW PRO PLANS</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[S.gotItBtn, isPro && { backgroundColor: '#3ea8ff', borderWidth: 0 }]}
                            onPress={onClose}
                        >
                            <Text style={[S.gotItText, isPro && { color: '#fff', fontWeight: '800' }]}>
                                {isPro ? 'Got it' : 'Maybe Later'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const S = StyleSheet.create({
    limitModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    limitModal: {
        backgroundColor: '#0f172a',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: 'rgba(62, 168, 255, 0.3)',
        alignItems: 'center',
    },
    limitIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(62, 168, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    limitTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
    },
    limitMessage: {
        color: '#94a3b8',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    limitActions: {
        width: '100%',
        gap: 12,
    },
    upgradeActionBtn: {
        backgroundColor: '#3ea8ff',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        width: '100%',
    },
    upgradeActionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    gotItBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    gotItText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '700',
    },
})
