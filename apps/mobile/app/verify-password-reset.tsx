import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function VerifyPasswordResetScreen() {
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!code || !password || !confirm) { Alert.alert('Please fill in all fields'); return }
    if (password !== confirm) { Alert.alert('Passwords do not match'); return }
    if (password.length < 6) { Alert.alert('Password must be at least 6 characters'); return }
    if (!user?.email) { Alert.alert('Email not found'); return }

    setLoading(true)

    // 验证 OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: user.email,
      token: code,
      type: 'magiclink',
    })

    if (verifyError) {
      setLoading(false)
      Alert.alert('Invalid code', verifyError.message)
      return
    }

    // 更新密码
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      Alert.alert('Error', updateError.message)
    } else {
      Alert.alert('Password updated', 'Please sign in with your new password.', [
        { text: 'OK', onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/(auth)/login')
        }},
      ])
    }
  }

  return (
    <View style={S.root}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#3ea8ff" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Verify & Reset</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={S.content}>
        <Text style={S.title}>Enter Verification Code</Text>
        <Text style={S.subtitle}>Check your email for the 8-digit code</Text>

        <TextInput
          style={S.input}
          placeholder="8-digit code"
          placeholderTextColor="#64748b"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={8}
          autoFocus
        />

        <Text style={S.sectionLabel}>NEW PASSWORD</Text>
        <TextInput
          style={S.input}
          placeholder="New password"
          placeholderTextColor="#64748b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={S.input}
          placeholder="Confirm new password"
          placeholderTextColor="#64748b"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        <TouchableOpacity style={S.button} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={S.buttonText}>Update Password</Text>
          }
        </TouchableOpacity>
      </View>
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

  content: { flex: 1, padding: 24, paddingTop: 40 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 32 },

  sectionLabel: { color: '#4a6480', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 10, marginTop: 20 },

  input: {
    backgroundColor: '#0d1f30', color: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#1c2e40',
  },

  button: {
    backgroundColor: '#258cf4', borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
