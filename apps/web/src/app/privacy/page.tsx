import Link from "next/link";
import React from "react";

export const metadata = {
    title: "Privacy Policy | DynoSync",
    description: "Privacy Policy for DynoSync application.",
};

export default function PrivacyPolicy() {
    return (
        <main className="flex min-h-screen flex-col bg-[#101922] text-white overflow-hidden py-32 px-6">

            {/* Navigation Simple Version */}
            <nav className="fixed top-0 w-full z-50 bg-[#101922]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center left-0">
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-[#258cf4] rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,140,244,0.5)]">
                        D
                    </div>
                    <span className="font-bold text-xl tracking-wide">DynoSync</span>
                </Link>
            </nav>

            <div className="max-w-3xl mx-auto w-full mt-10">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-8">Privacy Policy</h1>
                <div className="text-gray-400 mb-8 border-b border-white/10 pb-4">
                    Last Updated: March 5, 2026
                </div>

                <div className="space-y-8 text-gray-300 leading-relaxed font-light">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                        <p className="mb-4">
                            DynoSync ("we", "us", or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application and web services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Data We Collect</h2>
                        <p className="mb-4">
                            We collect information that you provide directly to us:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-400">
                            <li>Account Information: Email address and username provided via Supabase Auth.</li>
                            <li>Vehicle Information: Make, model, year, and modifications of vehicles you add to your garage.</li>
                            <li>Performance Data: Dyno run results, including WHP, torque, and acceleration times.</li>
                            <li>Media: Photos of your vehicles or dyno sheets that you choose to upload.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Data</h2>
                        <p className="mb-4">
                            We use the collected data to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-400">
                            <li>Provide performance tracking and comparison features.</li>
                            <li>Power the AI Advisor (using Google Gemini) to provide personalized mechanical insights.</li>
                            <li>Maintain your personal garage and vehicle history.</li>
                            <li>Improve platform performance and user experience.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing and Third Parties</h2>
                        <p className="mb-4">
                            We do not sell your personal data. We share data only with service providers necessary for platform functionality:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-400">
                            <li>Supabase: For secure authentication and database hosting.</li>
                            <li>AI Providers: Anonymous vehicle and performance data may be sent to Google Gemini to generate AI Advisor insights.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. International Data Transfers</h2>
                        <p>
                            As an international service, your information may be transferred to, and maintained on, computers located outside of your state, province, or country. By using DynoSync, you consent to the transfer of information to our secure infrastructure which may be located in various global regions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Children's Privacy</h2>
                        <p>
                            DynoSync is not intended for use by children under the age of 13. We do not knowingly collect personal data from children under 13. If we become aware that we have collected personal data from a child under 13, we will take steps to delete that information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights (Inc. CCPA/GDPR)</h2>
                        <p>
                            We respect your rights to access, correct, or delete your data. For North American users (including California residents) and International users, we aim to comply with applicable privacy standards. You may request data deletion at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Account Deletion</h2>
                        <p>
                            As per platform requirements, you may request the full deletion of your account and all associated data by contacting us at <a href="mailto:support@dynosync.co" className="text-[#258cf4] hover:underline">support@dynosync.co</a>. We will process your request and purge all user data from our servers within 30 days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Governing Law</h2>
                        <p>
                            This Privacy Policy and our data practices are governed by the laws of the developer's primary place of residence, without regard to conflict of law principles.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
                        <p>
                            If you have any questions or concerns about this Privacy Policy, please contact us at: <a href="mailto:support@dynosync.co" className="text-[#258cf4] hover:underline">support@dynosync.co</a>
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-white/10">
                    <Link href="/" className="text-[#258cf4] hover:underline flex items-center gap-2">
                        &larr; Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
