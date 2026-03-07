import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'

interface AuthAlertModalProps {
    visible: boolean
    onClose: () => void
    title: string
    message: string
    type: 'error' | 'success' | 'info'
}

export function AuthAlertModal({
    visible, onClose, title, message, type
}: AuthAlertModalProps) {
    const scale = useRef(new Animated.Value(0.9)).current
    const opacity = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
                Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
            ]).start()
        } else {
            Animated.parallel([
                Animated.timing(scale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]).start()
        }
    }, [visible])

    if (!visible) return null

    const getIcon = () => {
        switch (type) {
            case 'success': return <MaterialIcons name="check-circle" size={32} color="#10b981" />
            case 'info': return <MaterialIcons name="info-outline" size={32} color="#3ea8ff" />
            default: return <MaterialIcons name="error-outline" size={32} color="#ef4444" />
        }
    }

    const getIconBg = () => {
        switch (type) {
            case 'success': return 'rgba(16,185,129,0.1)'
            case 'info': return 'rgba(62,168,255,0.1)'
            default: return 'rgba(239,68,68,0.1)'
        }
    }

    const getIconBorder = () => {
        switch (type) {
            case 'success': return 'rgba(16,185,129,0.2)'
            case 'info': return 'rgba(62,168,255,0.2)'
            default: return 'rgba(239,68,68,0.2)'
        }
    }

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[styles.overlay, { opacity }]}>
                <TouchableOpacity style={styles.backdropPress} activeOpacity={1} onPress={onClose} />

                <View style={styles.modalContainer} pointerEvents="box-none">
                    <Animated.View style={[styles.modal, { transform: [{ scale }] }]}>
                        <View style={[styles.iconBox, { backgroundColor: getIconBg(), borderColor: getIconBorder() }]}>
                            {getIcon()}
                        </View>

                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
                            <Text style={styles.buttonText}>GOT IT</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Animated.View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(8,16,24,0.85)',
    },
    backdropPress: {
        flex: 1,
    },
    modalContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modal: {
        backgroundColor: '#111d2b',
        borderRadius: 28,
        padding: 28,
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: '#1c2e40',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    message: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#258cf4',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
})
