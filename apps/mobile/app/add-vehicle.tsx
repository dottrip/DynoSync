import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { api, CreateVehicleInput } from '../../lib/api'

const DRIVETRAINS = ['FWD', 'RWD', 'AWD'] as const

export default function AddVehicleScreen() {
  const [form, setForm] = useState<CreateVehicleInput>({ make: '', model: '', year: new Date().getFullYear() })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.make || !form.model || !form.year) {
      Alert.alert('Missing fields', 'Make, model and year are required.')
      return
    }
    setLoading(true)
    try {
      await api.vehicles.create(form)
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
        <Text style={styles.title}>Add Vehicle</Text>
        <View style={{ width: 60 }} />
      </View>

      <TextInput style={styles.input} placeholder="Make (e.g. Subaru)" placeholderTextColor="#64748b"
        value={form.make} onChangeText={v => setForm(f => ({ ...f, make: v }))} />
      <TextInput style={styles.input} placeholder="Model (e.g. WRX STI)" placeholderTextColor="#64748b"
        value={form.model} onChangeText={v => setForm(f => ({ ...f, model: v }))} />
      <TextInput style={styles.input} placeholder="Year (e.g. 2018)" placeholderTextColor="#64748b"
        value={String(form.year)} onChangeText={v => setForm(f => ({ ...f, year: parseInt(v) || f.year }))}
        keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Trim (optional)" placeholderTextColor="#64748b"
        value={form.trim ?? ''} onChangeText={v => setForm(f => ({ ...f, trim: v }))} />

      <Text style={styles.label}>Drivetrain</Text>
      <View style={styles.drivetrainRow}>
        {DRIVETRAINS.map(d => (
          <TouchableOpacity key={d} style={[styles.drivetrainBtn, form.drivetrain === d && styles.drivetrainBtnActive]}
            onPress={() => setForm(f => ({ ...f, drivetrain: d }))}>
            <Text style={[styles.drivetrainText, form.drivetrain === d && styles.drivetrainTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Adding...' : 'Add to Garage'}</Text>
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
  input: { backgroundColor: '#1c2a38', color: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#314d68' },
  label: { color: '#64748b', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  drivetrainRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  drivetrainBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#314d68', alignItems: 'center' },
  drivetrainBtnActive: { backgroundColor: '#258cf4', borderColor: '#258cf4' },
  drivetrainText: { color: '#64748b', fontWeight: 'bold' },
  drivetrainTextActive: { color: '#fff' },
  button: { backgroundColor: '#258cf4', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
