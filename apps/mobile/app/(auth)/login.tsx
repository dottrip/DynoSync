import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Link, router } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { AuthAlertModal } from '../../components/AuthAlertModal'
import { getFriendlyAuthError } from '../../lib/authErrors'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [showResend, setShowResend] = useState(false)

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertTitle, setAlertTitle] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<'error' | 'success' | 'info'>('error')

  const showAlert = (title: string, message: string, type: 'error' | 'success' | 'info' = 'error', nextAction?: () => void) => {
    setAlertTitle(title)
    setAlertMessage(message)
    setAlertType(type)
    setAlertVisible(true)
    setOnAlertConfirm(() => nextAction || null)
  }

  const [onAlertConfirm, setOnAlertConfirm] = useState<(() => void) | null>(null)

  const handleLogin = async () => {
    if (!email || !password) return
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      const friendly = getFriendlyAuthError(error)
      if (error.message.toLowerCase().includes('email not confirmed') ||
        error.message.toLowerCase().includes('not confirmed')) {
        setShowResend(true)
        showAlert(friendly.title, friendly.message, friendly.type)
      } else {
        showAlert(friendly.title, friendly.message, friendly.type)
      }
    } else {
      router.replace('/(tabs)')
    }
  }

  const handleResend = async () => {
    if (!email) { Alert.alert('Enter your email first'); return }
    setResending(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    setResending(false)
    setResending(false)
    if (error) {
      const friendly = getFriendlyAuthError(error)
      showAlert(friendly.title, friendly.message, 'error')
    } else {
      router.push(`/(auth)/verify-email?email=${encodeURIComponent(email)}`)
      setShowResend(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DynoSync</Text>
      <Text style={styles.subtitle}>Sign in to your garage</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#64748b"
        value={email}
        onChangeText={t => { setEmail(t); setShowResend(false) }}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#64748b"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {showResend && (
        <View style={styles.verifyBox}>
          <Text style={styles.verifyText}>Your email is not verified yet.</Text>
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            <Text style={styles.resendLink}>{resending ? 'Sending...' : 'Resend verification email'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/register" style={styles.link}>
        Don't have an account? Register
      </Link>

      <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
        Forgot your password?
      </Link>

      <AuthAlertModal
        visible={alertVisible}
        onClose={() => {
          setAlertVisible(false)
          if (onAlertConfirm) onAlertConfirm()
        }}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101922', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#64748b', fontSize: 16, textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#1c2a38', color: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#314d68',
  },
  verifyBox: {
    backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)',
    borderRadius: 10, padding: 14, marginBottom: 12, gap: 6,
  },
  verifyText: { color: '#f59e0b', fontSize: 13 },
  resendLink: { color: '#258cf4', fontSize: 13, fontWeight: '700' },
  button: {
    backgroundColor: '#258cf4', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#258cf4', textAlign: 'center', marginTop: 24, fontSize: 14 },
  forgotLink: { color: '#64748b', textAlign: 'center', marginTop: 16, fontSize: 14 },
})
