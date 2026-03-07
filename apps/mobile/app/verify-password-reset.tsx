import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Platform, Modal,
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
  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMsg, setModalMsg] = useState('')
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info')
  const [onModalDismiss, setOnModalDismiss] = useState<(() => void) | null>(null)

  const showAlert = (title: string, msg: string, type: 'success' | 'error' | 'info' = 'info', onDismiss?: () => void) => {
    setModalTitle(title)
    setModalMsg(msg)
    setModalType(type)
    setOnModalDismiss(() => onDismiss || null)
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!code || !password || !confirm) { showAlert('Missing Info', 'Please fill in all fields', 'error'); return }
    if (password !== confirm) { showAlert('Mismatch', 'Passwords do not match', 'error'); return }
    if (password.length < 6) { showAlert('Short Password', 'Password must be at least 6 characters', 'error'); return }
    if (!user?.email) { showAlert('Error', 'Email not found', 'error'); return }

    setLoading(true)

    // 验证 OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: user.email,
      token: code,
      type: 'magiclink',
    })

    if (verifyError) {
      setLoading(false)
      showAlert('Invalid Code', verifyError.message, 'error')
      return
    }

    // 更新密码
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      showAlert('Error', updateError.message, 'error')
    } else {
      showAlert('Password Updated', 'Please sign in with your new password.', 'success', async () => {
        await supabase.auth.signOut()
        router.replace('/(auth)/login')
      })
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

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={S.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowModal(false)
            if (onModalDismiss) onModalDismiss()
          }}
        >
          <View style={S.modalContainer}>
            <TouchableOpacity activeOpacity={1} style={S.modalCard}>
              <View style={[
                S.modalIconBox,
                {
                  backgroundColor: modalType === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  borderColor: modalType === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
                }
              ]}>
                <MaterialIcons
                  name={modalType === 'success' ? "check-circle" : "error-outline"}
                  size={32}
                  color={modalType === 'success' ? "#10b981" : "#ef4444"}
                />
              </View>
              <Text style={S.modalTitle}>{modalTitle}</Text>
              <Text style={S.modalMessage}>{modalMsg}</Text>
              <TouchableOpacity
                style={S.modalConfirmBtn}
                onPress={() => {
                  setShowModal(false)
                  if (onModalDismiss) onModalDismiss()
                }}
              >
                <Text style={S.modalConfirmText}>{modalType === 'success' ? 'SIGN IN' : 'GOT IT'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContainer: { width: '100%', maxWidth: 340 },
  modalCard: {
    backgroundColor: '#0d1f30', borderRadius: 20, borderWidth: 1, borderColor: '#1c2e40',
    padding: 24, alignItems: 'center',
  },
  modalIconBox: {
    width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 1,
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  modalMessage: { color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalConfirmBtn: {
    backgroundColor: '#258cf4', width: '100%',
    paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  modalConfirmText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
})
