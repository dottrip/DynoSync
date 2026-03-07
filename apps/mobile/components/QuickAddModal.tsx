import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, FlatList, Image, ScrollView } from 'react-native'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import { Vehicle } from '../lib/api'

interface QuickAddModalProps {
    visible: boolean
    onClose: () => void
    activeVehicleId: string | null
    vehicles: Vehicle[]
    onSelectVehicle: (id: string) => void
    onAddVehicle: () => void
    onAddDyno: (vehicleId: string) => void
    onAddMod: (vehicleId: string) => void
}

export function QuickAddModal({
    visible, onClose, activeVehicleId, vehicles,
    onSelectVehicle, onAddVehicle, onAddDyno, onAddMod
}: QuickAddModalProps) {
    const scale = useRef(new Animated.Value(0.9)).current
    const opacity = useRef(new Animated.Value(0)).current
    const [showSelector, setShowSelector] = useState(false)

    const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || vehicles[0]

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
            setShowSelector(false)
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
                            <View>
                                <Text style={styles.title}>Quick Action</Text>
                                <Text style={styles.subTitle}>Select a record type to log</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <MaterialIcons name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* --- Target Vehicle Selector --- */}
                        <TouchableOpacity
                            style={styles.targetVehicleCard}
                            onPress={() => setShowSelector(!showSelector)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.carThumb}>
                                {activeVehicle?.image_url ? (
                                    <Image source={{ uri: activeVehicle.image_url }} style={styles.carImg} />
                                ) : (
                                    <MaterialIcons name="directions-car" size={20} color="#258cf4" />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.targetLabel}>LOGGING FOR</Text>
                                <Text style={styles.targetName} numberOfLines={1}>
                                    {activeVehicle?.year} {activeVehicle?.make} {activeVehicle?.model}
                                </Text>
                            </View>
                            <MaterialIcons
                                name={showSelector ? "keyboard-arrow-up" : "unfold-more"}
                                size={20}
                                color="#258cf4"
                            />
                        </TouchableOpacity>

                        {showSelector && (
                            <ScrollView style={styles.selectorList} bounces={false}>
                                {vehicles.map(v => (
                                    <TouchableOpacity
                                        key={v.id}
                                        style={[styles.selectorItem, v.id === activeVehicle?.id && styles.selectorItemActive]}
                                        onPress={() => {
                                            onSelectVehicle(v.id)
                                            setShowSelector(false)
                                        }}
                                    >
                                        <Text style={[styles.selectorItemText, v.id === activeVehicle?.id && { color: '#fff' }]}>
                                            {v.year} {v.make} {v.model}
                                        </Text>
                                        {v.id === activeVehicle?.id && (
                                            <MaterialIcons name="check" size={16} color="#258cf4" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.optionsGrid}>
                            <TouchableOpacity style={styles.optionBtn} onPress={() => { onClose(); setTimeout(() => onAddDyno(activeVehicle.id), 50) }} activeOpacity={0.7}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(37,140,244,0.12)', borderColor: 'rgba(37,140,244,0.3)' }]}>
                                    <MaterialIcons name="speed" size={24} color="#258cf4" />
                                </View>
                                <Text style={styles.optionText}>Dyno Run</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionBtn} onPress={() => { onClose(); setTimeout(() => onAddMod(activeVehicle.id), 50) }} activeOpacity={0.7}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }]}>
                                    <MaterialIcons name="build" size={24} color="#10b981" />
                                </View>
                                <Text style={styles.optionText}>Mod Log</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionBtn} onPress={() => { onClose(); setTimeout(onAddVehicle, 50) }} activeOpacity={0.7}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' }]}>
                                    <MaterialIcons name="add-circle-outline" size={24} color="#f59e0b" />
                                </View>
                                <Text style={styles.optionText}>New Build</Text>
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
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#1c2e40',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
    },
    subTitle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    closeBtn: {
        padding: 4,
    },

    // Target Vehicle Card
    targetVehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(37,140,244,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(37,140,244,0.15)',
        borderRadius: 16,
        padding: 12,
        gap: 12,
    },
    carThumb: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#0a1520',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    carImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    targetLabel: {
        color: '#258cf4',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    targetName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 1,
    },

    selectorList: {
        backgroundColor: '#0a1520',
        borderRadius: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#1c2e40',
        overflow: 'hidden',
        maxHeight: 240,
    },
    selectorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1c2e40',
    },
    selectorItemActive: {
        backgroundColor: 'rgba(37,140,244,0.08)',
    },
    selectorItemText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '600',
    },

    divider: {
        height: 1,
        backgroundColor: '#1c2e40',
        marginVertical: 24,
    },

    optionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    optionBtn: {
        flex: 1,
        alignItems: 'center',
        gap: 10,
    },
    iconBox: {
        width: 68,
        height: 68,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
})
