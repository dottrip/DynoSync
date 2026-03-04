import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Platform, Switch,
} from 'react-native'
import Slider from '@react-native-community/slider'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { useTierLimits } from '../hooks/useTierLimits'
import { UpgradePrompt } from '../components/UpgradePrompt'
import { useImagePicker } from '../hooks/useImagePicker'
import { Image, ActivityIndicator } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { useVehicles } from '../hooks/useVehicles'
import { useSettings } from '../hooks/useSettings'
import { getTorqueUnit } from '../lib/units'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRef } from 'react'

// ─── 常量 ──────────────────────────────────────────────────────────────────────
const POPULAR_MAKES = ['Nissan', 'Toyota', 'Honda', 'Subaru', 'BMW', 'Audi', 'Ford', 'Mitsubishi']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 35 }, (_, i) => CURRENT_YEAR - i)

type Drivetrain = 'FWD' | 'RWD' | 'AWD'

// --- Drivetrain H-frame icon (hub + axle beam + propshaft) ---
function DrivetrainIcon({ type, active }: { type: Drivetrain; active: boolean }) {
  const hiColor = active ? '#3ea8ff' : '#4a6480'
  const dimColor = '#2a3f55'

  const frontHi = type === 'FWD' || type === 'AWD'
  const rearHi = type === 'RWD' || type === 'AWD'

  const W = 58; const H = 72
  const hubW = 10; const hubH = 22; const hubR = 3
  const axleH = 7; const axleR = 3
  const axleW = W - hubW * 2
  const frontY = 8
  const rearY = H - frontY - hubH
  const axleBarY_F = frontY + (hubH - axleH) / 2
  const axleBarY_R = rearY + (hubH - axleH) / 2
  const shaftTop = axleBarY_F + axleH / 2
  const shaftBot = axleBarY_R + axleH / 2
  const awdShaftColor = type === 'AWD' ? (active ? '#3ea8ff99' : '#3d5470') : '#1c2e40'

  return (
    <View style={{ width: W, height: H, position: 'relative' }}>
      {/* propshaft */}
      <View style={{
        position: 'absolute', left: W / 2 - 1.5, top: shaftTop,
        height: shaftBot - shaftTop, width: 3, backgroundColor: awdShaftColor, borderRadius: 2
      }} />
      {/* front-left hub */}
      <View style={{
        position: 'absolute', left: 0, top: frontY,
        width: hubW, height: hubH, borderRadius: hubR, backgroundColor: frontHi ? hiColor : dimColor
      }} />
      {/* front axle beam */}
      <View style={{
        position: 'absolute', left: hubW, top: axleBarY_F,
        width: axleW, height: axleH, borderRadius: axleR, backgroundColor: frontHi ? hiColor : dimColor
      }} />
      {/* front-right hub */}
      <View style={{
        position: 'absolute', right: 0, top: frontY,
        width: hubW, height: hubH, borderRadius: hubR, backgroundColor: frontHi ? hiColor : dimColor
      }} />
      {/* rear-left hub */}
      <View style={{
        position: 'absolute', left: 0, top: rearY,
        width: hubW, height: hubH, borderRadius: hubR, backgroundColor: rearHi ? hiColor : dimColor
      }} />
      {/* rear axle beam */}
      <View style={{
        position: 'absolute', left: hubW, top: axleBarY_R,
        width: axleW, height: axleH, borderRadius: axleR, backgroundColor: rearHi ? hiColor : dimColor
      }} />
      {/* rear-right hub */}
      <View style={{
        position: 'absolute', right: 0, top: rearY,
        width: hubW, height: hubH, borderRadius: hubR, backgroundColor: rearHi ? hiColor : dimColor
      }} />
    </View>
  )
}




