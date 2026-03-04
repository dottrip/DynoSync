import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Alert, Image, ActivityIndicator, Platform, TextInput,
  KeyboardAvoidingView, Keyboard,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { useTierLimits } from '../../hooks/useTierLimits'
import { MaterialIcons, MaterialCommunityIcons, FontAwesome, FontAwesome6 } from '@expo/vector-icons'
import { TIER_LIMITS } from '@dynosync/types'
import { api, UserProfile } from '../../lib/api'
import { getCache, setCache } from '../../lib/cache'
import { useImagePicker } from '../../hooks/useImagePicker'

// ─── Preset Avatars ───────────────────────────────────────────────────────────
const PRESET_AVATARS = [
  { id: 'p1', emoji: '🏎️', bg: '#1a2a3a' },
  { id: 'p2', emoji: '🔧', bg: '#1a2a1a' },
  { id: 'p3', emoji: '⚡', bg: '#2a1a2a' },
  { id: 'p4', emoji: '🏁', bg: '#2a2a1a' },
  { id: 'p5', emoji: '🔥', bg: '#2a1a1a' },
  { id: 'p6', emoji: '💨', bg: '#1a2a2a' },
]

// ─── Tier Configuration ──────────────────────────────────────────────────────
const TIER_CONFIG = {
  free: { label: 'FREE', color: '#64748b', bgColor: 'rgba(100,116,139,0.12)', icon: 'lock-open' as const, description: 'Basic access' },
  pro: { label: 'PRO', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)', icon: 'star' as const, description: 'Professional tools' },
}

function formatLimit(val: number) {
  return val === Infinity ? '∞' : String(val)
}

// ─── Avatar Component ─────────────────────────────────────────────────────────
export function Avatar({ avatarUrl, size = 80 }: { avatarUrl?: string; size?: number }) {
  const preset = PRESET_AVATARS.find(p => p.id === avatarUrl)
  if (preset) {
    return (
      <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: preset.bg }]}>
        <Text style={{ fontSize: size * 0.45 }}>{preset.emoji}</Text>
      </View>
    )
  }
  if (avatarUrl && avatarUrl.startsWith('http')) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}
      />
    )
  }
  return (
    <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      <MaterialIcons name="person" size={size * 0.5} color="#3ea8ff" />
    </View>
  )
}

