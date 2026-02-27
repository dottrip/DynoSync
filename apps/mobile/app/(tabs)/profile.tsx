import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuth } from '../../hooks/useAuth'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{user?.user_metadata?.username ?? 'Not set'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Subscription</Text>
          <Text style={styles.value}>Free</Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101922' },
  header: { padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1c2a38' },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  label: { color: '#64748b', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  value: { color: '#fff', fontSize: 16 },
  signOutButton: { backgroundColor: '#ef4444', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
