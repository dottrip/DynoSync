import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface UpgradePromptProps {
  visible: boolean
  onClose: () => void
  title: string
  message: string
  feature: string
}

export function UpgradePrompt({ visible, onClose, title, message, feature }: UpgradePromptProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.icon}>🔒</Text>
            <Text style={styles.title}>{title}</Text>
          </View>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.tierCard}>
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>PRO</Text>
            </View>
            <Text style={styles.tierPrice}>$9.99/mo</Text>
            <Text style={styles.tierFeature}>✓ {feature}</Text>
            <Text style={styles.tierFeature}>✓ Unlimited dyno records</Text>
            <Text style={styles.tierFeature}>✓ Unlimited mod logs</Text>
            <Text style={styles.tierFeature}>✓ AI suggestions</Text>
          </View>

          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { backgroundColor: '#1c2a38', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#314d68' },
  header: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  message: { color: '#94a3b8', fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  tierCard: { backgroundColor: '#101922', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#314d68' },
  tierBadge: { alignSelf: 'flex-start', backgroundColor: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  tierBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  tierPrice: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  tierFeature: { color: '#94a3b8', fontSize: 14, marginBottom: 6 },
  upgradeButton: { backgroundColor: '#258cf4', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  upgradeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  closeButton: { padding: 12, alignItems: 'center' },
  closeButtonText: { color: '#64748b', fontSize: 14 },
})