// ─── Avatar Picker Modal ──────────────────────────────────────────────────────
function AvatarPickerModal({ visible, current, onSelect, onClose }: {
  visible: boolean; current?: string; onSelect: (id: string) => void; onClose: () => void
}) {
  const { pickImage, uploadImage, uploading } = useImagePicker()

  const handleCustomPhoto = async () => {
    const uri = await pickImage([1, 1])
    if (!uri) return
    const url = await uploadImage(uri, 'avatars')
    if (url) { onSelect(url); onClose() }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={M.overlay}>
        <View style={M.sheet}>
          <View style={M.sheetHeader}>
            <Text style={M.sheetTitle}>CHOOSE AVATAR</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={22} color="#4a6480" />
            </TouchableOpacity>
          </View>

          <Text style={M.sectionLabel}>PRESET</Text>
          <View style={M.presetGrid}>
            {PRESET_AVATARS.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[M.presetItem, current === p.id && M.presetItemActive]}
                onPress={() => { onSelect(p.id); onClose() }}
                activeOpacity={0.8}
              >
                <View style={[M.presetBg, { backgroundColor: p.bg }]}>
                  <Text style={{ fontSize: 28 }}>{p.emoji}</Text>
                </View>
                {current === p.id && (
                  <View style={M.checkBadge}>
                    <MaterialIcons name="check" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={M.sectionLabel}>CUSTOM PHOTO</Text>
          <TouchableOpacity style={M.uploadBtn} onPress={handleCustomPhoto} disabled={uploading} activeOpacity={0.8}>
            {uploading ? (
              <ActivityIndicator color="#3ea8ff" size="small" />
            ) : (
              <>
                <MaterialIcons name="photo-camera" size={18} color="#3ea8ff" />
                <Text style={M.uploadBtnText}>Upload from Gallery</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

function SocialInputModal({ visible, title, value, placeholder, onSave, onClose, loading }: {
  visible: boolean; title: string; value: string; placeholder: string; onSave: (val: string) => void; onClose: () => void; loading: boolean
}) {
  const [text, setText] = useState(value)
  useEffect(() => { setText(value) }, [value, visible])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', paddingTop: 120, alignItems: 'center' }}
          keyboardShouldPersistTaps="always"
        >
          <View style={SMI.container}>
            <View style={M.sheet}>
              <View style={M.sheetHeader}>
                <Text style={M.sheetTitle}>{title}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                  <MaterialIcons name="close" size={22} color="#4a6480" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={SMI.input}
                value={text}
                onChangeText={setText}
                placeholder={placeholder}
                placeholderTextColor="#4a6480"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                onSubmitEditing={() => onSave(text)}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[M.uploadBtn, { marginTop: 12, backgroundColor: '#3ea8ff' }]}
                onPress={() => {
                  onSave(text)
                }}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>SAVE</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const SMI = StyleSheet.create({
  container: {
    width: '90%',
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#1a2a3a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#1c2e40',
  }
})

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const { tier, limits, vehicleCount, refetchVehicles } = useTierLimits()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [editSocial, setEditSocial] = useState<{ type: 'instagram' | 'discord', title: string, value: string } | null>(null)
  const [savingSocial, setSavingSocial] = useState(false)

  const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.free

  const loadProfile = useCallback(async () => {
    try {
      const cached = getCache<UserProfile>('profile')
      if (cached && !profile) setProfile(cached)
      const data = await api.profile.getMe()
      setProfile(data)
      setCache('profile', data)
    } catch { }
  }, [])

  useFocusEffect(useCallback(() => {
    loadProfile()
    refetchVehicles()
  }, [loadProfile, refetchVehicles]))

  const handleAvatarSelect = async (avatarId: string) => {
    try {
      const updated = await api.profile.updateAvatar(avatarId)
      setProfile(updated)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  const handleSocialSave = async (val: string) => {
    if (!editSocial) return
    setSavingSocial(true)
    try {
      // 1. Update local state IMMEDIATELY for instant feedback
      const type = editSocial.type
      setProfile(prev => prev ? ({
        ...prev,
        [type === 'instagram' ? 'instagram_handle' : 'discord_id']: val
      }) : null)

      // 2. Call API
      const updated = await api.profile.updateSocialLinks(
        type === 'instagram' ? val : profile?.instagram_handle,
        type === 'discord' ? val : profile?.discord_id
      )

      // 3. Merge server response but keep our local values as source of truth if server fails to return them
      setProfile(prev => {
        if (!prev) return updated
        return {
          ...prev,
          ...updated,
          instagram_handle: (type === 'instagram' ? val : prev.instagram_handle) || updated.instagram_handle,
          discord_id: (type === 'discord' ? val : prev.discord_id) || updated.discord_id,
        }
      })
      setEditSocial(null)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setSavingSocial(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowAvatarPicker(true)} activeOpacity={0.8}>
          <Avatar avatarUrl={profile?.avatar_url} size={80} />
          <View style={styles.avatarEditBadge}>
            <MaterialIcons name="edit" size={12} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>
          {user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? '—'}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={[styles.tierBadge, { backgroundColor: tierCfg.bgColor, borderColor: tierCfg.color + '50' }]}>
          <MaterialIcons name={tierCfg.icon} size={14} color={tierCfg.color} />
          <Text style={[styles.tierBadgeText, { color: tierCfg.color }]}>{tierCfg.label}</Text>
        </View>
      </View>

      {/* ── Subscription Card ── */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push('/subscription')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardAccent, { backgroundColor: tierCfg.color }]} />
          <Text style={styles.cardTitle}>SUBSCRIPTION</Text>
          <View style={{ flex: 1 }} />
          <MaterialIcons name="chevron-right" size={20} color="#4a6480" />
        </View>
        <View style={[styles.planRow, { borderColor: tierCfg.color + '30', backgroundColor: tierCfg.bgColor }]}>
          <View>
            <Text style={[styles.planName, { color: tierCfg.color }]}>{tierCfg.label} PLAN</Text>
            <Text style={styles.planDesc}>{tierCfg.description}</Text>
          </View>
          <MaterialIcons name={tierCfg.icon} size={28} color={tierCfg.color} />
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {vehicleCount} / <Text style={{ color: tierCfg.color }}>{formatLimit(limits.vehicles)}</Text>
            </Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              <Text style={{ color: tierCfg.color }}>{formatLimit(limits.dynoRecords)}</Text>
            </Text>
            <Text style={styles.statLabel}>Dyno Records</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              <Text style={{ color: tierCfg.color }}>{formatLimit(limits.aiCreditsPerMonth)}</Text>
            </Text>
            <Text style={styles.statLabel}>AI Credits</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Plan Comparison ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>PLAN COMPARISON</Text>
        </View>
        {(['free', 'pro'] as const).map(t => {
          const cfg = TIER_CONFIG[t]
          const lmt = TIER_LIMITS[t]
          const isActive = t === tier
          return (
            <View key={t} style={[styles.planCompRow, isActive && { borderColor: cfg.color + '50', backgroundColor: cfg.bgColor }]}>
              <View style={styles.planCompLeft}>
                <MaterialIcons name={cfg.icon} size={16} color={isActive ? cfg.color : '#4a6480'} />
                <Text style={[styles.planCompName, isActive && { color: cfg.color }]}>{cfg.label}</Text>
                {isActive && <View style={[styles.activeDot, { backgroundColor: cfg.color }]} />}
              </View>
              <Text style={[styles.planCompDetail, isActive && { color: '#fff' }]}>
                {formatLimit(lmt.vehicles)} cars · {formatLimit(lmt.dynoRecords)} dynos · {formatLimit(lmt.aiCreditsPerMonth)} AI
              </Text>
            </View>
          )
        })}
      </View>

      {/* ── Account Info ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>ACCOUNT</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>EMAIL</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>USERNAME</Text>
          <Text style={styles.infoValue}>{user?.user_metadata?.username ?? '—'}</Text>
        </View>
        <TouchableOpacity style={styles.infoRow} onPress={() => setEditSocial({ type: 'instagram', title: 'INSTAGRAM', value: profile?.instagram_handle ?? '' })}>
          <View style={styles.infoLabelGroup}>
            <FontAwesome name="instagram" size={16} color="#E1306C" />
            <Text style={styles.infoLabel}>INSTAGRAM</Text>
          </View>
          <Text style={[styles.infoValue, { color: '#3ea8ff' }]}>{profile?.instagram_handle || 'Link account'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.infoRow} onPress={() => setEditSocial({ type: 'discord', title: 'DISCORD ID', value: profile?.discord_id ?? '' })}>
          <View style={styles.infoLabelGroup}>
            <FontAwesome6 name="discord" size={16} color="#5865F2" />
            <Text style={styles.infoLabel}>DISCORD ID</Text>
          </View>
          <Text style={[styles.infoValue, { color: '#3ea8ff' }]}>{profile?.discord_id || 'Link account'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Actions ── */}
      <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/settings')} activeOpacity={0.8}>
        <MaterialIcons name="settings" size={18} color="#3ea8ff" />
        <Text style={[styles.actionBtnText, { color: '#3ea8ff' }]}>SETTINGS</Text>
        <MaterialIcons name="chevron-right" size={18} color="#3ea8ff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, { marginTop: 10, borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' }]}
        onPress={() => {
          Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign Out', style: 'destructive', onPress: async () => {
                await signOut()
                router.replace('/(auth)/login')
              }
            },
          ])
        }}
        activeOpacity={0.8}
      >
        <MaterialIcons name="logout" size={18} color="#ef4444" />
        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>SIGN OUT</Text>
      </TouchableOpacity>

      {/* ── Modals ── */}
      <AvatarPickerModal
        visible={showAvatarPicker}
        current={profile?.avatar_url}
        onSelect={handleAvatarSelect}
        onClose={() => setShowAvatarPicker(false)}
      />

      <SocialInputModal
        visible={!!editSocial}
        title={editSocial?.title ?? ''}
        value={editSocial?.value ?? ''}
        placeholder={editSocial?.type === 'instagram' ? '@username' : 'username#0000'}
        loading={savingSocial}
        onSave={handleSocialSave}
        onClose={() => setEditSocial(null)}
      />

    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = { bg: '#0a1520', card: '#111d2b', border: '#1c2e40', blue: '#3ea8ff', muted: '#4a6480', text: '#ffffff', sub: '#64748b' }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingTop: 60, paddingBottom: 110, paddingHorizontal: 16 },

  header: { alignItems: 'center', marginBottom: 24 },
  avatarCircle: {
    backgroundColor: 'rgba(62,168,255,0.12)',
    borderWidth: 2, borderColor: 'rgba(62,168,255,0.3)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarEditBadge: {
    position: 'absolute', bottom: 10, right: -2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#258cf4', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.bg,
  },
  userName: { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  userEmail: { color: C.muted, fontSize: 13, marginTop: 4, marginBottom: 12 },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  tierBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },

  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardAccent: { width: 3, height: 16, borderRadius: 2, backgroundColor: C.blue },
  cardTitle: { color: C.text, fontSize: 12, fontWeight: '800', letterSpacing: 2 },

  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 14 },
  planName: { fontSize: 18, fontWeight: '900', letterSpacing: 2, marginBottom: 2 },
  planDesc: { color: C.muted, fontSize: 12 },

  statsGrid: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  statLabel: { color: C.muted, fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },

  planCompRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  planCompLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planCompName: { color: C.sub, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  planCompDetail: { color: C.muted, fontSize: 11 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  infoLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 1 },
  infoValue: { color: C.text, fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0d1f30', borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10,
  },
  actionBtnText: { flex: 1, fontSize: 13, fontWeight: '800', letterSpacing: 2 },
})

// ─── Avatar Picker Modal Styles ───────────────────────────────────────────────
const M = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: '#0d1f30', borderRadius: 20, padding: 20, width: '100%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  sectionLabel: { color: '#4a6480', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  presetItem: { position: 'relative', borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  presetItemActive: { borderColor: '#3ea8ff' },
  presetBg: { width: 60, height: 60, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkBadge: { position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#3ea8ff', alignItems: 'center', justifyContent: 'center' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(62,168,255,0.4)', borderRadius: 12, paddingVertical: 14, backgroundColor: 'rgba(62,168,255,0.06)' },
  uploadBtnText: { color: '#3ea8ff', fontSize: 14, fontWeight: '700' },
})
