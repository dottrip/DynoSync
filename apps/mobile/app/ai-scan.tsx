import { useState, useRef, useEffect } from 'react'
import {
    View, Text, TouchableOpacity, StyleSheet, Animated,
    ActivityIndicator, Platform, Image, Dimensions, Alert
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { api } from '../lib/api'

const { width, height } = Dimensions.get('window')

export default function AiScanScreen() {
    const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>()
    const [permission, requestPermission] = useCameraPermissions()
    const [image, setImage] = useState<string | null>(null)
    const [scanning, setScanning] = useState(false)
    const [progress, setProgress] = useState(0)
    const [flash, setFlash] = useState(false)
    const [showResult, setShowResult] = useState(false)
    const [scanResult, setScanResult] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)

    const cameraRef = useRef<any>(null)
    const scanAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (!permission) requestPermission()
    }, [])

    const takePicture = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: true,
            })
            setImage(photo.uri)
            startScan(photo.base64 || '')
        }
    }

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        })

        if (!result.canceled) {
            setImage(result.assets[0].uri)
            // Backend needs the base64 string
            startScan(result.assets[0].base64 || '')
        }
    }

    const startScan = async (base64: string) => {
        setScanning(true)
        setProgress(0.1)
        setShowResult(false)

        // Scanning line animation
        const scanAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
                Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
            ])
        )
        scanAnimation.start()

        try {
            // Real API Call
            const res = await api.ai.analyzeDyno(base64)
            setScanResult(res)

            // Slow down the progress bar for effect
            let p = 0.1
            const iv = setInterval(() => {
                p += 0.1
                setProgress(p)
                if (p >= 1) {
                    clearInterval(iv)
                    setShowResult(true)
                    scanAnimation.stop()
                }
            }, 150)

        } catch (e: any) {
            Alert.alert("Scan Failed", e.message)
            setScanning(false)
        }
    }

    const saveResult = async () => {
        if (!vehicleId || !scanResult) {
            Alert.alert("Error", "No vehicle selected or no scan data.")
            return
        }
        setIsSaving(true)
        try {
            await api.dyno.create(vehicleId, {
                whp: scanResult.whp,
                torque_nm: scanResult.torque,
                notes: `AI Scan Extract: ${scanResult.notes || 'No notes'}`,
                recorded_at: scanResult.recorded_at
            })
            Alert.alert("Success", "Dyno record saved to your vehicle.")
            router.back()
        } catch (err: any) {
            Alert.alert("Save Error", err.message)
            setIsSaving(false)
        }
    }

    const scanLineTranslate = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 240],
    })

    return (
        <View style={S.root}>
            {/* Header */}
            <View style={S.header}>
                <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={S.headerTitle}>{scanning ? 'AI Analysis' : 'Scan Dyno Sheet'}</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={S.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>

            {!scanning ? (
                <View style={S.cameraContainer}>
                    {permission?.granted ? (
                        <CameraView
                            style={S.camera}
                            ref={cameraRef}
                            enableTorch={flash}
                        >
                            {/* Frame Overlay */}
                            <View style={S.overlayContainer}>
                                <View style={S.instructionBox}>
                                    <MaterialIcons name="crop-free" size={16} color="#258cf4" />
                                    <Text style={S.instructionText}>Align graph within frame</Text>
                                </View>

                                <View style={S.viewfinder}>
                                    <View style={[S.corner, S.topLeft]} />
                                    <View style={[S.corner, S.topRight]} />
                                    <View style={[S.corner, S.bottomLeft]} />
                                    <View style={[S.corner, S.bottomRight]} />
                                    <View style={S.centerLine} />
                                </View>

                                <Text style={S.tipText}>Make sure lighting is even and text is legible.</Text>
                            </View>
                        </CameraView>
                    ) : (
                        <View style={[S.camera, S.placeholder]}>
                            <ActivityIndicator color="#258cf4" />
                            <Text style={{ color: '#64748b', marginTop: 12 }}>Waiting for camera permissions...</Text>
                        </View>
                    )}

                    {/* Camera Controls */}
                    <View style={S.cameraFooter}>
                        <TouchableOpacity style={S.sideBtn} onPress={pickImage}>
                            <MaterialIcons name="photo-library" size={24} color="#fff" />
                            <Text style={S.sideBtnText}>Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={S.shutterBtn} onPress={takePicture}>
                            <View style={S.shutterInner} />
                        </TouchableOpacity>

                        <TouchableOpacity style={S.sideBtn} onPress={() => setFlash(!flash)}>
                            <MaterialIcons name={flash ? "flash-on" : "flash-off"} size={24} color="#fff" />
                            <Text style={S.sideBtnText}>{flash ? 'Flash On' : 'Flash Off'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={S.content}>
                    <Text style={S.mainTitle}>{showResult ? 'Scan Complete' : 'Processing Dyno Sheet'}</Text>
                    <Text style={S.subTitle}>
                        {showResult ? 'Review extracted metrics before saving' : 'Identifying curves and extracting metrics...'}
                    </Text>

                    {/* Scanning Window */}
                    <View style={S.scanWindow}>
                        {image && <Image source={{ uri: image }} style={S.previewImg} />}

                        <View style={S.techOverlay}>
                            <View style={S.grid} />
                            {!showResult && <Animated.View style={[S.scanLine, { transform: [{ translateY: scanLineTranslate }] }]} />}

                            {(showResult || progress > 0.4) && scanResult && (
                                <View style={[S.pin, { top: '35%', left: '50%' }]}>
                                    <View style={S.pinDot} />
                                    <View style={S.pinBadge}><Text style={S.pinText}>{scanResult.whp} WHP</Text></View>
                                </View>
                            )}
                            {(showResult || progress > 0.7) && scanResult && (
                                <View style={[S.pin, { top: '55%', left: '45%' }]}>
                                    <View style={[S.pinDot, { backgroundColor: '#bc13fe' }]} />
                                    <View style={[S.pinBadge, { backgroundColor: '#bc13fe' }]}><Text style={S.pinText}>{scanResult.torque} NM</Text></View>
                                </View>
                            )}

                            {!showResult && (
                                <View style={S.statusTextContainer}>
                                    <MaterialCommunityIcons name="refresh" size={14} color="#fff" style={{ marginRight: 4 }} />
                                    <Text style={S.statusText}>Analyzing vector paths...</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {!showResult ? (
                        <>
                            {/* Progress Section */}
                            <View style={S.progressSection}>
                                <View style={S.progHead}>
                                    <Text style={S.progTitle}>Analysis Progress</Text>
                                    <Text style={S.progPercent}>{Math.round(Math.min(progress, 1) * 100)}%</Text>
                                </View>
                                <View style={S.track}>
                                    <View style={[S.fill, { width: `${Math.min(progress, 1) * 100}%` }]} />
                                </View>
                            </View>

                            <View style={S.infoGroup}>
                                <View style={S.infoCard}>
                                    <MaterialCommunityIcons name="brain" size={24} color="#258cf4" style={S.checkIcon} />
                                    <Text style={S.infoLabel}>Peak WHP</Text>
                                    <Text style={S.infoValue}>{progress > 0.5 && scanResult ? `${scanResult.whp}` : '---'}</Text>
                                    <View style={S.verifiedBadge}>
                                        <MaterialIcons name={progress > 0.5 ? "check-circle" : "radio-button-unchecked"} size={10} color={progress > 0.5 ? "#258cf4" : "#64748b"} />
                                        <Text style={[S.verifiedText, { color: progress > 0.5 ? "#258cf4" : "#64748b" }]}>Detected</Text>
                                    </View>
                                </View>
                                <View style={S.infoCard}>
                                    <MaterialCommunityIcons name="lightning-bolt" size={24} color="#bc13fe" style={S.checkIcon} />
                                    <Text style={S.infoLabel}>Max Torque</Text>
                                    <Text style={S.infoValue}>{progress > 0.8 && scanResult ? `${scanResult.torque}` : '---'}</Text>
                                    <View style={S.verifiedBadge}>
                                        <MaterialIcons name={progress > 0.8 ? "check-circle" : "radio-button-unchecked"} size={10} color={progress > 0.8 ? "#bc13fe" : "#64748b"} />
                                        <Text style={[S.verifiedText, { color: progress > 0.8 ? "#bc13fe" : "#64748b" }]}>Detected</Text>
                                    </View>
                                </View>
                            </View>
                        </>
                    ) : (
                        <View style={S.resultActions}>
                            <View style={S.infoGroup}>
                                <View style={[S.infoCard, { borderColor: '#258cf4' }]}>
                                    <Text style={S.infoLabel}>Extracted WHP</Text>
                                    <Text style={[S.infoValue, { color: '#258cf4' }]}>{scanResult.whp}</Text>
                                </View>
                                <View style={[S.infoCard, { borderColor: '#bc13fe' }]}>
                                    <Text style={S.infoLabel}>Extracted NM</Text>
                                    <Text style={[S.infoValue, { color: '#bc13fe' }]}>{scanResult.torque}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={S.saveBtn}
                                onPress={saveResult}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <MaterialIcons name="save" size={20} color="#fff" />
                                        <Text style={S.saveBtnText}>Save to Vehicle Logs</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={S.discardBtn}
                                onPress={() => setScanning(false)}
                                disabled={isSaving}
                            >
                                <Text style={S.discardBtnText}>Discard and Rescan</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {scanning && !showResult && (
                <View style={S.footer}>
                    <View style={S.processingBtn}>
                        <ActivityIndicator color="#64748b" style={{ marginRight: 8 }} />
                        <Text style={S.processingText}>Analysis in Progress...</Text>
                    </View>
                </View>
            )}
        </View>
    )
}

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#101922' },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15,
        borderBottomWidth: 1, borderBottomColor: '#1c2e40'
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
    headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },
    cancelText: { color: '#64748b', fontSize: 14, fontWeight: '600' },

    content: { padding: 20 },
    mainTitle: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 20 },
    subTitle: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 20 },

    cameraContainer: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1, position: 'relative' },
    overlayContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    instructionBox: {
        position: 'absolute', top: 60, flexDirection: 'row', alignItems: 'center',
        gap: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16,
        paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#258cf440'
    },
    instructionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    viewfinder: {
        width: width * 0.85, height: width * 1.1,
        borderWidth: 0, position: 'relative'
    },
    corner: { position: 'absolute', width: 40, height: 40, borderColor: '#258cf4', borderWidth: 4 },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    centerLine: { position: 'absolute', top: '50%', width: '100%', height: 1, backgroundColor: '#258cf460' },
    tipText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, position: 'absolute', bottom: 120 },

    cameraFooter: {
        position: 'absolute', bottom: 40, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
        paddingHorizontal: 20
    },
    shutterBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', padding: 4 },
    shutterInner: { flex: 1, borderRadius: 36, borderWidth: 2, borderColor: '#000' },
    sideBtn: { alignItems: 'center', gap: 6 },
    sideBtnText: { color: '#fff', fontSize: 10, fontWeight: '600' },

    scanWindow: {
        width: '100%', height: 260, backgroundColor: '#1a2632', borderRadius: 20,
        overflow: 'hidden', borderWidth: 1, borderColor: '#258cf440', position: 'relative'
    },
    previewImg: { width: '100%', height: '100%', opacity: 0.5 },
    placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    techOverlay: { ...StyleSheet.absoluteFillObject },
    grid: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.1,
        borderWidth: 1, borderColor: '#258cf430'
    },
    scanLine: {
        width: '100%', height: 4, backgroundColor: '#258cf4',
        shadowColor: '#258cf4', shadowRadius: 15, shadowOpacity: 1
    },
    pin: { position: 'absolute', alignItems: 'center' },
    pinDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#258cf4', borderWidth: 2, borderColor: '#fff' },
    pinBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#258cf4', borderRadius: 4 },
    pinText: { color: '#fff', fontSize: 10, fontWeight: '800' },

    statusTextContainer: {
        position: 'absolute', bottom: 12, left: 16, flexDirection: 'row', alignItems: 'center'
    },
    statusText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontStyle: 'italic' },

    progressSection: { marginTop: 24 },
    progHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
    progPercent: { color: '#258cf4', fontWeight: '900', fontSize: 15 },
    track: { height: 8, backgroundColor: '#1c2e40', borderRadius: 4, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: '#258cf4', borderRadius: 4 },

    infoGroup: { flexDirection: 'row', gap: 12, marginTop: 32 },
    infoCard: {
        flex: 1, padding: 16, backgroundColor: '#1a2632', borderRadius: 16,
        borderWidth: 1, borderColor: '#258cf430', position: 'relative'
    },
    checkIcon: { position: 'absolute', top: 12, right: 12, opacity: 0.2 },
    infoLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    infoValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
    verifiedBadge: { marginTop: 4, flexDirection: 'row', alignItems: 'center' },
    verifiedText: { color: '#258cf4', fontSize: 10, fontWeight: '600', marginLeft: 4 },

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1, borderTopColor: '#1c2e40'
    },
    pickBtn: {
        flexDirection: 'row', paddingVertical: 18, backgroundColor: '#258cf4',
        borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 10
    },
    pickBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    processingBtn: {
        flexDirection: 'row', paddingVertical: 18, backgroundColor: '#1c2e40',
        borderRadius: 16, alignItems: 'center', justifyContent: 'center'
    },
    processingText: { color: '#64748b', fontSize: 16, fontWeight: '800' },

    resultActions: { marginTop: 24, gap: 12 },
    saveBtn: {
        flexDirection: 'row', paddingVertical: 18, backgroundColor: '#258cf4',
        borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 10,
        shadowColor: '#258cf4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    discardBtn: {
        paddingVertical: 16, alignItems: 'center', justifyContent: 'center'
    },
    discardBtnText: { color: '#64748b', fontSize: 14, fontWeight: '600' }
})
