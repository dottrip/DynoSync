import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'

export default function TermsScreen() {
    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={22} color="#3ea8ff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.lastUpdated}>Last Updated: March 5, 2026</Text>

                <Text style={styles.sectionTitle}>1. ACCEPTANCE OF TERMS</Text>
                <Text style={styles.paragraph}>
                    By accessing or using DynoSync ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
                </Text>

                <Text style={styles.sectionTitle}>2. USE OF THE SERVICE</Text>
                <Text style={styles.paragraph}>
                    DynoSync provides a platform for vehicle performance tracking and modification logging. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.
                </Text>

                <Text style={styles.sectionTitle}>3. USER CONDUCT AND SAFETY</Text>
                <View style={styles.paragraphContainer}>
                    <Text style={styles.paragraph}>
                        <Text style={styles.bold}>Safety Warning: </Text>Tuning and performance testing involve inherent risks to your vehicle and personal safety. Any performance testing (e.g., 0-60 runs) must be conducted in a safe, legal, and controlled environment, such as a closed track. Do not use the App while driving.
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>4. AI ADVISOR DISCLAIMER</Text>
                <Text style={styles.paragraph}>
                    The AI Advisor feature provides insights based on AI-generated analysis. These suggestions are for informational purposes only and DO NOT constitute professional mechanical advice. We are not responsible for any damage to your vehicle or loss of warranty resulting from following AI-generated suggestions. Always consult with a certified professional mechanic before making significant modifications.
                </Text>

                <Text style={styles.sectionTitle}>5. SUBSCRIPTIONS AND PAYMENTS</Text>
                <Text style={styles.paragraph}>
                    Certain features are provided as part of a paid subscription. Billing is handled through the respective App Store (Apple App Store or Google Play Store). Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period.
                </Text>

                <Text style={styles.sectionTitle}>6. LIMITATION OF LIABILITY</Text>
                <Text style={styles.paragraph}>
                    DynoSync is provided "as is". To the maximum extent permitted by law, DynoSync and its developers shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the App, including but not limited to vehicle damage, mechanical failure, or data loss.
                </Text>

                <Text style={styles.sectionTitle}>7. ACCOUNT DELETION</Text>
                <Text style={styles.paragraph}>
                    You may request the full deletion of your account and all associated data by contacting us at support@dynosync.co. As an international service, we process data deletion requests in accordance with major platform requirements (Apple/Google).
                </Text>

                <Text style={styles.sectionTitle}>8. MODIFICATIONS TO TERMS</Text>
                <Text style={styles.paragraph}>
                    We reserve the right to modify these Terms at any time. Your continued use of the App following any changes constitutes acceptance of the new Terms.
                </Text>

                <Text style={styles.sectionTitle}>9. GOVERNING LAW</Text>
                <Text style={styles.paragraph}>
                    These Terms shall be governed by and construed in accordance with the laws of the developer's primary place of residence, without regard to its conflict of law provisions.
                </Text>

                <Text style={styles.sectionTitle}>10. TERMINATION</Text>
                <Text style={styles.paragraph}>
                    We may terminate or suspend your access to the App immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
                </Text>

                <Text style={styles.sectionTitle}>11. CONTACT US</Text>
                <Text style={styles.paragraph}>
                    If you have questions about these Terms of Service, please contact us at support@dynosync.co.
                </Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0a1520' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : 32,
        paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#1c2e40',
    },
    backBtn: { padding: 4 },
    headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center' },
    content: { padding: 20 },
    lastUpdated: { color: '#64748b', fontSize: 12, marginBottom: 24 },
    sectionTitle: { color: '#3ea8ff', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 12, marginTop: 12 },
    paragraph: { color: '#e1e8f0', fontSize: 14, lineHeight: 20, marginBottom: 16 },
    bold: { fontWeight: 'bold', color: '#ff4b4b' },
    paragraphContainer: { width: '100%', marginBottom: 16, flex: 1 },
})
