import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Link, router } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/api'
import { AuthAlertModal } from '../../components/AuthAlertModal'
import { getFriendlyAuthError } from '../../lib/authErrors'

export default function RegisterScreen() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  // Password Strength Calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0
    let score = 0
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1
    return score
  }

  const strength = getPasswordStrength(password)
  const strengthLabels = ['Too Short', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['#64748b', '#ef4444', '#f59e0b', '#258cf4', '#10b981']

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

  const handleRegister = async () => {
    if (!email || !password || !username) return

    // Validation
    if (password.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters long.', 'error')
      return
    }

    if (password !== confirmPassword) {
      showAlert('Mismatch', 'Passwords do not match. Please check and try again.', 'error')
      return
    }

    setLoading(true)
    const { error, session } = await signUp(email, password, username)
    setLoading(false)

    if (error) {
      const friendly = getFriendlyAuthError(error)
      showAlert(friendly.title, friendly.message, friendly.type)
    } else if (session) {
      // Supabase auto-confirmed the user implicitly. Sync to DB right away.
      try {
        await api.auth.sync(email, username)
      } catch (e) {
        console.log('Soft sync error on auto-login:', e)
      }
      showAlert(
        'Welcome!',
        'Your account has been created successfully. Redirecting to your garage...',
        'success',
        () => router.replace('/(tabs)')
      )
    } else {
      // OTP verification required (or user already exists - silent success)
      showAlert(
        'Check Your Email!',
        "We've sent a verification code to your inbox. Please enter it to complete your account setup.",
        'success',
        () => router.replace(`/(auth)/verify-email?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`)
      )
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join the DynoSync community</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#64748b"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#64748b"
        value={email}
        onChangeText={setEmail}
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

      {password.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBarContainer}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.strengthBar,
                  { backgroundColor: i <= strength ? strengthColors[strength] : '#1c2a38' }
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthText, { color: strengthColors[strength] }]}>
            {strengthLabels[strength]}
          </Text>
        </View>
      )}

      <TextInput
        style={[styles.input, password && confirmPassword && password !== confirmPassword && styles.inputError]}
        placeholder="Confirm Password"
        placeholderTextColor="#64748b"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {password && confirmPassword && password !== confirmPassword && (
        <Text style={styles.errorHint}>Passwords do not match</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        Already have an account? Sign in
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
  button: {
    backgroundColor: '#258cf4', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#258cf4', textAlign: 'center', marginTop: 24, fontSize: 14 },

  // Strength Indicator styles
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    marginRight: 12,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    minWidth: 60,
    textAlign: 'right',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorHint: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
})
