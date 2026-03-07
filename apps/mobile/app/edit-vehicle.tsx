import { useState, useEffect } from 'react'
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ScrollView, Platform, Modal,
    Image, ActivityIndicator
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { useVehicles } from '../hooks/useVehicles'
import { useImagePicker } from '../hooks/useImagePicker'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - i)
const POPULAR_MAKES = ['Nissan', 'Toyota', 'Honda', 'Subaru', 'BMW', 'Audi', 'Ford', 'Mitsubishi']

type Drivetrain = 'FWD' | 'RWD' | 'AWD'

export default function EditVehicleScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const { vehicles, refetch } = useVehicles()
    const vehicle = vehicles.find(v => v.id === id)

    const [loading, setLoading] = useState(false)
    const [make, setMake] = useState('')
    const [model, setModel] = useState('')
    const [year, setYear] = useState(CURRENT_YEAR)
    const [showYearPicker, setShowYearPicker] = useState(false)
    const [trim, setTrim] = useState('')
    const [drivetrain, setDrivetrain] = useState<Drivetrain | undefined>(undefined)
    const [isPublic, setIsPublic] = useState(false)
    const [imageUri, setImageUri] = useState<string | null>(null)
    const [showPhotoSource, setShowPhotoSource] = useState(false)

    const { pickImage, takePhoto, uploadImage, uploading: imageUploading } = useImagePicker()

    useEffect(() => {
        if (vehicle) {
            setMake(vehicle.make)
            setModel(vehicle.model)
            setYear(vehicle.year)
            setTrim(vehicle.trim || '')
            setDrivetrain(vehicle.drivetrain as Drivetrain)
            setIsPublic(vehicle.is_public || false)
            setImageUri(vehicle.image_url || null)
        }
    }, [vehicle])

    const handleSave = async () => {
        if (!make.trim() || !model.trim()) {
            Alert.alert('Missing Info', 'Please enter a Make and Model.')
            return
        }

        setLoading(true)
        try {
            let imageUrl = imageUri
            let thumbUrl: string | undefined
            // Only upload if it's a new local URI (starts with file:// or contains cache)
            if (imageUri && (imageUri.startsWith('file://') || imageUri.includes('ExponentExperienceData'))) {
                const result = await uploadImage(imageUri)
                if (result) {
                    imageUrl = result.imageUrl
                    thumbUrl = result.thumbUrl
                }
            }

            await api.vehicles.update(id, {
                make: make.trim(),
                model: model.trim(),
                year,
                trim: trim.trim() || undefined,
                drivetrain,
                image_url: imageUrl || undefined,
                image_thumb_url: thumbUrl,
                is_public: isPublic,
            })

            await refetch()
            router.back()
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to update vehicle')
        } finally {
            setLoading(false)
        }
    }

    const handlePickImage = async () => {
        const uri = await pickImage()
        if (uri) setImageUri(uri)
        setShowPhotoSource(false)
    }

    const handleTakePhoto = async () => {
        const uri = await takePhoto()
        if (uri) setImageUri(uri)
        setShowPhotoSource(false)
    }

    if (!vehicle) return null

    return (
        <View style={S.root}>
            {/* Header */}
            <View style={S.header}>
                <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
                    <MaterialIcons name="close" size={24} color="#3ea8ff" />
                </TouchableOpacity>
                <Text style={S.headerTitle}>Edit Vehicle</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading || imageUploading}>
                    {loading || imageUploading ? (
                        <ActivityIndicator size="small" color="#3ea8ff" />
                    ) : (
                        <Text style={S.saveBtnText}>SAVE</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={S.scroll} contentContainerStyle={S.content} keyboardShouldPersistTaps="handled">
                {/* Photo Section */}
                <TouchableOpacity
                    style={S.photoBox}
                    activeOpacity={0.8}
                    onPress={() => setShowPhotoSource(true)}
                >
                    {imageUri ? (
                        <>
                            <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} />
                            <View style={S.photoOverlay} />
                            <MaterialIcons name="edit" size={20} color="#fff" />
                            <Text style={[S.photoText, { color: '#fff' }]}>CHANGE PHOTO</Text>
                        </>
                    ) : (
                        <>
                            <MaterialIcons name="photo-camera" size={24} color="#3ea8ff" />
                            <Text style={S.photoText}>UPLOAD VEHICLE PHOTO</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Form Fields */}
                <View style={S.section}>
                    <Text style={S.fieldLabel}>MAKE</Text>
                    <TextInput
                        style={S.input}
                        value={make}
                        onChangeText={setMake}
                        placeholder="e.g. Nissan"
                        placeholderTextColor="#3d5470"
                    />

                    <Text style={S.fieldLabel}>MODEL</Text>
                    <TextInput
                        style={S.input}
                        value={model}
                        onChangeText={setModel}
                        placeholder="e.g. Skyline GT-R"
                        placeholderTextColor="#3d5470"
                    />

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={S.fieldLabel}>YEAR</Text>
                            <TouchableOpacity
                                style={[S.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                                onPress={() => setShowYearPicker(!showYearPicker)}
                            >
                                <Text style={{ color: '#fff', fontSize: 16 }}>{year}</Text>
                                <MaterialIcons name="keyboard-arrow-down" size={20} color="#3ea8ff" />
                            </TouchableOpacity>
                            {showYearPicker && (
                                <View style={S.yearDropdown}>
                                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                                        {YEARS.map(y => (
                                            <TouchableOpacity
                                                key={y}
                                                style={[S.yearItem, y === year && S.yearItemActive]}
                                                onPress={() => { setYear(y); setShowYearPicker(false) }}
                                            >
                                                <Text style={[S.yearItemText, y === year && { color: '#3ea8ff' }]}>{y}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={S.fieldLabel}>TRIM</Text>
                            <TextInput
                                style={S.input}
                                value={trim}
                                onChangeText={setTrim}
                                placeholder="e.g. V-Spec II"
                                placeholderTextColor="#3d5470"
                            />
                        </View>
                    </View>

                    <Text style={S.fieldLabel}>DRIVETRAIN</Text>
                    <View style={S.driveRow}>
                        {(['FWD', 'RWD', 'AWD'] as Drivetrain[]).map(d => (
                            <TouchableOpacity
                                key={d}
                                style={[S.driveBtn, drivetrain === d && S.driveBtnActive]}
                                onPress={() => setDrivetrain(d)}
                            >
                                <Text style={[S.driveBtnText, drivetrain === d && S.driveBtnTextActive]}>{d}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                </View>

                {/* Delete Action (Optional, but good UX) */}
                <TouchableOpacity
                    style={S.deleteBtn}
                    onPress={() => {
                        Alert.alert(
                            "Archive Build",
                            "Are you sure you want to archive this vehicle? It will be hidden from your garage.",
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Archive",
                                    style: "destructive",
                                    onPress: async () => {
                                        try {
                                            await api.vehicles.archive(id)
                                            await refetch()
                                            router.replace('/(tabs)/garage')
                                        } catch (e: any) {
                                            Alert.alert('Error', e.message)
                                        }
                                    }
                                }
                            ]
                        )
                    }}
                >
                    <MaterialIcons name="archive" size={18} color="#ef4444" />
                    <Text style={S.deleteBtnText}>ARCHIVE VEHICLE</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Photo Source Modal */}
            <Modal visible={showPhotoSource} transparent animationType="slide">
                <TouchableOpacity style={S.modalOverlay} onPress={() => setShowPhotoSource(false)}>
                    <View style={S.modalCard}>
                        <Text style={S.modalTitle}>Choose PhotoSource</Text>
                        <TouchableOpacity style={S.sourceBtn} onPress={handleTakePhoto}>
                            <MaterialIcons name="photo-camera" size={24} color="#3ea8ff" />
                            <Text style={S.sourceText}>Take New Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={S.sourceBtn} onPress={handlePickImage}>
                            <MaterialIcons name="photo-library" size={24} color="#3ea8ff" />
                            <Text style={S.sourceText}>Choose from Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={S.cancelBtn} onPress={() => setShowPhotoSource(false)}>
                            <Text style={S.cancelText}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    )
}

const C = { bg: '#0a1520', card: '#111d2b', border: '#1c2e40', blue: '#3ea8ff', muted: '#4a6480', text: '#fff' }

const S = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
    saveBtnText: { color: C.blue, fontSize: 15, fontWeight: '800', marginRight: 8 },

    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 60 },

    photoBox: {
        height: 180, width: '100%', borderRadius: 16, backgroundColor: '#0d1f30',
        borderWidth: 2, borderColor: C.border, borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        marginBottom: 24,
    },
    photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    photoText: { color: C.blue, fontSize: 12, fontWeight: '800', marginTop: 8 },

    section: { gap: 16 },
    fieldLabel: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
    input: {
        backgroundColor: '#0d1f30', borderRadius: 12, borderWidth: 1, borderColor: C.border,
        paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 16,
    },

    yearDropdown: {
        position: 'absolute', top: 75, left: 0, right: 0, zIndex: 100,
        backgroundColor: '#162838', borderRadius: 12, borderWidth: 1, borderColor: C.blue,
        maxHeight: 200, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    yearItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    yearItemActive: { backgroundColor: 'rgba(62,168,255,0.1)' },
    yearItemText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    driveRow: { flexDirection: 'row', gap: 10 },
    driveBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#0d1f30',
        borderWidth: 1, borderColor: C.border, alignItems: 'center',
    },
    driveBtnActive: { borderColor: C.blue, backgroundColor: 'rgba(62,168,255,0.1)' },
    driveBtnText: { color: C.muted, fontSize: 13, fontWeight: '800' },
    driveBtnTextActive: { color: C.blue },

    toggleRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 16, marginTop: 8, borderTopWidth: 1, borderTopColor: C.border,
    },
    toggleTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
    toggleSub: { color: C.muted, fontSize: 12, marginTop: 2 },

    switchBase: { width: 50, height: 26, borderRadius: 13, backgroundColor: '#1c2e40', padding: 3 },
    switchActive: { backgroundColor: C.blue },
    switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#4a6480' },
    switchThumbActive: { backgroundColor: '#fff', transform: [{ translateX: 24 }] },

    deleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 40, paddingVertical: 12,
    },
    deleteBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '800', letterSpacing: 1 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#111d2b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
    sourceBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    sourceText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    cancelBtn: { marginTop: 20, paddingVertical: 12, alignItems: 'center' },
    cancelText: { color: C.muted, fontSize: 15, fontWeight: '700' },
})
