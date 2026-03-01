import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'

export default function VerifyEmailScreen() {
  const { email, username } = useLocalSearchParams<{ email: string, username: string }>()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleVerify = async () => {
    if (!code || code.length < 6) { Alert.alert('Enter the 6-digit verification code'); return }
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: email ?? '',
      token: code,
      type: 'signup',
    })

    if (error) {
      setLoading(false)
      Alert.alert('Invalid code', error.message)
    } else {
      // Upon successful verification, ensuring the user is in public.users table
      try {
        if (email && username) {
          await api.auth.sync(email, username)
        }
      } catch (err: any) {
        console.warn('Sync soft warning:', err)
      }
      setLoading(false)
      router.replace('/(tabs)')
    }
  }

  const handleResend = async () => {
    setResending(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email ?? '',
    })
    setResending(false)
    if (error) Alert.alert('Error', error.message)
    else Alert.alert('Code sent', 'Check your email for the new code.')
  }

  return (
    <View style={S.container}>
      <Text style={S.title}>Verify Email</Text>
      <Text style={S.subtitle}>
        Enter the 6-digit code sent to{'\n'}
        <Text style={{ color: '#fff' }}>{email}</Text>
      </Text>

      <TextInput
        style={S.input}
        placeholder="6-digit code"
        placeholderTextColor="#64748b"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />

      <TouchableOpacity style={S.button} onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={S.buttonText}>Verify Email</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={resending} style={{ marginTop: 20, alignItems: 'center' }}>
        <Text style={S.resendText}>{resending ? 'Sending...' : "Didn't receive a code? Resend"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 12, alignItems: 'center' }}>
        <Text style={S.backText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  )
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101922', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  subtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 36, lineHeight: 22 },
  input: {
    backgroundColor: '#1c2a38', color: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 12, fontSize: 20, borderWidth: 1,
    borderColor: '#314d68', textAlign: 'center', letterSpacing: 8,
  },
  button: {
    backgroundColor: '#258cf4', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resendText: { color: '#258cf4', fontSize: 14 },
  backText: { color: '#64748b', fontSize: 13 },
})
