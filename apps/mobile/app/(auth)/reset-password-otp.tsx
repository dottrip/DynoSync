import { useState } from 'react'
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function ResetPasswordOtpScreen() {
    const { email } = useLocalSearchParams<{ email: string }>()
    const [code, setCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleReset = async () => {
        if (!code || code.length < 6) { Alert.alert('Error', 'Enter the 6-digit code'); return }
        if (!newPassword || newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return }
        if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return }

        setLoading(true)

        // 1. Verify OTP token to establish a recovery session
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email: email ?? '',
            token: code,
            type: 'recovery',
        })

        if (verifyError) {
            setLoading(false)
            Alert.alert('Invalid code', verifyError.message)
            return
        }

        // 2. We now have an active session! Immediately update the password.
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        })

        setLoading(false)

        if (updateError) {
            Alert.alert('Failed to update password', updateError.message)
        } else {
            Alert.alert('Success', 'Your password has been reset successfully.')
            router.replace('/(tabs)')
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={S.container}>
            <Text style={S.title}>Set New Password</Text>
            <Text style={S.subtitle}>
                Enter the 6-digit code sent to{'\n'}
                <Text style={{ color: '#fff' }}>{email}</Text>
            </Text>

            <TextInput
                style={[S.input, { textAlign: 'center', letterSpacing: 8, fontSize: 20 }]}
                placeholder="6-digit code"
                placeholderTextColor="#64748b"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
            />

            <TextInput
                style={S.input}
                placeholder="New Password"
                placeholderTextColor="#64748b"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
            />

            <TextInput
                style={S.input}
                placeholder="Confirm New Password"
                placeholderTextColor="#64748b"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <TouchableOpacity style={S.button} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
                {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={S.buttonText}>Reset Password</Text>
                }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 20, alignItems: 'center' }}>
                <Text style={S.backText}>Back to Sign In</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    )
}

const S = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#101922', justifyContent: 'center', padding: 24 },
    title: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
    subtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
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