// ─── 滑块组件（原生 Slider）──────────────────────────────────────────────────
function SliderField({
  label, unit, value, min, max, step = 1, labels, onChange, promptTitle
}: {
  label: string; unit: string; value: number; min: number; max: number
  step?: number; labels: string[]; onChange: (v: number) => void; promptTitle: string
}) {
  const [liveValue, setLiveValue] = useState(value)

  // Sync internal state if upstream value changes (e.g. async AI auto-fill)
  useEffect(() => {
    setLiveValue(value)
  }, [value])

  return (
    <View style={S.sliderBlock}>
      <View style={S.sliderHeader}>
        <Text style={S.sliderLabel}>{label}</Text>
        <TouchableOpacity
          onPress={() => Alert.prompt?.(promptTitle, 'Enter value:', v => {
            if (v) { const n = Number(v) || value; setLiveValue(n); onChange(n) }
          })}
        >
          <MaterialIcons name="edit" size={16} color="#3ea8ff" />
        </TouchableOpacity>
      </View>
      <Text style={S.sliderValue}>
        {liveValue.toLocaleString()} <Text style={S.sliderUnit}>{unit}</Text>
      </Text>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={liveValue}
        onValueChange={setLiveValue}
        onSlidingComplete={onChange}
        minimumTrackTintColor="#3ea8ff"
        maximumTrackTintColor="#1c2e40"
        thumbTintColor="#3ea8ff"
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        {labels.map((l: string) => (
          <Text key={l} style={{ color: '#3d5470', fontSize: 10 }}>{l}</Text>
        ))}
      </View>
    </View>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export default function AddVehicleScreen() {
  const { user } = useAuth()
  const { vehicles, refetch } = useVehicles()
  const { imperialUnits } = useSettings()
  const { canAddVehicle, limits } = useTierLimits()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [step, setStep] = useState(1) // 1 = Basic Specs, 2 = Performance Baseline
  const [loading, setLoading] = useState(false)

  const [inputMode, setInputMode] = useState<'vin' | 'manual'>('vin')
  const [vin, setVin] = useState('') // --- Scanner Logic ---
  const [showScanner, setShowScanner] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const cameraRef = useRef<CameraView>(null)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()

  // Step 1: Vehicle Data State
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(CURRENT_YEAR)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [trim, setTrim] = useState('')
  const [drivetrain, setDrivetrain] = useState<Drivetrain | undefined>(undefined)
  const [isPublic, setIsPublic] = useState(true)
  const [imageUri, setImageUri] = useState<string | null>(null)

  const { pickImage, takePhoto, uploadImage, uploading: imageUploading } = useImagePicker()

  // Step 2 state
  const [stockHp, setStockHp] = useState(250)
  const [stockTorque, setStockTorque] = useState(300)
  const [curbWeight, setCurbWeight] = useState(3500)
  const [aiBaselineMsg, setAiBaselineMsg] = useState('')
  const [aiBaselineLoading, setAiBaselineLoading] = useState(false)

  // -- VIN Cleaning Helper --
  const cleanVIN = (text: string) => {
    // 行业标准规则：VIN 不包含 I, O, Q
    // 直接拦截并转换：I -> 1, O -> 0, Q -> 0
    return text.toUpperCase().replace(/[^A-Z0-9]/g, '')
      .replace(/[OQ]/gi, '0')
      .replace(/I/gi, '1')
  }

  const handleCaptureAndOCR = async () => {
    if (!cameraRef.current || isScanning) return

    try {
      setIsScanning(true)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true,
      })

      if (!photo?.base64) throw new Error('Failed to capture image')

      const result = await api.ai.scanVin(photo.base64)
      if (result.vin) {
        const cleaned = cleanVIN(result.vin)
        setVin(cleaned)
        setShowScanner(false)
        handleDecodeVIN(cleaned)
      } else {
        Alert.alert('Scan Result', 'Could not detect a clear 17-character VIN. Please try again.')
      }
    } catch (e: any) {
      console.error('OCR Error:', e)
      Alert.alert('Error', e.message || 'Failed to analyze image')
    } finally {
      setIsScanning(false)
    }
  }

  // -- NHTSA VIN Decoding --
  const handleDecodeVIN = async (v: string) => {
    const cleanedVin = cleanVIN(v)
    if (!cleanedVin || cleanedVin.length < 11) {
      Alert.alert('Invalid VIN', 'Please enter a valid VIN string (at least 11 characters).')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${cleanedVin}?format=json`)
      const data = await res.json()
      const result = data.Results?.[0]
      if (!result || result.ErrorCode !== '0') {
        // Fallback to manual mode if NHTSA fails. Avoid technical jargon.
        Alert.alert(
          'Vehicle Not Found',
          'We couldn\'t automatically find specs for this VIN (this is common for non-US market or older vehicles). Please enter the details manually.'
        )
        setInputMode('manual')
        return
      }

      if (result.Make) setMake(result.Make)
      if (result.Model) setModel(result.Model)
      if (result.ModelYear) {
        const yr = parseInt(result.ModelYear, 10)
        if (!isNaN(yr)) setYear(yr)
      }
      if (result.Trim) setTrim(result.Trim)

      const dtCode = result.DriveType?.toLowerCase() || ''
      if (dtCode.includes('fwd') || dtCode.includes('front')) setDrivetrain('FWD')
      else if (dtCode.includes('rwd') || dtCode.includes('rear')) setDrivetrain('RWD')
      else if (dtCode.includes('awd') || dtCode.includes('4wd') || dtCode.includes('all')) setDrivetrain('AWD')

      // Step 2 extraction (if available) - NHTSA Fallback
      let extractedSpecs = []
      if (result.EngineHP) {
        const hp = parseInt(result.EngineHP, 10)
        if (!isNaN(hp) && hp > 0) {
          setStockHp(hp)
          extractedSpecs.push(`${hp} HP`)
        }
      }

      let specsMsg = extractedSpecs.length > 0
        ? `\nAuto-filled from VIN: ${extractedSpecs.join(', ')}.`
        : `\nNote: Public VIN registries lack precise Torque/Weight.`

      let baseMsg = `Vehicle decoded successfully.${specsMsg}`

      // Extract year safely for AI call
      const safeYear = result.ModelYear ? parseInt(result.ModelYear, 10) : 0

      // Auto-extract Baseline Specs with AI
      try {
        setAiBaselineLoading(true)
        const specs = await api.ai.fetchBaselineSpecs({
          make: result.Make || '',
          model: result.Model || '',
          year: !isNaN(safeYear) ? safeYear : 0,
          trim: result.Trim || ''
        })

        // Treat specs as any to tolerate Gemini key drifting
        const aiRaw: any = specs || {}
        const whp = parseInt(aiRaw.whp || aiRaw.hp || aiRaw.horsepower || 0, 10)
        const torque = parseInt(aiRaw.torque_nm || aiRaw.torque || aiRaw.tq || 0, 10)
        const weight = parseInt(aiRaw.weight_lbs || aiRaw.weight || aiRaw.curb_weight || 0, 10)

        let aiMsg = ''
        if (!isNaN(whp) && whp > 0) { setStockHp(whp); aiMsg += `\n• WHP: ~${whp}` }
        if (!isNaN(torque) && torque > 0) { setStockTorque(torque); aiMsg += `\n• Torque: ~${torque} NM` }
        if (!isNaN(weight) && weight > 0) { setCurbWeight(weight); aiMsg += `\n• Weight: ~${weight} lbs` }

        if (aiMsg) {
          // Replace fallback message heavily if AI succeeds
          baseMsg = `Vehicle Specs Decoded.\n\n✨ AI Extracted Expected Baseline Specs:${aiMsg}`
          setAiBaselineMsg('Successfully extracted baselines using AI.')
        }
      } catch (err: any) {
        console.warn('AI Baseline Extraction Failed:', err)
        if (err?.message?.includes('AI_LIMIT_REACHED')) {
          setAiBaselineMsg('No AI credits left to auto-fill performance specs.')
        } else {
          setAiBaselineMsg('Failed to connect to AI for advanced baselines.')
        }
      } finally {
        setAiBaselineLoading(false)
        setInputMode('manual')
      }

      Alert.alert('Success', `${baseMsg}\n\nPlease review and edit if necessary.`)

    } catch (e: any) {
      Alert.alert('API Error', 'Failed to connect to decoding service.')
      setInputMode('manual')
    } finally {
      setLoading(false)
    }
  }

  const goNext = () => {
    if (!canAddVehicle) { setShowUpgrade(true); return }
    if (!make.trim() || !model.trim()) {
      Alert.alert('Missing Info', 'Please enter a Make and Model first.')
      return
    }
    setStep(2)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      let imageUrl: string | undefined

      if (imageUri) {
        const uploadedUrl = await uploadImage(imageUri)
        if (uploadedUrl) imageUrl = uploadedUrl
      }

      // 1. 创建车辆
      const vehicle = await api.vehicles.create({
        make: make.trim(),
        model: model.trim(),
        year,
        trim: trim.trim() || undefined,
        drivetrain,
        image_url: imageUrl,
        is_public: isPublic,
      })

      // 2. 写入原厂基准 Dyno 记录（让 DASH 立即显示 Stock WHP）
      if (stockHp > 0) {
        await api.dyno.create(vehicle.id, {
          whp: stockHp,
          torque_nm: stockTorque > 0 ? stockTorque : undefined,
          notes: 'Stock baseline',
        })
      }

      router.replace('/(tabs)/garage')
    } catch (e: any) {
      if (e.message?.includes('limit reached')) {
        setShowUpgrade(true)
      } else {
        Alert.alert('Error', e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={S.root}>
      {/* ── Header ── */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)} style={S.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#3ea8ff" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>{step === 1 ? 'Add New Build' : 'Performance Baseline'}</Text>
        <View style={S.stepBadge}>
          <Text style={S.stepBadgeText}>{step}/2</Text>
        </View>
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {step === 1 ? (
          /* ══════════════════════════════════════════════════════
             STEP 1 — BASIC SPECS
          ══════════════════════════════════════════════════════ */
          <>
            <Text style={S.pageTitle}>Basic Specs</Text>
            <Text style={S.pageDesc}>Initialize your tuning log with the base vehicle configuration.</Text>

            {/* Mode Toggle */}
            <View style={S.modeToggleRow}>
              <TouchableOpacity
                style={[S.modeToggleBtn, inputMode === 'vin' && S.modeToggleBtnActive]}
                onPress={() => setInputMode('vin')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="qr-code-scanner" size={16} color={inputMode === 'vin' ? '#fff' : '#64748b'} />
                <Text style={[S.modeToggleText, inputMode === 'vin' && S.modeToggleTextActive]}>VIN Auto-Fill</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.modeToggleBtn, inputMode === 'manual' && S.modeToggleBtnActive]}
                onPress={() => setInputMode('manual')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="edit" size={16} color={inputMode === 'manual' ? '#fff' : '#64748b'} />
                <Text style={[S.modeToggleText, inputMode === 'manual' && S.modeToggleTextActive]}>Manual Entry</Text>
              </TouchableOpacity>
            </View>

            {inputMode === 'vin' ? (
              /* --- VIN ENTRY MODE --- */
              <View style={S.vinModeContainer}>
                {showScanner ? (
                  /* Scanner Box (Option 3: AI Backend) */
                  <View style={S.scannerBox}>
                    {cameraPermission?.granted ? (
                      <>
                        <CameraView
                          ref={cameraRef}
                          style={StyleSheet.absoluteFill}
                          facing="back"
                          autofocus="on"
                        />
                        {/* Overlay as a sibling to avoid warning */}
                        <View style={S.ocrOverlay}>
                          <View style={S.ocrFrame} />
                          {isScanning ? (
                            <ActivityIndicator size="large" color="#258cf4" style={{ marginTop: 20 }} />
                          ) : (
                            <>
                              <Text style={S.ocrTip}>Align VIN inside the box</Text>
                              <View style={S.antiGlareNotice}>
                                <MaterialIcons name="wb-sunny" size={14} color="#f59e0b" />
                                <Text style={S.antiGlareText}>Please avoid glare & reflections on the glass</Text>
                              </View>

                              {/* Capture Trigger */}
                              <TouchableOpacity
                                style={S.captureBtn}
                                onPress={handleCaptureAndOCR}
                                disabled={isScanning}
                              >
                                <View style={S.captureBtnInner} />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </>
                    ) : (
                      <View style={S.ocrOverlay}>
                        <TouchableOpacity style={S.requestBtn} onPress={requestCameraPermission}>
                          <Text style={S.requestBtnText}>Allow Camera Access</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity style={S.closeScannerBtn} onPress={() => setShowScanner(false)}>
                      <MaterialIcons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={S.vinInputWrapper}>
                      <TextInput
                        style={S.vinInput}
                        placeholder="Enter 17-digit VIN"
                        placeholderTextColor="#4a6480"
                        value={vin}
                        onChangeText={v => setVin(v.toUpperCase())}
                        autoCapitalize="characters"
                        maxLength={17}
                      />
                      <TouchableOpacity
                        style={S.scanIconBtn}
                        onPress={() => setShowScanner(true)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MaterialIcons name="center-focus-strong" size={24} color="#3ea8ff" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[S.decodeBtn, (!vin || vin.length < 11) && S.decodeBtnDisabled]}
                      onPress={() => handleDecodeVIN(vin)}
                      disabled={!vin || vin.length < 11 || loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <MaterialIcons name="auto-awesome" size={20} color={(!vin || vin.length < 11) ? '#64748b' : '#fff'} />
                          <Text style={[S.decodeBtnText, (!vin || vin.length < 11) && S.decodeBtnTextDisabled]}>Decode & Auto-Fill</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
                <Text style={S.vinHint}>Enter your Vehicle Identification Number for instant specs gathering.</Text>
              </View>
            ) : (
              /* --- MANUAL ENTRY MODE --- */
              <View style={S.manualModeContainer}>
                {/* Photo upload placeholder */}
                <TouchableOpacity
                  style={[S.photoBox, imageUri ? S.photoBoxActive : {}]}
                  activeOpacity={0.8}
                  onPress={async () => {
                    Alert.alert(
                      'Vehicle Photo',
                      'Choose photo source',
                      [
                        { text: 'Camera', onPress: async () => { const uri = await takePhoto(); if (uri) setImageUri(uri) } },
                        { text: 'Gallery', onPress: async () => { const uri = await pickImage(); if (uri) setImageUri(uri) } },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    )
                  }}
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
                      {/* 线框底盘背景装饰 */}
                      <View style={S.photoCornerTL} />
                      <View style={S.photoCornerBR} />
                      <MaterialIcons name="photo-camera" size={20} color="#3ea8ff" />
                      <Text style={S.photoText}>UPLOAD PHOTO (OPTIONAL)</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* MAKE chips */}
                <Text style={S.fieldLabel}>MAKE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                    {POPULAR_MAKES.map(m => (
                      <TouchableOpacity
                        key={m}
                        style={[S.makeChip, make === m && S.makeChipActive]}
                        onPress={() => setMake(m)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons
                          name="directions-car"
                          size={14}
                          color={make === m ? '#3ea8ff' : '#4a6480'}
                        />
                        <Text style={[S.makeChipText, make === m && S.makeChipTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {/* Custom make input */}
                <TextInput
                  style={[S.input, { marginBottom: 16 }]}
                  placeholder="Or type custom make..."
                  placeholderTextColor="#3d5470"
                  value={POPULAR_MAKES.includes(make) ? '' : make}
                  onChangeText={setMake}
                />

                {/* MODEL */}
                <Text style={S.fieldLabel}>MODEL</Text>
                <View style={S.inputRow}>
                  <TextInput
                    style={[S.input, { flex: 1 }]}
                    placeholder="e.g. Skyline GT-R"
                    placeholderTextColor="#3d5470"
                    value={model}
                    onChangeText={setModel}
                  />
                  <MaterialIcons name="edit" size={16} color="#3d5470" style={{ marginLeft: 8, alignSelf: 'center' }} />
                </View>

                {/* YEAR + TRIM */}
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
                        <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
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
                      placeholder="e.g. V-Spec"
                      placeholderTextColor="#3d5470"
                      value={trim}
                      onChangeText={setTrim}
                    />
                  </View>
                </View>

                {/* DRIVETRAIN */}
                <Text style={[S.fieldLabel, { marginTop: 8 }]}>DRIVETRAIN CONFIGURATION</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {(['FWD', 'RWD', 'AWD'] as Drivetrain[]).map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[S.driveCard, drivetrain === d && S.driveCardActive]}
                      onPress={() => setDrivetrain(d)}
                      activeOpacity={0.8}
                    >
                      {drivetrain === d && (
                        <MaterialIcons
                          name="check-circle"
                          size={14}
                          color="#3ea8ff"
                          style={{ position: 'absolute', top: 6, right: 6 }}
                        />
                      )}
                      <DrivetrainIcon type={d} active={drivetrain === d} />
                      <Text style={[S.driveLabel, drivetrain === d && S.driveLabelActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* PUBLIC TOGGLE */}
                <View style={S.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={S.fieldLabel}>PUBLIC VISIBILITY</Text>
                    <Text style={S.toggleDesc}>
                      Allow others to see this vehicle and its dyno stats on the leaderboard.
                    </Text>
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                    trackColor={{ false: '#1c2e40', true: 'rgba(62,168,255,0.4)' }}
                    thumbColor={isPublic ? '#3ea8ff' : '#4a6480'}
                  />
                </View>
              </View>
            )}
          </>
        ) : (
          /* ══════════════════════════════════════════════════════
             STEP 2 — PERFORMANCE BASELINE
          ══════════════════════════════════════════════════════ */
          <>
            <Text style={S.pageTitle}>Set Baseline Stats</Text>
            <Text style={S.pageDesc}>
              Enter your vehicle's stock performance figures manually or scan your VIN to auto-fill specs.
            </Text>

            {/* VIN Scanner */}
            <TouchableOpacity
              style={S.vinButton}
              activeOpacity={0.85}
              onPress={() => Alert.alert('VIN Scanner', 'Point your camera at the VIN plate on the windshield dashboard. AI will auto-fill your vehicle specs.\n\n(Camera integration coming soon)')}
            >
              <MaterialIcons name="qr-code-scanner" size={22} color="#3ea8ff" />
              <Text style={S.vinButtonText}>SCAN VIN TO AUTO-FILL</Text>
            </TouchableOpacity>

            {/* Stock HP */}
            <SliderField
              label="STOCK HORSEPOWER" promptTitle="Stock HP" unit="WHP"
              value={stockHp} min={0} max={600} step={5}
              labels={['0', '200', '400', '600+']}
              onChange={setStockHp}
            />

            {/* Stock Torque */}
            <SliderField
              label="STOCK TORQUE" promptTitle="Stock Torque" unit={getTorqueUnit(imperialUnits).toUpperCase()}
              value={stockTorque} min={0} max={600} step={5}
              labels={['0', '200', '400', '600+']}
              onChange={setStockTorque}
            />

            {/* Curb Weight */}
            <SliderField
              label="CURB WEIGHT" promptTitle="Curb Weight" unit="LBS"
              value={curbWeight} min={1500} max={6000} step={50}
              labels={['0', '2k', '4k', '6k+']}
              onChange={setCurbWeight}
            />

            <Text style={S.hint}>Stats can be refined later in vehicle settings</Text>
          </>
        )}
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={S.footer}>
        {step === 1 ? (
          <TouchableOpacity
            style={[S.cta, aiBaselineLoading && inputMode === 'vin' && S.ctaDisabled]}
            onPress={goNext}
            activeOpacity={0.85}
            disabled={aiBaselineLoading && inputMode === 'vin'}
          >
            {aiBaselineLoading && inputMode === 'vin' ? (
              <>
                <Text style={S.ctaText}>AI EXTRACTING SPECS...</Text>
                <ActivityIndicator size="small" color="#fff" />
              </>
            ) : (
              <>
                <Text style={S.ctaText}>Next Step</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={S.cta} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            <Text style={S.ctaText}>{loading ? 'INITIALIZING…' : 'INITIALIZE GARAGE ENTRY'}</Text>
            {!loading && <MaterialIcons name="arrow-forward" size={18} color="#fff" />}
          </TouchableOpacity>
        )}
      </View>

      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Vehicle Limit Reached"
        message={`You've reached the limit of ${limits.vehicles} vehicle${limits.vehicles > 1 ? 's' : ''} on your current plan.`}
        feature="Up to unlimited vehicles"
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = { bg: '#0a1520', card: '#111d2b', border: '#1c2e40', blue: '#3ea8ff', muted: '#4a6480', text: '#fff' }

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 12, paddingBottom: 120 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  stepBadge: { backgroundColor: 'rgba(62,168,255,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(62,168,255,0.3)' },
  stepBadgeText: { color: C.blue, fontSize: 12, fontWeight: '800' },

  // Mode Toggle
  modeToggleRow: { flexDirection: 'row', backgroundColor: '#0d1f30', borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: '#1c2e40' },
  modeToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 8 },
  modeToggleBtnActive: { backgroundColor: '#1c2e40' },
  modeToggleText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  modeToggleTextActive: { color: '#fff' },

  vinModeContainer: { minHeight: 250 },
  manualModeContainer: { paddingTop: 4 },

  // VIN Input
  vinInputWrapper: { position: 'relative', marginBottom: 16 },
  vinInput: {
    backgroundColor: '#0d1f30', color: '#fff', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 18, fontSize: 18, fontWeight: '700',
    borderWidth: 1.5, borderColor: '#258cf440', letterSpacing: 2
  },
  scanIconBtn: { position: 'absolute', right: 16, top: 16 },
  decodeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#258cf4', paddingVertical: 18, borderRadius: 12
  },
  decodeBtnDisabled: { backgroundColor: '#1c2e40' },
  decodeBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  decodeBtnTextDisabled: { color: '#64748b' },
  vinHint: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 16 },

  // Scanner Box
  scannerBox: { height: 260, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#258cf4', position: 'relative', backgroundColor: '#000' },
  ocrOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  ocrFrame: { width: '85%', height: 60, borderWidth: 2, borderColor: '#258cf4', borderRadius: 8, backgroundColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 10 },
  ocrTip: { color: '#fff', marginTop: 16, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  antiGlareNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  antiGlareText: { color: '#f59e0b', fontSize: 11, fontWeight: '600' },
  captureBtn: {
    position: 'absolute', bottom: 20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center'
  },
  captureBtnInner: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff'
  },
  closeScannerBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  requestBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#258cf4', borderRadius: 10 },
  requestBtnText: { color: '#fff', fontWeight: '700' },

  // Page header
  pageTitle: { color: C.text, fontSize: 28, fontWeight: '900', marginBottom: 8, marginTop: 8 },
  pageDesc: { color: C.muted, fontSize: 13, lineHeight: 20, marginBottom: 24 },

  // Photo box
  photoBox: {
    height: 130, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(62,168,255,0.3)',
    backgroundColor: 'rgba(62,168,255,0.05)',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28,
    overflow: 'hidden',
  },
  photoBoxActive: {
    paddingVertical: 0,
    borderWidth: 0,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 21, 32, 0.4)',
  },
  photoCornerTL: { position: 'absolute', top: 10, left: 10, width: 16, height: 16, borderTopWidth: 2, borderLeftWidth: 2, borderColor: C.blue },
  photoCornerBR: { position: 'absolute', bottom: 10, right: 10, width: 16, height: 16, borderBottomWidth: 2, borderRightWidth: 2, borderColor: C.blue },
  photoText: { color: C.blue, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },

  // Field label
  fieldLabel: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },

  // Make chips
  makeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(28,46,64,0.8)', borderWidth: 1, borderColor: C.border,
  },
  makeChipActive: { backgroundColor: 'rgba(62,168,255,0.15)', borderColor: 'rgba(62,168,255,0.5)' },
  makeChipText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  makeChipTextActive: { color: C.blue, fontWeight: '700' },

  // Input
  input: {
    backgroundColor: '#0d1f30', color: C.text, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },

  // Year picker
  yearDropdown: {
    position: 'absolute', top: 52, left: 0, right: 0, zIndex: 99,
    backgroundColor: '#0d1f30', borderWidth: 1, borderColor: C.border, borderRadius: 10, overflow: 'hidden',
  },
  yearItem: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  yearItemActive: { backgroundColor: 'rgba(62,168,255,0.1)' },
  yearItemText: { color: C.text, fontSize: 14 },

  // Drivetrain cards
  driveCard: {
    flex: 1, backgroundColor: '#0d1f30', borderRadius: 12, borderWidth: 1,
    borderColor: C.border, alignItems: 'center', paddingVertical: 14, gap: 6, marginBottom: 8,
  },
  driveCardActive: { borderColor: 'rgba(62,168,255,0.5)', backgroundColor: 'rgba(62,168,255,0.08)' },
  driveLabel: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  driveLabelActive: { color: C.blue },

  // Toggle
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0d1f30', borderRadius: 12, padding: 16,
    marginTop: 16, borderWidth: 1, borderColor: C.border,
  },
  toggleDesc: { color: C.muted, fontSize: 12, marginTop: 2, marginRight: 16 },

  // VIN Button
  vinButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: 'rgba(62,168,255,0.5)', borderRadius: 12,
    backgroundColor: 'rgba(62,168,255,0.06)',
    paddingVertical: 16, marginBottom: 32,
  },
  vinButtonText: { color: C.blue, fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },

  // Sliders
  sliderBlock: { marginBottom: 28 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sliderLabel: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  sliderValue: { color: C.text, fontSize: 32, fontWeight: '900', marginBottom: 10 },
  sliderUnit: { color: C.muted, fontSize: 16, fontWeight: '600' },

  hint: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },

  // Footer CTA
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border,
  },
  cta: {
    backgroundColor: '#258cf4', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaText: { color: C.text, fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  ctaDisabled: { backgroundColor: '#1c2e40', opacity: 0.8 },
})
