import Link from "next/link";
import React from "react";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col bg-[#101922] text-white overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#101922]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-[#258cf4] rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,140,244,0.5)]">
                        D
                    </div>
                    <span className="font-bold text-xl tracking-wide">DynoSync</span>
                </div>
                <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
                    <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                    <Link href="#community" className="hover:text-white transition-colors">Community</Link>
                </div>
                <button className="bg-[#258cf4] hover:bg-[#1f79d3] text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(37,140,244,0.39)] hover:shadow-[0_6px_20px_rgba(37,140,244,0.23)] hover:-translate-y-0.5">
                    Get the App
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center justify-center text-center min-h-[90vh]">
                {/* Abstract Background Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#258cf4] to-purple-600 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
                </div>

                {/* Grid Background */}
                <div className="absolute inset-0 bg-[url('/img/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>

                <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
                    <div className="inline-block px-4 py-1.5 rounded-full border border-[#258cf4]/30 bg-[#258cf4]/10 text-[#258cf4] text-xs font-bold tracking-wider mb-8 animate-fade-in-up">
                        THE DIGITAL GARAGE FOR HARDCORE ENTHUSIASTS
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 animate-fade-in-up animation-delay-200 leading-[1.1]">
                        Your Performance <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#258cf4] to-cyan-400">Data Archive.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 animate-fade-in-up animation-delay-400 font-light">
                        Convert casual mod inputs into high-quality personalized performance dashboards. Track tuning, compare dyno sheets, and rank on global leaderboards.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up animation-delay-400">
                        <button className="h-14 px-8 rounded-xl bg-white text-black font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.34-.73 3.83-.65 1.7.07 3.07.72 3.98 2.04-3.8 2.21-3.2 7.7.83 9.42-.8 2.1-1.9 4-3.72 5.36zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
                            App Store
                        </button>
                        <button className="h-14 px-8 rounded-xl bg-[#1c2a38] border border-white/10 text-white font-bold text-lg hover:bg-[#253648] hover:scale-105 transition-all flex items-center justify-center gap-2">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17.525 10.925l-10-6C7.14 4.695 6.64 4.795 6.32 5.065A1.986 1.986 0 005.8 6.5v11.005a1.996 1.996 0 00.52 1.43c.32.275.825.37 1.205.14l10-6a1.002 1.002 0 000-1.71c-.015-.015-.015-.015 0 0z" fill="#4CAF50" /><path d="M17.525 13.075l-10 6a.983.983 0 01-1.205-.14 1.996 1.996 0 01-.52-1.43l3.6-3.6z" fill="#F44336" /><path d="M9.4 13.845l-3.6 3.6V6.5a1.986 1.986 0 01.52-1.435.983.983 0 011.205-.14z" fill="#FFEB3B" /><path d="M5.8 6.5l3.6 3.6 8.125-4.875A1.002 1.002 0 0017.525 3.5l-10-6c-.38-.23-.88-.13-1.205.14A1.986 1.986 0 005.8 4.995v1.505z" fill="#2196F3" /></svg>
                            Google Play
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Showcase */}
            <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Build Your Digital Garage</h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">Stop managing builds in chaotic notes and scattered photos. Centralize everything with precision.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Card 1 */}
                    <div className="bg-[#1c2a38]/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-[#1c2a38] transition-colors group">
                        <div className="h-12 w-12 bg-[#258cf4]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-[#258cf4]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold mb-3">Telemetry Dashboard</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Instantly visualize WHP and torque stats, track performance growth charts, and maintain detailed modification logs with precise costs.</p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-[#1c2a38]/50 backdrop-blur-sm border border-[rgba(255,215,0,0.1)] rounded-3xl p-8 hover:bg-[#1c2a38] transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full"></div>
                        <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-300">AI Neural Advisor</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Let AI parse your plain-language mod logs and analyze dyno sheets to provide personalized tuning recommendations for your exact car model.</p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-[#1c2a38]/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-[#1c2a38] transition-colors group">
                        <div className="h-12 w-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold mb-3">Performance Comparison</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Stack your before and after dyno runs directly against each other. Generate beautiful dual-view metric charts optimized for Instagram sharing.</p>
                    </div>
                </div>
            </section>

            {/* Community / Leaderboard Teaser */}
            <section id="community" className="py-24 px-6 border-t border-white/5 bg-gradient-to-b from-transparent to-[#0a1016]">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-[#258cf4] font-bold tracking-widest text-sm mb-4 block">GLOBAL LEADERBOARD</span>
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Where Do You Rank?</h2>
                    <p className="text-gray-400 text-lg mb-12">Claim your spot on the global model-specific tuning leaderboards. Sync your dyno sheets and show the world your build.</p>

                    <div className="p-[1px] rounded-2xl bg-gradient-to-r from-transparent via-[#258cf4]/50 to-transparent max-w-2xl mx-auto">
                        <div className="bg-[#101922] rounded-2xl p-6 flex flex-col gap-4">
                            {[1, 2, 3].map((rank) => (
                                <div key={rank} className="flex items-center justify-between p-4 rounded-xl bg-[#1c2a38] border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : rank === 2 ? 'bg-gray-300/20 text-gray-300' : 'bg-orange-700/20 text-orange-500'}`}>
                                            #{rank}
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold">GhostRider_99</div>
                                            <div className="text-xs text-gray-400">2023 BMW M3 Competition</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-[#258cf4]">742 WHP</div>
                                        <div className="text-xs text-gray-400">Dynojet AWD</div>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 text-sm text-gray-500">
                                Full leaderboards coming to Web soon...
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10 bg-[#0a1016]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-[#258cf4] rounded flex items-center justify-center font-bold text-white text-xs">D</div>
                        <span className="font-bold tracking-wide">DynoSync.co</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>

                    <div className="text-xs text-gray-500">
                        &copy; {new Date().getFullYear()} DynoSync. All rights reserved.
                    </div>
                </div>
            </footer>
        </main>
    );
}
