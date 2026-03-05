import Link from "next/link";
import React from "react";

export const metadata = {
    title: "Terms of Service | DynoSync",
    description: "Terms of Service for DynoSync application.",
};

export default function TermsOfService() {
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
                <h1 className="text-4xl md:text-5xl font-extrabold mb-8">Terms of Service</h1>
                <div className="text-gray-400 mb-8 border-b border-white/10 pb-4">
                    Last Updated: March 5, 2026
                </div>

                <div className="space-y-8 text-gray-300 leading-relaxed font-light">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="mb-4">
                            By accessing or using DynoSync ("the App" or "the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Use of the Service</h2>
                        <p className="mb-4">
                            DynoSync provides a platform for vehicle performance tracking and modification logging. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. User Conduct and Safety</h2>
                        <p className="mb-4">
                            <strong className="text-red-500">Safety Warning:</strong> Tuning and performance testing involve inherent risks to your vehicle and personal safety. Any performance testing (e.g., 0-60 runs) must be conducted in a safe, legal, and controlled environment, such as a closed track. Do not use the App while driving.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. AI Advisor Disclaimer</h2>
                        <p className="mb-4">
                            The AI Advisor feature provides insights based on AI-generated analysis. These suggestions are for informational purposes only and DO NOT constitute professional mechanical advice. We are not responsible for any damage to your vehicle resulting from following AI-generated suggestions. Always consult with a certified professional mechanic before making significant modifications.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Subscriptions and Payments</h2>
                        <p className="mb-4">
                            Certain features are provided as part of a paid subscription. Billing is handled through the respective App Store or our secure web billing partner. Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
                        <p className="mb-4">
                            DynoSync is provided "as is". To the maximum extent permitted by law, DynoSync and its developers shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the App, including but not limited to vehicle damage, mechanical failure, or data loss.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Account Deletion</h2>
                        <p className="mb-4">
                            You may request the full deletion of your account and all associated data by contacting us at <a href="mailto:support@dynosync.co" className="text-[#258cf4] hover:underline">support@dynosync.co</a>. We process data deletion requests in accordance with major platform requirements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Modifications to Terms</h2>
                        <p className="mb-4">
                            We reserve the right to modify these Terms at any time. Your continued use of the App following any changes constitutes acceptance of the new Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Governing Law</h2>
                        <p className="mb-4">
                            These Terms shall be governed by and construed in accordance with the laws of the developer's primary place of residence, without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
                        <p className="mb-4">
                            We may terminate or suspend your access to the App immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
                        <p>
                            If you have questions about these Terms of Service, please contact us at: <a href="mailto:support@dynosync.co" className="text-[#258cf4] hover:underline">support@dynosync.co</a>
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
