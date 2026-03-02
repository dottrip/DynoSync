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
                    Last Updated: March 2026
                </div>

                <div className="space-y-8 text-gray-300 leading-relaxed font-light">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
                        <p className="mb-4">
                            By accessing or using the DynoSync application and website ("Services"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. User Accounts</h2>
                        <p className="mb-4">
                            When you create an account with us, you must provide accurate, complete, and current information at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
                        </p>
                        <p>
                            You are responsible for safeguarding the password that you use to access the Services and for any activities or actions under your password.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. User Content</h2>
                        <p className="mb-4">
                            Our Services allow you to post, link, store, share and otherwise make available certain information, text, graphics, videos, dyno sheets, and performance logs ("Content"). You are responsible for the Content that you post.
                        </p>
                        <p>
                            By posting Content, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Services (such as in public leaderboards and public build profiles).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Subscriptions</h2>
                        <p className="mb-4">
                            Some parts of the Services are billed on a subscription basis ("Subscriptions"). You will be billed in advance on a recurring and periodic basis.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Disclaimer</h2>
                        <p className="mb-4">
                            Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The AI Neural Advisor suggestions are for informational purposes only. Always consult with a professional tuner before modifying your vehicle.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at: <a href="mailto:support@dynosync.app" className="text-[#258cf4] hover:underline">support@dynosync.app</a>
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
