import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Platform, ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { api, CreateModLogInput, ModLog } from '../lib/api'
import { useModLogs } from '../hooks/useModLogs'
import { UpgradePrompt } from '../components/UpgradePrompt'
import { useVehicleStore } from '../store/useVehicleStore'

// ─── 改装类别配置 ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'engine', label: 'Engine', icon: 'settings' as const, color: '#f59e0b' },
  { value: 'exhaust', label: 'Exhaust', icon: 'waves' as const, color: '#ef4444' },
  { value: 'intake', label: 'Intake', icon: 'air' as const, color: '#3ea8ff' },
  { value: 'suspension', label: 'Suspension', icon: 'airline-seat-flat' as const, color: '#8b5cf6' },
  { value: 'brakes', label: 'Brakes', icon: 'stop-circle' as const, color: '#dc2626' },
  { value: 'wheels', label: 'Wheels', icon: 'radio-button-unchecked' as const, color: '#6b7280' },
  { value: 'aero', label: 'Aero', icon: 'flight' as const, color: '#06b6d4' },
  { value: 'interior', label: 'Interior', icon: 'weekend' as const, color: '#a78bfa' },
  { value: 'electronics', label: 'Electronics', icon: 'memory' as const, color: '#10b981' },
  { value: 'other', label: 'Other', icon: 'build' as const, color: '#64748b' },
] as const

type Category = typeof CATEGORIES[number]['value']

export default function AddModScreen() {
  const { vehicleId, editLogId } = useLocalSearchParams<{ vehicleId: string; editLogId?: string }>()
  const { logs } = useModLogs(vehicleId)
  const isEditing = !!editLogId
  const editLog = isEditing ? logs.find(l => l.id === editLogId) : null

  const [category, setCategory] = useState<Category>(editLog?.category as Category ?? 'engine')
  const [description, setDescription] = useState(editLog?.description ?? '')
  const [cost, setCost] = useState(editLog?.cost?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { setVehicles } = useVehicleStore()

  const selectedCat = CATEGORIES.find(c => c.value === category)!

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Description Required', 'Describe the modification you made.')
      return
    }
    setLoading(true)
    try {
      const body: CreateModLogInput = {
        category: category.trim() as Category,
        description: description.trim(),
        cost: parseFloat(cost) || undefined,
      }
      if (isEditing && editLogId) {
        await api.mods.update(vehicleId, editLogId, body)
      } else {
        await api.mods.create(vehicleId, body)
      }

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
        <Text style={S.headerTitle}>{isEditing ? 'EDIT MOD LOG' : 'LOG NEW MOD'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Category selector ── */}
        <Text style={S.fieldLabel}>MOD CATEGORY</Text>
        <View style={S.categoryGrid}>
          {CATEGORIES.map(cat => {
            const active = category === cat.value
            return (
              <TouchableOpacity
                key={cat.value}
                style={[S.catChip, active && { borderColor: cat.color + '60', backgroundColor: cat.color + '18' }]}
                onPress={() => setCategory(cat.value)}
                activeOpacity={0.8}
              >
                <MaterialIcons name={cat.icon} size={16} color={active ? cat.color : '#3d5470'} />
                <Text style={[S.catLabel, active && { color: cat.color }]}>{cat.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* ── Selected category highlight ── */}
        <View style={[S.selectedBar, { borderColor: selectedCat.color + '40', backgroundColor: selectedCat.color + '0d' }]}>
          <MaterialIcons name={selectedCat.icon} size={20} color={selectedCat.color} />
          <Text style={[S.selectedBarText, { color: selectedCat.color }]}>
            {selectedCat.label.toUpperCase()} MODIFICATION
          </Text>
        </View>

        {/* ── Description ── */}
        <Text style={S.fieldLabel}>DESCRIPTION *</Text>
        <Text style={S.fieldHint}>Describe the mod, brand, model, and any relevant conditions.</Text>
        <TextInput
          style={S.textArea}
          placeholder={`e.g. Cobb Tune Stage 2+, 93 octane map. HKS intake installed with stock filter adapter.`}
          placeholderTextColor="#2a3f55"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* ── Cost (optional) ── */}
        <Text style={[S.fieldLabel, { marginTop: 8 }]}>COST (OPTIONAL)</Text>
        <View style={S.costRow}>
          <Text style={S.costCurrency}>$</Text>
          <TextInput
            style={S.costInput}
            placeholder="0.00"
            placeholderTextColor="#2a3f55"
            value={cost}
            onChangeText={setCost}
            keyboardType="decimal-pad"
          />
        </View>

      </ScrollView>

      {/* ── Footer CTA ── */}
      <View style={S.footer}>
        <TouchableOpacity style={[S.cta, { backgroundColor: selectedCat.color }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="add-circle-outline" size={18} color="#fff" />
              <Text style={S.ctaText}>{isEditing ? 'SAVE CHANGES' : 'COMMIT LOG'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Mod Log Limit Reached"
        message="Upgrade to log unlimited modifications."
        feature="Unlimited mod logs"
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

  fieldLabel: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  fieldHint: { color: '#2a3f55', fontSize: 12, lineHeight: 18, marginBottom: 10, marginTop: -4 },

  // Category grid
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#0d1f30', borderWidth: 1, borderColor: C.border,
  },
  catLabel: { color: C.muted, fontSize: 12, fontWeight: '600' },

  // Selected bar
  selectedBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 24,
  },
  selectedBarText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },

  // Description
  textArea: {
    backgroundColor: '#0d1f30', color: C.text, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, lineHeight: 22,
    borderWidth: 1, borderColor: C.border, minHeight: 120, marginBottom: 16,
  },

  // Cost
  costRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0d1f30', borderRadius: 10, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, gap: 4,
  },
  costCurrency: { color: C.muted, fontSize: 22, fontWeight: '700' },
  costInput: { flex: 1, color: C.text, fontSize: 22, fontWeight: '700', paddingVertical: 12 },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border,
  },
  cta: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52,
  },
  ctaText: { color: C.text, fontSize: 14, fontWeight: '800', letterSpacing: 2 },
})
