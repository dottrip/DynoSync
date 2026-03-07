"use client";

import Link from "next/link";
import React from "react";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col bg-[#101922] text-white overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#101922]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo.png?v=3" alt="DynoSync Logo" className="h-8 w-8 rounded-lg shadow-[0_0_15px_rgba(37,140,244,0.5)] object-contain" />
                    <span className="font-bold text-xl tracking-wide">DynoSync</span>
                </div>
                <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
                    <Link href="#telemetry-dashboard" className="hover:text-white transition-colors">Telemetry</Link>
                    <Link href="#neural-advisor" className="hover:text-white transition-colors">AI Advisor</Link>
                    <Link href="#performance-comparison" className="hover:text-white transition-colors">Compare</Link>
                    <Link href="#digital-blueprint" className="hover:text-white transition-colors">Blueprints</Link>
                </div>
                <button
                    className="bg-[#258cf4] hover:bg-[#1f79d3] text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(37,140,244,0.39)] hover:shadow-[0_6px_20px_rgba(37,140,244,0.23)] hover:-translate-y-0.5"
                    onClick={() => alert("Coming soon! The app is currently in closed beta.")}
                >
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
                        Convert casual mod inputs into high-quality personalized performance dashboards. Track tuning evolution and build history in your digital garage.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up animation-delay-400">
                        <button
                            className="h-14 px-8 rounded-xl bg-white text-black font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                            onClick={() => alert("Coming soon on the App Store!")}
                        >
                            <svg viewBox="0 0 384 512" fill="currentColor" className="w-5 h-5"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" /></svg>
                            App Store
                        </button>
                        <button
                            className="h-14 px-8 rounded-xl bg-[#1c2a38] border border-white/10 text-white font-bold text-lg hover:bg-[#253648] hover:scale-105 transition-all flex items-center justify-center gap-2"
                            onClick={() => alert("Coming soon on Google Play!")}
                        >
                            <svg viewBox="0 0 24 24" className="w-6 h-6">
                                <path fill="#2196F3" d="M3.3,2.4 C2.9,2.7 2.7,3.3 2.7,4.0 V20.0 C2.7,20.7 2.9,21.3 3.3,21.6 L3.4,21.6 L13.3,12.2 L13.3,12.0 L3.4,2.3 L3.3,2.4 Z" />
                                <path fill="#4CAF50" d="M16.6,8.8 L5.8,2.4 C4.7,1.8 3.8,1.9 3.3,2.4 L13.3,12.0 L16.6,8.8 Z" />
                                <path fill="#FFEB3B" d="M16.5,15.4 L13.3,12.2 L13.3,12.0 L16.5,8.8 L16.6,8.8 L20.3,11.0 C21.4,11.6 21.4,12.5 20.3,13.1 L16.6,15.3 L16.5,15.4 Z" />
                                <path fill="#F44336" d="M16.6,15.3 L13.3,12.0 L3.3,21.6 C3.8,22.1 4.7,22.2 5.8,21.6 L16.6,15.3 Z" />
                            </svg>
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

            {/* Telemetry Dashboard Section */}
            <section id="telemetry-dashboard" className="py-24 px-6 border-t border-white/5 bg-[#101922]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
                    <div className="flex-1 md:pl-12">
                        <span className="text-[#258cf4] font-bold tracking-widest text-sm mb-4 block">CORE TELEMETRY</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Your Data Console.</h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            A centralized hub for your vehicle's performance metrics. Track horsepower, torque, and modification costs with precision.
                        </p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="h-2 w-2 rounded-full bg-[#258cf4]"></div>
                                <span>Interactive Growth Charts</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                <span>Detailed Build Cost Tracking</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                                <span>Comprehensive Modification Logs</span>
                            </li>
                        </ul>
                    </div>

                    {/* Mockup visualization */}
                    <div className="flex-1 w-full max-w-md bg-[#1c2a38] rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-lg font-bold">Telemetry</div>
                            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">+85 WHP</div>
                        </div>
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 bg-[#101922] p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-[#258cf4]/10 blur-xl rounded-full"></div>
                                <div className="text-gray-400 text-xs mb-1 relative z-10">Peak WHP</div>
                                <div className="text-2xl font-bold text-[#258cf4] relative z-10">742</div>
                            </div>
                            <div className="flex-1 bg-[#101922] p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 blur-xl rounded-full"></div>
                                <div className="text-gray-400 text-xs mb-1 relative z-10">Peak WTQ</div>
                                <div className="text-2xl font-bold text-orange-400 relative z-10">680</div>
                            </div>
                        </div>
                        <div className="h-40 bg-[#101922] rounded-2xl border border-white/5 relative overflow-hidden flex items-end justify-between p-4 gap-2">
                            {/* Mock Chart bars */}
                            <div className="w-1/5 bg-[#258cf4]/20 h-[30%] rounded-t-lg transition-all duration-500 group-hover:h-[40%]"></div>
                            <div className="w-1/5 bg-[#258cf4]/40 h-[45%] rounded-t-lg transition-all duration-500 group-hover:h-[55%]"></div>
                            <div className="w-1/5 bg-[#258cf4]/60 h-[60%] rounded-t-lg transition-all duration-500 group-hover:h-[70%]"></div>
                            <div className="w-1/5 bg-[#258cf4]/80 h-[80%] rounded-t-lg transition-all duration-500 group-hover:h-[90%]"></div>
                            <div className="w-1/5 bg-gradient-to-t from-[#258cf4] to-cyan-400 h-[95%] rounded-t-lg shadow-[0_0_15px_rgba(37,140,244,0.5)] transition-all duration-500 group-hover:h-[100%]"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Neural Advisor Section */}
            <section id="neural-advisor" className="py-24 px-6 border-t border-white/5 bg-gradient-to-b from-transparent to-[#0a1016]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1 md:pr-12">
                        <span className="text-[#258cf4] font-bold tracking-widest text-sm mb-4 block">MACHINE INTELLIGENCE</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">The Neural Advisor.</h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Stop guessing what your next mod should be. Simply snap a photo of your dyno sheet, and our OCR engine will extract the torque curve and horsepower data in seconds.
                        </p>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            The Neural Advisor cross-references your vehicle's specific make, model, and current modification list against millions of data points to provide actionable tuning diagnostics, pinpointing exactly where you are losing power.
                        </p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="h-2 w-2 rounded-full bg-[#258cf4]"></div>
                                <span>Real-time Dyno OCR Scanning</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                <span>Model-Specific Torque Diagnostics</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                <span>Actionable Tuning Recommendations</span>
                            </li>
                        </ul>
                    </div>

                    {/* Mockup visualization */}
                    <div className="flex-1 w-full max-w-md bg-[#101922] rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#258cf4]/10 blur-[80px] rounded-full group-hover:bg-[#258cf4]/20 transition-all duration-700"></div>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <div>
                                    <div className="font-bold text-sm">Neural Analysis Live</div>
                                    <div className="text-xs text-blue-400">Scanning Dynojet Sheet...</div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="h-24 rounded-lg bg-[#1c2a38] border border-white/5 relative overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#258cf4]/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                <span className="text-[#258cf4] font-mono text-xl tracking-widest">[ extracting curve ... ]</span>
                            </div>
                            <div className="h-20 rounded-lg bg-[#1c2a38] border border-white/5 p-4">
                                <div className="h-2 w-1/3 bg-gray-600 rounded mb-3"></div>
                                <div className="h-2 w-full bg-gray-700 rounded mb-2"></div>
                                <div className="h-2 w-5/6 bg-gray-700 rounded"></div>
                            </div>
                            <div className="h-20 rounded-lg bg-[#1c2a38] border border-white/5 p-4 border-l-2 border-l-red-500">
                                <div className="h-2 w-1/4 bg-red-400/50 rounded mb-3"></div>
                                <div className="h-2 w-full bg-red-900/30 rounded mb-2"></div>
                                <div className="h-2 w-4/5 bg-red-900/30 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Performance Comparison Section */}
            <section id="performance-comparison" className="py-24 px-6 border-t border-white/5 bg-gradient-to-b from-transparent to-[#0a1016]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-16">
                    <div className="flex-1 md:pl-12">
                        <span className="text-purple-500 font-bold tracking-widest text-sm mb-4 block">PERFORMANCE DELTA</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Visual Comparisons.</h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Stop flipping between dyno sheets. Select any two runs and instantly generate a beautiful, dual-view metric comparison.
                        </p>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            See exactly where your new modifications made power, and share the visual proof with your community.
                        </p>
                        <button
                            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors shadow-lg"
                            onClick={() => alert("Interactive demo is currently under development.")}
                        >
                            See it in Action
                        </button>
                    </div>

                    {/* Mockup visualization */}
                    <div className="flex-1 w-full max-w-sm mx-auto">
                        <div className="bg-[#1c2a38] rounded-3xl p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden hover:scale-105 transition-transform duration-500 ease-out">
                            <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-purple-500/20 blur-[50px] rounded-full"></div>
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="text-center">
                                    <div className="text-xs text-gray-400 mb-1">Run 1</div>
                                    <div className="font-bold text-gray-300">Stage 1</div>
                                </div>
                                <div className="px-3 py-1 bg-[#101922] rounded-full text-xs font-bold text-purple-400 border border-white/5">VS</div>
                                <div className="text-center">
                                    <div className="text-xs text-gray-400 mb-1">Run 2</div>
                                    <div className="font-bold text-white">Stage 2</div>
                                </div>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">420 HP</span>
                                        <span className="text-white font-bold">505 HP</span>
                                    </div>
                                    <div className="h-2 bg-[#101922] rounded-full overflow-hidden flex">
                                        <div className="h-full bg-gray-600 w-1/2"></div>
                                        <div className="h-full bg-purple-500 w-[34%] relative">
                                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">450 TQ</span>
                                        <span className="text-white font-bold">540 TQ</span>
                                    </div>
                                    <div className="h-2 bg-[#101922] rounded-full overflow-hidden flex">
                                        <div className="h-full bg-gray-600 w-1/2"></div>
                                        <div className="h-full bg-orange-500 w-[30%] relative">
                                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Digital Blueprint Section */}
            <section id="digital-blueprint" className="py-24 px-6 border-t border-white/5 bg-[#101922]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1 md:pr-12">
                        <span className="text-red-500 font-bold tracking-widest text-sm mb-4 block">SHARE YOUR BUILD</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Your Digital Blueprint.</h2>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Turn your chaotic mod list into a stunning, shareable public profile. Every part installed, every dyno run recorded, plotted chronologically on a beautiful timeline.
                        </p>
                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            Generate your unique vehicle link and drop it in Instagram bios, Discord servers, or forums. Let the engineering speak for itself.
                        </p>
                        <button
                            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors shadow-lg"
                            onClick={() => alert("Sample build pages will be available after public launch.")}
                        >
                            View Sample Build
                        </button>
                    </div>

                    <div className="flex-1 w-full max-w-sm mx-auto">
                        <div className="bg-[#1c2a38] rounded-3xl p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 rotate-[-2deg] hover:rotate-0 transition-transform duration-500 ease-out">
                            <div className="bg-[#101922] rounded-[22px] overflow-hidden">
                                {/* Mock Header */}
                                <div className="h-32 bg-gradient-to-b from-[#258cf4]/30 to-transparent relative">
                                    <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-full bg-black border-4 border-[#101922] overflow-hidden flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-[#258cf4]"></div>
                                    </div>
                                </div>
                                <div className="pt-10 px-6 pb-6">
                                    <h3 className="text-xl font-bold mb-1">G80 M3 Comp</h3>
                                    <p className="text-xs text-[#258cf4] mb-6">🔗 dynosync.co/u/apextuning/g80</p>

                                    <div className="space-y-4">
                                        <div className="flex gap-4 border-l border-white/10 pl-4 py-2 relative">
                                            <div className="absolute left-[-5px] top-4 w-2 h-2 rounded-full bg-[#258cf4]"></div>
                                            <div className="bg-[#1c2a38] p-3 rounded-xl flex-1">
                                                <p className="text-xs text-gray-400 mb-1">MAR 2026</p>
                                                <p className="text-sm font-bold">Stage 2 Tune Installed</p>
                                                <p className="text-xs text-emerald-400 mt-1">+85 WHP</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 border-l border-white/10 pl-4 py-2 relative">
                                            <div className="absolute left-[-5px] top-4 w-2 h-2 rounded-full bg-gray-600"></div>
                                            <div className="bg-[#1c2a38] p-3 rounded-xl flex-1">
                                                <p className="text-xs text-gray-400 mb-1">FEB 2026</p>
                                                <p className="text-sm font-bold">Catless Downpipes</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10 bg-[#0a1016]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png?v=3" alt="DynoSync Logo" className="h-6 w-6 rounded object-contain" />
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
