import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Platform,
  KeyboardAvoidingView, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '../lib/api'

const FEEDBACK_TYPES = [
  { id: 'bug', label: 'Bug Report', icon: 'bug-report' as const, color: '#ef4444' },
  { id: 'suggestion', label: 'Suggestion', icon: 'lightbulb' as const, color: '#f59e0b' },
  { id: 'other', label: 'Other', icon: 'chat' as const, color: '#3ea8ff' },
]

export default function FeedbackScreen() {
  const [type, setType] = useState('suggestion')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) { Alert.alert('Please enter a message'); return }
    setSubmitting(true)
    try {
      await api.feedback.submit(type, message)
      Alert.alert('Thank you!', 'Your feedback has been submitted.', [
        { text: 'OK', onPress: () => router.back() },
      ])
      setMessage('')
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={S.root}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#3ea8ff" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Send Feedback</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

          <Text style={S.sectionLabel}>TYPE</Text>
          <View style={S.typeRow}>
            {FEEDBACK_TYPES.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[S.typeChip, type === t.id && { borderColor: t.color, backgroundColor: t.color + '18' }]}
                onPress={() => setType(t.id)}
                activeOpacity={0.8}
              >
                <MaterialIcons name={t.icon} size={16} color={type === t.id ? t.color : '#4a6480'} />
                <Text style={[S.typeChipText, type === t.id && { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={S.sectionLabel}>MESSAGE</Text>
          <TextInput
            style={S.input}
            placeholder="Describe the issue or suggestion..."
            placeholderTextColor="#2a3f55"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            autoFocus
          />

          <TouchableOpacity style={S.submitBtn} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="send" size={16} color="#fff" />
                <Text style={S.submitBtnText}>SUBMIT</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a1520' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1c2e40',
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center' },

  content: { padding: 20 },

  sectionLabel: { color: '#4a6480', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  typeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: '#1c2e40', borderRadius: 12,
    paddingVertical: 12, backgroundColor: '#0d1f30',
  },
  typeChipText: { color: '#4a6480', fontSize: 12, fontWeight: '700' },

  input: {
    backgroundColor: '#0d1f30', color: '#fff',
    borderRadius: 12, borderWidth: 1, borderColor: '#1c2e40',
    padding: 16, fontSize: 15, minHeight: 160, marginBottom: 24,
  },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#258cf4', borderRadius: 14, paddingVertical: 16,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },
})
