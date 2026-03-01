import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { Link, router } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Hold Up', 'Please enter your email address')
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        setLoading(false)

        if (error) {
            Alert.alert('Error', error.message)
        } else {
            Alert.alert('Check your inbox', 'We sent you a 6-digit verification code to reset your password.')
            router.push(`/(auth)/reset-password-otp?email=${encodeURIComponent(email)}`)
        }
    }

    return (
        <View style={S.container}>
            <Text style={S.title}>Reset Password</Text>
            <Text style={S.subtitle}>Enter your email to receive a recovery code</Text>

            <TextInput
                style={S.input}
                placeholder="Enter your email"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
            />

            <TouchableOpacity style={S.button} onPress={handleResetPassword} disabled={loading} activeOpacity={0.85}>
                {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={S.buttonText}>Send Recovery Code</Text>
                }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24, alignItems: 'center' }}>
                <Text style={S.backText}>Cancel</Text>
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
        padding: 16, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#314d68',
    },
    button: {
        backgroundColor: '#258cf4', borderRadius: 12, padding: 16,
        alignItems: 'center', marginTop: 12,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    backText: { color: '#64748b', fontSize: 14 },
})
