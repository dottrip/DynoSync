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
            image_url: 'https://images.unsplash.com/photo-1621932953986-15fcf084da0f?auto=format&fit=crop&q=80&w=800',
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
            users: { username: 'Turbo_Titan' },
            dyno_records: [{ whp: 1120, torque_nm: 1250, zero_to_sixty: 2.5 }]
        },
        {
            id: 'mock-4',
            make: 'Toyota',
            model: 'Supra',
            year: 2022,
            image_url: 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&q=80&w=800',
            users: { username: 'JDM_Hero' },
            dyno_records: [{ whp: 580, torque_nm: 650, zero_to_sixty: 3.8 }]
        },
        {
            id: 'mock-5',
            make: 'Audi',
            model: 'RS6 Avant',
            year: 2023,
            image_url: 'https://images.unsplash.com/photo-1606148332462-811809ee5964?auto=format&fit=crop&q=80&w=800',
            users: { username: 'Vegas_Drift' },
            dyno_records: [{ whp: 820, torque_nm: 1050, zero_to_sixty: 2.9 }]
        },
        {
            id: 'mock-you',
            make: 'Ford',
            model: 'Mustang GT',
            year: 2024,
            image_url: null, // Test placeholder
            users: { username: 'You' },
            dyno_records: [{ whp: 620, torque_nm: 750, zero_to_sixty: 3.5 }]
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
                        // Blend "You" into real data for demo
                        const youEntry = MOCK_VEHICLES.find(v => v.users.username === 'You')!;
                        // Make real data more varied for demo if names repeat
                        const variedData = data.map((v: any, i: number) => ({
                            ...v,
                            users: { username: i === 0 ? 'GhostRider_99' : i === 1 ? 'TrackMonster' : v.users.username }
                        }));
                        setVehicles([...variedData, youEntry]);
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
    const sortedVehicles = [...vehicles]
        .map(v => ({ ...v, sort_value: getBestValue(v, activeTab) }))
        .filter(v => activeTab === '0-60' ? v.sort_value < 999 : v.sort_value > 0)
        .sort((a, b) => {
            if (activeTab === '0-60') return a.sort_value - b.sort_value;
            return b.sort_value - a.sort_value;
        });

    const top3 = sortedVehicles.slice(0, 3);
    const rest = sortedVehicles.slice(3);

    return (
        <main className="min-h-screen bg-[#101922] text-white font-sans selection:bg-[#258cf4]/30 pb-32 overflow-x-hidden">

            {/* ── Header ── */}
            <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/5 bg-[#101922]/80 backdrop-blur sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#258cf4] rounded-lg flex items-center justify-center font-black text-white text-base sm:text-lg group-hover:bg-white group-hover:text-[#258cf4] transition-all duration-300">D</div>
                    <span className="font-bold tracking-tight text-lg hidden sm:block">DynoSync.co</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/leaderboard" className="text-[#258cf4] text-xs font-black tracking-widest uppercase py-1 border-b-2 border-[#258cf4]">RANKS</Link>
                    <div className="w-px h-6 bg-white/10 mx-2"></div>
                </div>
            </nav>

            {/* ── Page Header & Trophy ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-12 pb-8 text-center flex flex-col items-center">
                <h1 className="text-4xl sm:text-5xl font-black mb-2 tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-[#258cf4] drop-shadow-[0_0_20px_rgba(37,140,244,0.3)]">
                    DOMINATE THE
                    <br />
                    LEADERBOARD
                </h1>
                <p className="text-[#258cf4]/60 text-[10px] font-black tracking-[0.3em] uppercase mb-8">
                    GLOBAL SEASON 4
                </p>

                {/* Filters / Tabs */}
                <div className="flex items-center justify-center gap-2 p-1.5 bg-[#1c2a38] rounded-xl border border-white/5 mb-12 shadow-inner">
                    <button
                        onClick={() => setActiveTab('whp')}
                        className={`px-8 py-2.5 rounded-lg text-[11px] font-black tracking-widest transition-all duration-300 ${activeTab === 'whp' ? 'bg-[#258cf4] text-white shadow-[0_0_20px_rgba(37,140,244,0.3)]' : 'text-gray-400 hover:text-white'}`}
                    >
                        GLOBAL
                    </button>
                    <button
                        className="px-8 py-2.5 rounded-lg text-[11px] font-black tracking-widest text-gray-500 cursor-not-allowed"
                    >
                        REGIONAL
                    </button>
                    <button
                        className="px-8 py-2.5 rounded-lg text-[11px] font-black tracking-widest text-gray-500 cursor-not-allowed"
                    >
                        FRIENDS
                    </button>
                </div>

                {/* ── Podium Section ── */}
                {!isLoading && top3.length === 3 && (
                    <div className="flex items-end justify-center gap-4 sm:gap-12 mb-16 px-4">
                        {/* Rank 2 */}
                        <div className="flex flex-col items-center pb-4">
                            <div className="relative mb-3">
                                <AvatarContainer url={top3[1].image_url} size="w-16 h-16 sm:w-20 sm:h-20" border="border-slate-400" />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black shadow-sm">#2</div>
                            </div>
                            <span className="text-white/80 font-black text-xs sm:text-sm truncate w-24 text-center">{top3[1].users.username}</span>
                            <span className="text-[#258cf4] font-bold text-[10px] mt-1">{Math.round(top3[1].sort_value)} <span className="opacity-50 uppercase">{activeTab === '0-60' ? 'sec' : activeTab === 'whp' ? 'pts' : 'nm'}</span></span>
                        </div>

                        {/* Rank 1 */}
                        <div className="flex flex-col items-center">
                            <div className="text-2xl mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">👑</div>
                            <div className="relative mb-4 group">
                                <AvatarContainer
                                    url={top3[0].image_url}
                                    size="w-24 h-24 sm:w-32 sm:h-32"
                                    border="border-[#258cf4]"
                                    className="p-1.5 shadow-[0_0_40px_rgba(37,140,244,0.3)] bg-gradient-to-tr from-[#258cf4]/20 to-transparent group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#258cf4] text-white px-4 py-1 rounded-lg text-xs font-black shadow-lg">#1</div>
                            </div>
                            <span className="text-white font-black text-sm sm:text-lg">{top3[0].users.username}</span>
                            <span className="text-[#258cf4] font-black text-xs mt-1">{Math.round(top3[0].sort_value)} <span className="opacity-60 text-[10px] uppercase">{activeTab === '0-60' ? 'sec' : 'pts'}</span></span>
                        </div>

                        {/* Rank 3 */}
                        <div className="flex flex-col items-center pb-4">
                            <div className="relative mb-3">
                                <AvatarContainer url={top3[2].image_url} size="w-16 h-16 sm:w-20 sm:h-20" border="border-amber-700/50" />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-100 px-2 py-0.5 rounded-md text-[10px] font-black shadow-sm">#3</div>
                            </div>
                            <span className="text-white/70 font-black text-xs sm:text-sm truncate w-24 text-center">{top3[2].users.username}</span>
                            <span className="text-[#258cf4] font-bold text-[10px] mt-1">{Math.round(top3[2].sort_value)} <span className="opacity-50 uppercase">{activeTab === '0-60' ? 'sec' : activeTab === 'whp' ? 'pts' : 'nm'}</span></span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Leaderboard List ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-8">
                {isLoading ? (
                    <div className="p-20 text-center animate-pulse text-[#258cf4]/40 font-black tracking-[0.3em] text-[11px]">
                        SYNCHRONIZING GLOBAL DATA...
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {sortedVehicles.map((vehicle, index) => {
                            const isMe = vehicle.users.username === 'You';
                            const rank = index + 1;

                            return (
                                <div key={vehicle.id} className={`group relative transition-all duration-300 ${isMe ? 'scale-[1.02] z-10' : ''}`}>
                                    <Link
                                        href={`/u/${vehicle.users.username}/${vehicle.id}`}
                                        className={`flex items-center px-6 py-5 rounded-2xl border transition-all duration-300 backdrop-blur-md overflow-hidden
                                            ${isMe
                                                ? 'bg-[#258cf4]/10 border-[#258cf4]/50 shadow-[0_0_30px_rgba(37,140,244,0.1)]'
                                                : 'bg-[#1c2a38]/60 border-white/5 hover:bg-[#1c2a38] hover:border-[#258cf4]/30 hover:-translate-y-1'
                                            }`}
                                    >
                                        <div className="w-10 font-black text-sm text-center">
                                            <span className={isMe ? 'text-[#258cf4]' : 'text-white/40'}>{rank}</span>
                                        </div>

                                        <div className="flex-1 flex items-center gap-4 min-w-0">
                                            <AvatarContainer url={vehicle.image_url} size="w-12 h-12 sm:w-14 sm:h-14" />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-black text-sm sm:text-base tracking-tight ${isMe ? 'text-[#258cf4]' : 'text-white'}`}>
                                                        {isMe ? 'You' : vehicle.users.username}
                                                    </span>
                                                    {isMe && <MaterialIcons name="trending_up" size={16} color="#258cf4" className="animate-bounce" />}
                                                </div>
                                                <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                                                    {vehicle.make} {vehicle.model}
                                                    {isMe && <span className="text-[#258cf4]/60 ml-1 font-black flex items-center gap-1">#12 <MaterialIcons name="expand_less" size={12} /></span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right flex flex-col items-end min-w-[80px]">
                                            <span className={`font-black text-xl tracking-tighter ${isMe ? 'text-[#258cf4]' : 'text-white'}`}>
                                                {activeTab === '0-60' ? (vehicle.sort_value < 999 ? vehicle.sort_value.toFixed(1) : '--') : Math.round(vehicle.sort_value).toLocaleString()}
                                            </span>
                                            <span className="text-white/20 text-[9px] font-black tracking-widest uppercase -mt-1">
                                                {activeTab === 'whp' ? 'POINTS' : activeTab === 'torque' ? 'NM' : 'SEC'}
                                            </span>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── FAB Filter ── */}
            <button className="fixed bottom-12 right-6 sm:right-12 w-14 h-14 bg-[#258cf4] rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(37,140,244,0.4)] transition-transform hover:scale-110 active:scale-95 z-[60]">
                <MaterialIcons name="tune" size={24} color="white" />
            </button>

        </main>
    );
}

// ─── Avatar / Image Component with Placeholder ────────────────────────────────
function AvatarContainer({ url, size, border, className }: { url: string | null, size: string, border?: string, className?: string }) {
    const [isBroken, setIsBroken] = useState(false);

    return (
        <div className={`${size} rounded-xl overflow-hidden flex items-center justify-center bg-[#101922] border ${border || 'border-white/10'} ${className || ''} relative`}>
            {url && !isBroken ? (
                <img
                    src={url}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt="Vehicle"
                    onError={() => setIsBroken(true)}
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1c2a38]">
                    <MaterialIcons name="directions_car" size={28} color="#4a6480" />
                </div>
            )}
        </div>
    );
}

// ─── MaterialIcons Shim for Web (since it's not a native app) ──────────────────
function MaterialIcons({ name, size, color, className }: { name: string, size?: number, color?: string, className?: string }) {
    return (
        <span
            className={`material-symbols-outlined select-none ${className || ''}`}
            style={{ fontSize: size, color: color, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
        >
            {name}
        </span>
    )
}
