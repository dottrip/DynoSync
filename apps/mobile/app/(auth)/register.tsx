import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Link, router } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'

export default function RegisterScreen() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!email || !password || !username) return
    setLoading(true)
    const { error } = await signUp(email, password, username)
    setLoading(false)
    if (error) {
      Alert.alert('Registration failed', error.message)
    } else {
      Alert.alert('Check your email', 'We sent you a confirmation link.')
      router.replace('/(auth)/login')
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

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        Already have an account? Sign in
      </Link>
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
})
