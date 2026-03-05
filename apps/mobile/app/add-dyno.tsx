import { useState, useCallback, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Platform, ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import { api, CreateDynoInput } from '../lib/api'
import { useDynoRecords } from '../hooks/useDynoRecords'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'
import { getTorqueUnit, convertTorque, parseTorque } from '../lib/units'
import { invalidateCache } from '../lib/cache'
import { UpgradePrompt } from '../components/UpgradePrompt'
import { useVehicleStore } from '../store/useVehicleStore'

// ─── 大数字 WHP 输入框 ────────────────────────────────────────────────────────
function BigNumberInput({
  value, onChange, unit, placeholder,
}: { value: string; onChange: (v: string) => void; unit: string; placeholder: string }) {
  return (
    <View style={B.row}>
      <TextInput
        style={B.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#2a3f55"
        keyboardType="decimal-pad"
        maxLength={6}
      />
      <Text style={B.unit}>{unit}</Text>
    </View>
  )
}

const B = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 6 },
  input: { flex: 1, color: '#fff', fontSize: 52, fontWeight: '900', paddingVertical: 0, letterSpacing: -1 },
  unit: { color: '#3ea8ff', fontSize: 20, fontWeight: '700', paddingBottom: 6, letterSpacing: 1 },
})

// ─── 主屏 ─────────────────────────────────────────────────────────────────────
export default function AddDynoScreen() {
  const { user } = useAuth()
  const { imperialUnits } = useSettings()
  const { vehicleId, editRecordId } = useLocalSearchParams<{ vehicleId: string; editRecordId?: string }>()
  const { records, hardRefetch } = useDynoRecords(vehicleId)
  const isEditing = !!editRecordId
  const editRecord = isEditing ? records.find(r => r.id === editRecordId) : null

  const [whp, setWhp] = useState(editRecord?.whp.toString() ?? '')
  const [torque, setTorque] = useState(
    editRecord?.torque_nm ? Math.round(convertTorque(editRecord.torque_nm, imperialUnits)!).toString() : ''
  )
  const [zeroSixty, setZeroSixty] = useState(editRecord?.zero_to_sixty?.toString() ?? '')
  const [quarterMile, setQuarterMile] = useState(editRecord?.quarter_mile?.toString() ?? '')
  const [notes, setNotes] = useState(editRecord?.notes ?? '')
  const [showExtra, setShowExtra] = useState(isEditing)
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { setVehicles } = useVehicleStore()

  // 上次记录（用于增益对比），编辑模式下对比前一条
  const recordIndex = isEditing ? records.findIndex(r => r.id === editRecordId) : -1
  const lastRecord = isEditing ? records[recordIndex + 1] : records[0]
  const currentWhp = parseFloat(whp) || 0
  const delta = lastRecord && currentWhp > 0 ? currentWhp - lastRecord.whp : null
  const deltaPct = delta !== null && lastRecord ? ((delta / lastRecord.whp) * 100) : null

  useFocusEffect(useCallback(() => {
    // We no longer hardRefetch here because LogDetail does it and updates the global cache.
    // This prevents overwriting user input.
  }, []))

  const isInitialized = useRef(false)

  // One-time initialization from editRecord (which comes from the cache seeded by LogDetail)
  useEffect(() => {
    if (editRecord && !isInitialized.current) {
      setWhp(editRecord.whp.toString())
      setTorque(editRecord.torque_nm ? Math.round(convertTorque(editRecord.torque_nm, imperialUnits)!).toString() : '')
      setZeroSixty(editRecord.zero_to_sixty?.toString() ?? '')
      setQuarterMile(editRecord.quarter_mile?.toString() ?? '')
      setNotes(editRecord.notes ?? '')
      isInitialized.current = true
    }
  }, [editRecord, imperialUnits])

  const handleSubmit = async () => {
    const whpNum = parseFloat(whp)
    if (!whpNum || whpNum <= 0) {
      Alert.alert('WHP Required', 'Enter a valid WHP value to commit this run.')
      return
    }
    setLoading(true)
    try {
      const body: CreateDynoInput = {
        whp: whpNum,
        torque_nm: parseTorque(parseFloat(torque), imperialUnits) || undefined,
        zero_to_sixty: parseFloat(zeroSixty) || undefined,
        quarter_mile: parseFloat(quarterMile) || undefined,
        notes: notes.trim() || undefined,
      }
      if (isEditing && editRecordId) {
        await api.dyno.update(vehicleId, editRecordId, body)
      } else {
        await api.dyno.create(vehicleId, body)
      }

      // Invalidate cache so subsequent navigations see fresh data
      invalidateCache(`dyno:${vehicleId}`)

      // Refresh vehicles to update Active/Project status counts globally
      const updatedVehicles = await api.vehicles.list()
      setVehicles(updatedVehicles)

      router.back()
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
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#3ea8ff" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>{isEditing ? 'EDIT DYNO RUN' : 'LOG DYNO RUN'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Last run comparison ── */}
        {lastRecord && (
          <View style={S.lastRunCard}>
            <View style={S.cardAccent} />
            <View>
              <Text style={S.lastRunLabel}>LAST RUN</Text>
              <Text style={S.lastRunDate}>{new Date(lastRecord.recorded_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
            </View>
            <Text style={S.lastRunWhp}>{lastRecord.whp} WHP</Text>
          </View>
        )}

        {/* ── AI Scan Option ── */}
        {!isEditing && (
          <TouchableOpacity
            style={S.aiScanBtn}
            onPress={() => router.push({
              pathname: '/ai-scan',
              params: { vehicleId }
            })}
          >
            <View style={S.aiScanIconBox}>
              <MaterialCommunityIcons name="auto-fix" size={20} color="#00f2ff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.aiScanTitle}>Smart AI Scan</Text>
              <Text style={S.aiScanSub}>Auto-extract from Dyno Sheet image</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#00f2ff" />
          </TouchableOpacity>
        )}

        {/* ── WHP Input ── */}
        <Text style={S.fieldLabel}>WHEEL HORSEPOWER *</Text>
        <BigNumberInput
          value={whp}
          onChange={setWhp}
          unit="WHP"
          placeholder="000"
        />

        {/* Delta indicator */}
        {delta !== null && deltaPct !== null && currentWhp > 0 && (
          <View style={[S.deltaRow, { backgroundColor: delta >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
            <MaterialIcons
              name={delta >= 0 ? 'arrow-upward' : 'arrow-downward'}
              size={16}
              color={delta >= 0 ? '#10b981' : '#ef4444'}
            />
            <Text style={[S.deltaText, { color: delta >= 0 ? '#10b981' : '#ef4444' }]}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(0)} WHP ({deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%) vs last run
            </Text>
          </View>
        )}

        {/* ── Divider ── */}
        <View style={S.divider} />

        {/* ── Extra fields toggle ── */}
        <TouchableOpacity style={S.toggleRow} onPress={() => setShowExtra(!showExtra)}>
          <Text style={S.toggleLabel}>ADDITIONAL DATA</Text>
          <MaterialIcons name={showExtra ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color="#3ea8ff" />
        </TouchableOpacity>

        {showExtra && (
          <>
            <View style={[S.inputRow, { marginTop: 12 }]}>
              <BigNumberInput value={torque} onChange={setTorque} unit={getTorqueUnit(imperialUnits).toUpperCase()} placeholder="000" />
              <Text style={S.inputLabel}>PEAK TORQUE</Text>
            </View>

            <Text style={[S.fieldLabel, { marginTop: 8 }]}>0–60 MPH</Text>
            <BigNumberInput value={zeroSixty} onChange={setZeroSixty} unit="SEC" placeholder="0.0" />

            <Text style={[S.fieldLabel, { marginTop: 8 }]}>1/4 MILE</Text>
            <BigNumberInput value={quarterMile} onChange={setQuarterMile} unit="SEC" placeholder="0.0" />

            <Text style={[S.fieldLabel, { marginTop: 8 }]}>NOTES</Text>
            <TextInput
              style={S.notesInput}
              placeholder="e.g. Stage 2 ECU, 93 octane, 75°F ambient..."
              placeholderTextColor="#2a3f55"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </>
        )}

      </ScrollView>

      {/* ── Footer CTA ── */}
      <View style={S.footer}>
        <TouchableOpacity style={S.cta} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="speed" size={18} color="#fff" />
              <Text style={S.ctaText}>{isEditing ? 'SAVE CHANGES' : 'COMMIT RUN'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Dyno Record Limit Reached"
        message="Upgrade to log unlimited dyno runs."
        feature="Unlimited dyno records"
      />
    </View>
  )
}

const C = { bg: '#0a1520', border: '#1c2e40', blue: '#3ea8ff', muted: '#4a6480', text: '#fff' }

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 12, paddingBottom: 120 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: C.text, fontSize: 13, fontWeight: '800', letterSpacing: 2 },

  // Last run card
  lastRunCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0d1f30', borderRadius: 12, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', marginBottom: 28, paddingVertical: 12, paddingHorizontal: 14, gap: 12,
  },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: C.blue },
  lastRunLabel: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  lastRunDate: { color: C.text, fontSize: 13, fontWeight: '600', marginTop: 2 },
  lastRunWhp: { color: C.blue, fontSize: 22, fontWeight: '900' },

  // AI Scan
  aiScanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#00f2ff08', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#00f2ff20', marginBottom: 28
  },
  aiScanIconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#00f2ff15', alignItems: 'center', justifyContent: 'center'
  },
  aiScanTitle: { color: '#00f2ff', fontSize: 15, fontWeight: '800' },
  aiScanSub: { color: '#64748b', fontSize: 11, fontWeight: '600', marginTop: 2 },

  fieldLabel: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },

  // Delta
  deltaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8,
  },
  deltaText: { fontSize: 13, fontWeight: '700' },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 20 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  toggleLabel: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2 },

  notesInput: {
    backgroundColor: '#0d1f30', color: C.text, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    borderWidth: 1, borderColor: C.border, textAlignVertical: 'top', minHeight: 80,
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: '#0a1520e0', // Slight transparency
    borderTopWidth: 1, borderTopColor: C.border,
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.blue, paddingVertical: 18, borderRadius: 16,
    minHeight: 52,
  },
  ctaText: { color: C.text, fontSize: 16, fontWeight: '800', letterSpacing: 2 },

  inputRow: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  inputLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
})
