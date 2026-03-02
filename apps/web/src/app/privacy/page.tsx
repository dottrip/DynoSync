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
                    Last Updated: March 2026
                </div>

                <div className="space-y-8 text-gray-300 leading-relaxed font-light">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                        <p className="mb-4">
                            Welcome to DynoSync ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website and in using our products and services (collectively, the "Services").
                        </p>
                        <p>
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our mobile application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
                        <p className="mb-4">
                            We collect information that you provide securely to us when you register for an account, such as:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-400">
                            <li>Contact Data (e.g., email address)</li>
                            <li>Profile Data (e.g., username, password)</li>
                            <li>Vehicle Data (e.g., vehicle make, model, modifications)</li>
                            <li>Performance Data (e.g., dyno sheets, tuning logs)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                        <p className="mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-400">
                            <li>Provide, operate, and maintain our Services.</li>
                            <li>Generate AI-powered tuning recommendations.</li>
                            <li>Display your vehicles on the public leaderboards (if opted-in).</li>
                            <li>Improve, personalize, and expand our Services.</li>
                            <li>Communicate with you for customer service and support.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Contact Us</h2>
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
