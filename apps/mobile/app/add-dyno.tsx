import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { api, CreateDynoInput } from '../../lib/api'

export default function AddDynoScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>()
  const [form, setForm] = useState<CreateDynoInput>({ whp: 0 })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.whp || form.whp <= 0) {
      Alert.alert('Missing fields', 'WHP is required.')
      return
    }
    setLoading(true)
    try {
      await api.dyno.create(vehicleId, form)
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
        <Text style={styles.title}>Log Dyno Run</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.label}>WHP *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 348"
        placeholderTextColor="#64748b"
        value={form.whp ? String(form.whp) : ''}
        onChangeText={v => setForm(f => ({ ...f, whp: parseFloat(v) || 0 }))}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Torque (Nm)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 390"
        placeholderTextColor="#64748b"
        value={form.torque_nm ? String(form.torque_nm) : ''}
        onChangeText={v => setForm(f => ({ ...f, torque_nm: parseFloat(v) || undefined }))}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>0-60 mph (seconds)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 4.2"
        placeholderTextColor="#64748b"
        value={form.zero_to_sixty ? String(form.zero_to_sixty) : ''}
        onChangeText={v => setForm(f => ({ ...f, zero_to_sixty: parseFloat(v) || undefined }))}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="e.g. Stage 2 ECU, 93 octane, 75°F ambient"
        placeholderTextColor="#64748b"
        value={form.notes ?? ''}
        onChangeText={v => setForm(f => ({ ...f, notes: v }))}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Dyno Run'}</Text>
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
  input: { backgroundColor: '#1c2a38', color: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#314d68' },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: '#258cf4', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
