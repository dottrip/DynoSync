import React from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

interface UpgradeSuccessModalProps {
    visible: boolean
    onClose: () => void
}

export function UpgradeSuccessModal({ visible, onClose }: UpgradeSuccessModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={S.overlay}>
                <View style={S.container}>
                    <LinearGradient
                        colors={['rgba(37, 140, 244, 0.2)', 'transparent']}
                        style={S.glow}
                    />

                    <View style={S.iconContainer}>
                        <LinearGradient
                            colors={['#3ea8ff', '#258cf4']}
                            style={S.iconCircle}
                        >
                            <MaterialIcons name="star" size={40} color="#fff" />
                        </LinearGradient>
                    </View>

                    <Text style={S.title}>Welcome to PRO</Text>
                    <Text style={S.subtitle}>Your account has been successfully upgraded. Experience the full power of DynoSync.</Text>

                    <View style={S.benefitsList}>
                        <BenefitItem icon="bolt" text="100 AI Credits Refilled" />
                        <BenefitItem icon="directions-car" text="Unlimited Vehicle Logs" />
                        <BenefitItem icon="leaderboard" text="Global Private Profile" />
                        <BenefitItem icon="history" text="No Watermark Sharing" />
                    </View>

                    <TouchableOpacity
                        style={S.actionBtn}
                        onPress={onClose}
                    >
                        <LinearGradient
                            colors={['#3ea8ff', '#258cf4']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={S.btnGradient}
                        >
                            <Text style={S.btnText}>GET STARTED</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

function BenefitItem({ icon, text }: { icon: any; text: string }) {
    return (
        <View style={S.benefitRow}>
            <View style={S.benefitIconBox}>
                <MaterialIcons name={icon} size={16} color="#3ea8ff" />
            </View>
            <Text style={S.benefitText}>{text}</Text>
        </View>
    )
}

const S = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        backgroundColor: '#0f172a',
        borderRadius: 32,
        padding: 32,
        width: '100%',
        maxWidth: 360,
        borderWidth: 1,
        borderColor: 'rgba(62, 168, 255, 0.2)',
        alignItems: 'center',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        top: -100,
        left: 0,
        right: 0,
        height: 300,
    },
    iconContainer: {
        width: 80,
        height: 80,
        marginBottom: 24,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#258cf4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    benefitsList: {
        width: '100%',
        marginBottom: 32,
        gap: 16,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    benefitIconBox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: 'rgba(62, 168, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    benefitText: {
        color: '#e2e8f0',
        fontSize: 14,
        fontWeight: '600',
    },
    actionBtn: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    btnGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
})
