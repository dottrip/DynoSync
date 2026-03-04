import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'

interface QuickAddModalProps {
    visible: boolean
    onClose: () => void
    onAddVehicle: () => void
    onAddDyno: () => void
    onAddMod: () => void
}

export function QuickAddModal({ visible, onClose, onAddVehicle, onAddDyno, onAddMod }: QuickAddModalProps) {
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

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[styles.overlay, { opacity }]}>
                <TouchableOpacity style={styles.backdropPress} activeOpacity={1} onPress={onClose} />

                <View style={styles.modalContainer} pointerEvents="box-none">
                    <Animated.View style={[styles.modal, { transform: [{ scale }] }]}>
                        <View style={styles.header}>
                            <Text style={styles.title}>What would you like to log?</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <MaterialIcons name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.optionsGrid}>
                            <TouchableOpacity style={styles.optionBtn} onPress={() => { onClose(); setTimeout(onAddVehicle, 50) }} activeOpacity={0.7}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(37,140,244,0.12)', borderColor: 'rgba(37,140,244,0.3)' }]}>
                                    <MaterialIcons name="directions-car" size={24} color="#258cf4" />
                                </View>
                                <Text style={styles.optionText}>Vehicle</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionBtn} onPress={() => { onClose(); setTimeout(onAddDyno, 50) }} activeOpacity={0.7}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' }]}>
                                    <MaterialIcons name="speed" size={24} color="#f59e0b" />
                                </View>
                                <Text style={styles.optionText}>Dyno Run</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionBtn} onPress={() => { onClose(); setTimeout(onAddMod, 50) }} activeOpacity={0.7}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                                    <MaterialIcons name="build" size={24} color="#10b981" />
                                </View>
                                <Text style={styles.optionText}>Modification</Text>
                            </TouchableOpacity>
                        </View>
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
        paddingHorizontal: 20,
    },
    modal: {
        backgroundColor: '#111d2b',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 380,
        borderWidth: 1,
        borderColor: '#1c2e40',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    closeBtn: {
        padding: 4,
    },
    optionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    optionBtn: {
        flex: 1,
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '700',
    },
})
