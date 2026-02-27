import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { api, CreateModLogInput } from '../../lib/api'

const CATEGORIES = [
  { value: 'engine', label: 'Engine' },
  { value: 'exhaust', label: 'Exhaust' },
  { value: 'intake', label: 'Intake' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'brakes', label: 'Brakes' },
  { value: 'wheels', label: 'Wheels' },
  { value: 'aero', label: 'Aero' },
  { value: 'interior', label: 'Interior' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'other', label: 'Other' },
] as const

export default function AddModScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>()
  const [form, setForm] = useState<CreateModLogInput>({ category: 'engine', description: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.category || !form.description) {
      Alert.alert('Missing fields', 'Category and description are required.')
      return
    }
    setLoading(true)
    try {
      await api.mods.create(vehicleId, form)
      router.back()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Modification</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.label}>Category *</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.categoryBtn, form.category === cat.value && styles.categoryBtnActive]}
            onPress={() => setForm(f => ({ ...f, category: cat.value }))}
          >
            <Text style={[styles.categoryText, form.category === cat.value && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="e.g. Cobb Stage 2+ ECU tune, 93 octane map"
        placeholderTextColor="#64748b"
        value={form.description}
        onChangeText={v => setForm(f => ({ ...f, description: v }))}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Cost (USD)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 650"
        placeholderTextColor="#64748b"
        value={form.cost ? String(form.cost) : ''}
        onChangeText={v => setForm(f => ({ ...f, cost: parseFloat(v) || undefined }))}
        keyboardType="decimal-pad"
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Mod'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101922' },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  back: { color: '#258cf4', fontSize: 18 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  label: { color: '#64748b', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#314d68', backgroundColor: '#1c2a38' },
  categoryBtnActive: { backgroundColor: '#258cf4', borderColor: '#258cf4' },
  categoryText: { color: '#64748b', fontSize: 13, fontWeight: 'bold' },
  categoryTextActive: { color: '#fff' },
  input: { backgroundColor: '#1c2a38', color: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#314d68' },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: '#258cf4', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
