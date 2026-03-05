import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'

export default function PrivacyScreen() {
    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={22} color="#3ea8ff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.lastUpdated}>Last Updated: March 5, 2026</Text>

                <Text style={styles.sectionTitle}>1. INTRODUCTION</Text>
                <Text style={styles.paragraph}>
                    DynoSync ("we", "us", or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.
                </Text>

                <Text style={styles.sectionTitle}>2. DATA WE COLLECT</Text>
                <Text style={styles.paragraph}>
                    We collect information that you provide directly to us:
                </Text>
                <Text style={styles.bullet}>• Account Information: Email address and username provided via Supabase Auth.</Text>
                <Text style={styles.bullet}>• Vehicle Information: Make, model, year, and modifications of vehicles you add to your garage.</Text>
                <Text style={styles.bullet}>• Performance Data: Dyno run results, including WHP, torque, and acceleration times (0-60, 1/4 mile).</Text>
                <Text style={styles.bullet}>• Media: Photos of your vehicles or dyno sheets that you choose to upload.</Text>

                <Text style={styles.sectionTitle}>3. HOW WE USE YOUR DATA</Text>
                <Text style={styles.paragraph}>
                    We use the collected data to:
                </Text>
                <Text style={styles.bullet}>• Provide performance tracking and comparison features.</Text>
                <Text style={styles.bullet}>• Power the AI Advisor to provide personalized mechanical insights based on your modifications.</Text>
                <Text style={styles.bullet}>• Maintain your personal garage and vehicle history.</Text>
                <Text style={styles.bullet}>• Improve app performance and user experience.</Text>

                <Text style={styles.sectionTitle}>4. DATA SHARING AND THIRD PARTIES</Text>
                <Text style={styles.paragraph}>
                    We do not sell your personal data. We share data only with service providers necessary for app functionality:
                </Text>
                <Text style={styles.bullet}>• Supabase: For secure authentication and database hosting.</Text>
                <Text style={styles.bullet}>• AI Providers: Anonymous vehicle and performance data may be sent to AI models (like Google Gemini) to generate AI Advisor insights. We ensure these models are used for performance analysis and insights only.</Text>

                <Text style={styles.sectionTitle}>5. INTERNATIONAL DATA TRANSFERS</Text>
                <Text style={styles.paragraph}>
                    As an international developer, your information may be transferred to, and maintained on, computers located outside of your state, province, or country. By using DynoSync, you consent to the transfer of information to our secure infrastructure (including services provided by Supabase and Google) which may be located in the United States or other regions.
                </Text>

                <Text style={styles.sectionTitle}>6. CHILDREN'S PRIVACY</Text>
                <Text style={styles.paragraph}>
                    DynoSync is not intended for use by children under the age of 13. We do not knowingly collect personal data from children under 13. If we become aware that we have collected personal data from a child under 13, we will take steps to delete that information.
                </Text>

                <Text style={styles.sectionTitle}>7. YOUR RIGHTS (INC. CCPA/GDPR)</Text>
                <Text style={styles.paragraph}>
                    We respect your rights to access, correct, or delete your data. For North American users (including California residents), we aim to comply with applicable privacy standards. You may request data deletion at any time.
                </Text>

                <Text style={styles.sectionTitle}>8. ACCOUNT DELETION</Text>
                <Text style={styles.paragraph}>
                    As per App Store and Google Play requirements, you may request the full deletion of your account and all associated data by contacting us at support@dynosync.co. We will process your request and purge all user data from our servers within 30 days.
                </Text>

                <Text style={styles.sectionTitle}>9. GOVERNING LAW</Text>
                <Text style={styles.paragraph}>
                    This Privacy Policy is governed by the laws of the developer's primary place of residence, without regard to its conflict of law provisions.
                </Text>

                <Text style={styles.sectionTitle}>10. CONTACT US</Text>
                <Text style={styles.paragraph}>
                    If you have questions about this Privacy Policy, please contact us at support@dynosync.co.
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
    paragraph: { color: '#e1e8f0', fontSize: 14, marginBottom: 16 },
    bullet: { color: '#e1e8f0', fontSize: 14, marginLeft: 8, marginBottom: 8 },
})
