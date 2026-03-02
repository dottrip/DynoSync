'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Types for the Leaderboard
type LeaderboardVehicle = {
    id: string;
    make: string;
    model: string;
    year: number;
    image_url: string | null;
    users: {
        username: string;
    };
    dyno_records: {
        whp: number;
        torque_nm: number | null;
        zero_to_sixty?: number | null;
    }[];
};

type SortCriteria = 'whp' | 'torque' | '0-60';

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState<SortCriteria>('whp');
    const [vehicles, setVehicles] = useState<LeaderboardVehicle[]>([]);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Mock data for demonstration if API fails or is empty
    const MOCK_VEHICLES: LeaderboardVehicle[] = [
        {
            id: 'mock-1',
            make: 'BMW',
            model: 'M3 Competition',
            year: 2023,
            image_url: 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&q=80&w=800',
            users: { username: 'GhostRider_99' },
            dyno_records: [{ whp: 742, torque_nm: 850, zero_to_sixty: 3.2 }]
        },
        {
            id: 'mock-2',
            make: 'Porsche',
            model: '911 GT3 RS',
            year: 2024,
            image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
            users: { username: 'TrackMonster' },
            dyno_records: [{ whp: 518, torque_nm: 465, zero_to_sixty: 3.0 }]
        },
        {
            id: 'mock-3',
            make: 'Nissan',
            model: 'GT-R R35',
            year: 2021,
            image_url: 'https://images.unsplash.com/photo-1598084991519-c90900bc9df0?auto=format&fit=crop&q=80&w=800',
            users: { username: 'Godzilla_Godzilla' },
            dyno_records: [{ whp: 1120, torque_nm: 1250, zero_to_sixty: 2.5 }]
        },
        {
            id: 'mock-4',
            make: 'Toyota',
            model: 'Supra',
            year: 2022,
            image_url: 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&q=80&w=800',
            users: { username: 'JDM_Legend' },
            dyno_records: [{ whp: 580, torque_nm: 650, zero_to_sixty: 3.8 }]
        },
        {
            id: 'mock-5',
            make: 'Audi',
            model: 'RS6 Avant',
            year: 2023,
            image_url: 'https://images.unsplash.com/photo-1606148332462-811809ee5964?auto=format&fit=crop&q=80&w=800',
            users: { username: 'WagonMaster' },
            dyno_records: [{ whp: 820, torque_nm: 1050, zero_to_sixty: 2.9 }]
        }
    ];

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('https://dynosync-api.dynosync-dev.workers.dev/public/vehicles?limit=50');

                if (res.ok) {
                    const data = await res.json();
                    if (data.length === 0) {
                        setVehicles(MOCK_VEHICLES);
                    } else {
                        setVehicles(data);
                    }
                } else {
                    setApiError(`API Status: ${res.status}`);
                    setVehicles(MOCK_VEHICLES);
                }
            } catch (error) {
                setApiError("Displaying demo data.");
                setVehicles(MOCK_VEHICLES);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Helper to get the best value for a vehicle based on criteria
    const getBestValue = (vehicle: LeaderboardVehicle, criteria: SortCriteria) => {
        if (!vehicle.dyno_records || vehicle.dyno_records.length === 0) return 0;

        if (criteria === 'whp') {
            return Math.max(...vehicle.dyno_records.map(r => r.whp));
        } else if (criteria === 'torque') {
            return Math.max(...vehicle.dyno_records.map(r => r.torque_nm || 0));
        } else if (criteria === '0-60') {
            const values = vehicle.dyno_records
                .map(r => r.zero_to_sixty || (r as any).zero_to_sixty)
                .filter((v): v is number => v !== undefined && v !== null && v > 0);
            return values.length > 0 ? Math.min(...values) : 999;
        }
        return 0;
    };

    // Calculate ranked vehicles based on active tab
    const rankedVehicles = [...vehicles]
        .map(v => {
            const val = getBestValue(v, activeTab);
            return {
                ...v,
                sort_value: val
            };
        })
        .filter(v => activeTab === '0-60' ? v.sort_value < 999 : v.sort_value > 0)
        .sort((a, b) => {
            if (activeTab === '0-60') return a.sort_value - b.sort_value;
            return b.sort_value - a.sort_value;
        });

    return (
        <main className="min-h-screen bg-[#0a1520] text-white font-sans selection:bg-[#3ea8ff]/30 pb-32">

            {/* ── Header ── */}
            <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-[#1c2e40] bg-[#0a1520]/80 backdrop-blur sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#258cf4] rounded-lg flex items-center justify-center font-black text-white text-base sm:text-lg group-hover:bg-white group-hover:text-[#258cf4] transition-colors">D</div>
                    <span className="font-bold tracking-wide text-lg hidden sm:block">DynoSync.co</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/leaderboard" className="text-[#3ea8ff] text-sm font-black tracking-widest uppercase">RANKS</Link>
                    <div className="w-px h-6 bg-[#1c2e40] mx-2"></div>
                    {/* LOGIN Button hidden as requested */}
                </div>
            </nav>

            {/* ── Page Header & Trophy ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-12 pb-8 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-tr from-yellow-500 to-amber-300 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.3)] transform rotate-3 text-4xl select-none">
                    🏆
                </div>
                <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight uppercase">GLOBAL RANKS</h1>
                <p className="text-[#4a6480] max-w-xl mx-auto text-sm sm:text-base leading-relaxed font-medium">
                    The ultimate hall of fame. Discover the highest performance builds documented and verified by the community worldwide.
                </p>

                {/* Filters / Tabs */}
                <div className="mt-8 flex items-center justify-center gap-2 p-1.5 bg-[#0d1f30] rounded-full border border-[#1c2e40] shadow-inner">
                    <button
                        onClick={() => setActiveTab('whp')}
                        className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 ${activeTab === 'whp' ? 'bg-[#258cf4] text-white shadow-[0_0_15px_rgba(37,140,244,0.4)]' : 'text-[#4a6480] hover:text-white'}`}
                    >
                        WHP
                    </button>
                    <button
                        onClick={() => setActiveTab('torque')}
                        className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 ${activeTab === 'torque' ? 'bg-[#258cf4] text-white shadow-[0_0_15px_rgba(37,140,244,0.4)]' : 'text-[#4a6480] hover:text-white'}`}
                    >
                        TORQUE
                    </button>
                    <button
                        onClick={() => setActiveTab('0-60')}
                        className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest transition-all duration-300 ${activeTab === '0-60' ? 'bg-[#258cf4] text-white shadow-[0_0_15px_rgba(37,140,244,0.4)]' : 'text-[#4a6480] hover:text-white'}`}
                    >
                        0-60
                    </button>
                </div>
            </div>

            {/* ── Leaderboard List ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-4">
                <div className="flex flex-col gap-3">

                    {/* Header Row */}
                    <div className="flex px-4 py-2 mb-2 text-[#4a6480] text-[10px] font-black tracking-[0.2em] items-center uppercase">
                        <div className="w-12 text-center">RANK</div>
                        <div className="flex-1 ml-4">BUILD & USER</div>
                        <div className="w-24 text-right">BEST {activeTab}</div>
                        <div className="w-6 sm:w-10"></div>
                    </div>

                    {isLoading ? (
                        <div className="p-20 text-center animate-pulse text-[#4a6480] font-black tracking-[0.2em] text-[10px]">
                            CALIBRATING GLOBAL DATA...
                        </div>
                    ) : rankedVehicles.length > 0 ? (
                        rankedVehicles.map((vehicle, index) => {
                            const rank = index + 1;
                            let rankStyle = "text-[#4a6480]";
                            let rankBg = "bg-transparent";
                            let borderStyle = "border-[#1c2e40] hover:border-[#3ea8ff]/50";

                            if (rank === 1) {
                                rankStyle = "text-yellow-900";
                                rankBg = "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
                                borderStyle = "border-yellow-500/30 hover:border-yellow-400";
                            } else if (rank === 2) {
                                rankStyle = "text-slate-900";
                                rankBg = "bg-gradient-to-br from-slate-300 to-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.1)]";
                                borderStyle = "border-slate-400/30 hover:border-slate-300";
                            } else if (rank === 3) {
                                rankStyle = "text-orange-900";
                                rankBg = "bg-gradient-to-br from-orange-400 to-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.1)]";
                                borderStyle = "border-orange-500/30 hover:border-orange-400";
                            }

                            return (
                                <Link
                                    href={`/u/${vehicle.users.username}/${vehicle.id}`}
                                    key={vehicle.id}
                                    className={`flex items-center px-4 py-4 rounded-2xl border bg-[#0d1f30]/80 backdrop-blur transition-all duration-300 hover:bg-[#152a40] group ${borderStyle} hover:-translate-y-1 shadow-lg hover:shadow-[#258cf4]/10`}
                                >
                                    <div className="w-12 flex justify-center">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm ${rankStyle} ${rankBg}`}>
                                            {rank}
                                        </div>
                                    </div>

                                    <div className="flex-1 ml-4 flex items-center pr-4 border-r border-[#1c2e40] mr-4 min-w-0">
                                        {vehicle.image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={vehicle.image_url} alt="Vehicle" className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#1c2e40] object-cover mr-4 shrink-0 border border-white/5 shadow-lg group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#1c2e40] flex items-center justify-center mr-4 shrink-0 border border-white/5 shadow-lg">
                                                <svg className="w-6 h-6 text-[#4a6480]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="text-white font-black truncate text-sm sm:text-base group-hover:text-[#3ea8ff] transition-colors tracking-tight">
                                                {vehicle.year} {vehicle.make} {vehicle.model}
                                            </div>
                                            <div className="text-[#4a6480] text-[10px] font-black truncate mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#258cf4] animate-pulse"></span>
                                                {vehicle.users.username}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-24 text-right flex flex-col items-end justify-center">
                                        <span className="text-white font-black text-lg sm:text-xl tracking-tighter">
                                            {activeTab === '0-60' ? (vehicle.sort_value === 999 ? 'N/A' : vehicle.sort_value.toFixed(1)) : Math.round(vehicle.sort_value)}
                                        </span>
                                        <span className="text-[#3ea8ff] text-[10px] font-black tracking-widest mt-0.5 uppercase">
                                            {activeTab === 'whp' ? 'WHP' : activeTab === 'torque' ? 'NM' : 'SEC'}
                                        </span>
                                    </div>

                                    <div className="w-6 sm:w-10 flex items-center justify-end">
                                        <svg className="w-5 h-5 text-[#4a6480] group-hover:text-white transition-all group-hover:translate-x-1 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="p-16 border border-dashed border-[#1c2e40] rounded-3xl flex flex-col items-center justify-center text-center mt-4 bg-[#0d1f30]/40 backdrop-blur-sm">
                            {apiError ? (
                                <>
                                    <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                                        <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-white font-black mb-2 uppercase tracking-widest">Arena Syncing</h3>
                                    <p className="text-[#4a6480] text-sm max-w-xs font-medium">Downloading global performance data. Showing cached benchmarks.</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-14 h-14 bg-[#1c2e40] rounded-full flex items-center justify-center mb-6">
                                        <svg className="w-7 h-7 text-[#4a6480]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-white font-black mb-2 uppercase tracking-widest">No Competitors</h3>
                                    <p className="text-[#4a6480] text-sm font-medium">Waiting for the first verified builds to enter the arena.</p>
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>

        </main>
    );
}
