import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'Global Leaderboards | DynoSync',
    description: 'See the top horsepower and torque builds from the DynoSync community across the globe.',
};

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
    }[];
};

export default async function LeaderboardPage() {
    // Fetch leaderboard data. Uses revalidate to enable Incremental Static Regeneration (ISR).
    // Ideally, this calls a specialized leaderboard endpoint. Using the public endpoint as a fallback abstraction.
    let vehicles: LeaderboardVehicle[] = [];
    let apiError: string | null = null;

    try {
        const res = await fetch('https://dynosync-api.dynosync-dev.workers.dev/public/vehicles?limit=50', {
            next: { revalidate: 300 } // Update rankings every 5 minutes
        });

        if (res.ok) {
            vehicles = await res.json();
        } else {
            apiError = `API Error: ${res.status} ${res.statusText}`;
            console.error(apiError);
        }
    } catch (error) {
        apiError = "Network connection failed. Please check the API status.";
        console.error('Failed to fetch leaderboard', error);
    }

    // Calculate highest WHP for each vehicle to compute rankings
    const rankedVehicles = vehicles.map(v => {
        const highestDyno = v.dyno_records && v.dyno_records.length > 0
            ? v.dyno_records.reduce((max, record) => Math.max(max, record.whp), 0)
            : 0;

        return {
            ...v,
            max_whp: highestDyno
        };
    })
        // Filter out vehicles with 0 WHP and sort by highest WHP descending
        .filter(v => v.max_whp > 0)
        .sort((a, b) => b.max_whp - a.max_whp);

    return (
        <main className="min-h-screen bg-[#0a1520] text-white font-sans selection:bg-[#3ea8ff]/30 pb-32">

            {/* ── Header ── */}
            <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-[#1c2e40] bg-[#0a1520]/80 backdrop-blur sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#258cf4] rounded-lg flex items-center justify-center font-black text-white text-base sm:text-lg group-hover:bg-white group-hover:text-[#258cf4] transition-colors">D</div>
                    <span className="font-bold tracking-wide text-lg hidden sm:block">DynoSync.co</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/leaderboard" className="text-[#3ea8ff] text-sm font-bold">RANKS</Link>
                    <div className="w-px h-4 bg-[#1c2e40]"></div>
                    <button className="text-[#4a6480] text-sm font-bold hover:text-white transition-colors">LOGIN</button>
                </div>
            </nav>

            {/* ── Page Header & Trophy ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-12 pb-8 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-tr from-yellow-500 to-amber-300 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.2)] transform rotate-3">
                    <svg className="w-10 h-10 text-yellow-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">GLOBAL RANKS</h1>
                <p className="text-[#4a6480] max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
                    The ultimate hall of fame. Discover the highest horsepower builds documented and verified by the community worldwide.
                </p>

                {/* Filters Placeholder */}
                <div className="mt-8 flex items-center justify-center gap-2 p-1.5 bg-[#0d1f30] rounded-full border border-[#1c2e40]">
                    <button className="px-6 py-2 rounded-full bg-[#1c2e40] text-white text-xs font-bold tracking-widest">WHP</button>
                    <button className="px-6 py-2 rounded-full text-[#4a6480] hover:text-white text-xs font-bold tracking-widest transition-colors">TORQUE</button>
                    <button className="px-6 py-2 rounded-full text-[#4a6480] hover:text-white text-xs font-bold tracking-widest transition-colors">0-60</button>
                </div>
            </div>

            {/* ── Leaderboard List ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-4">
                <div className="flex flex-col gap-3">

                    {/* Header Row */}
                    <div className="flex px-4 py-2 mb-2 text-[#4a6480] text-[10px] font-extrabold tracking-widest items-center">
                        <div className="w-12 text-center">RANK</div>
                        <div className="flex-1 ml-4">BUILD & BUILDER</div>
                        <div className="w-24 text-right">TOP WHP</div>
                        <div className="w-10 sm:w-16"></div>
                    </div>

                    {rankedVehicles.length > 0 ? (
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
                                    className={`flex items-center px-4 py-4 rounded-xl border bg-[#0d1f30]/80 backdrop-blur transition-all hover:bg-[#152a40] group ${borderStyle}`}
                                >
                                    <div className="w-12 flex justify-center">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm ${rankStyle} ${rankBg}`}>
                                            {rank}
                                        </div>
                                    </div>

                                    <div className="flex-1 ml-4 flex items-center pr-4 border-r border-[#1c2e40] mr-4">
                                        {vehicle.image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={vehicle.image_url} alt="Vehicle" className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-[#1c2e40] object-cover mr-4 shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-[#1c2e40] flex items-center justify-center mr-4 shrink-0">
                                                <svg className="w-5 h-5 text-[#4a6480]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="text-white font-black truncate text-sm sm:text-base group-hover:text-[#3ea8ff] transition-colors">
                                                {vehicle.year} {vehicle.make} {vehicle.model}
                                            </div>
                                            <div className="text-[#4a6480] text-xs font-semibold truncate mt-0.5">
                                                {vehicle.users.username}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-24 text-right flex flex-col items-end justify-center">
                                        <span className="text-white font-black text-lg sm:text-xl">{vehicle.max_whp}</span>
                                        <span className="text-[#3ea8ff] text-[10px] sm:text-xs font-extrabold tracking-widest mt-0.5">WHP</span>
                                    </div>

                                    <div className="w-10 sm:w-16 flex items-center justify-end">
                                        <svg className="w-5 h-5 text-[#4a6480] group-hover:text-white transition-colors group-hover:translate-x-1 transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="p-12 border border-dashed border-[#1c2e40] rounded-xl flex flex-col items-center justify-center text-center mt-4 bg-[#0d1f30]/40">
                            {apiError ? (
                                <>
                                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-white font-bold mb-2">System Syncing...</h3>
                                    <p className="text-[#4a6480] text-sm max-w-xs">{apiError.includes('404') ? 'Initializing global ranking data. Please check back after backend deployment.' : apiError}</p>
                                </>
                            ) : (
                                <>
                                    <svg className="w-12 h-12 text-[#4a6480] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    <h3 className="text-white font-bold mb-2">No Records Found</h3>
                                    <p className="text-[#4a6480] text-sm">Waiting for the first vehicles to be built and verified.</p>
                                </>
                            )}
                        </div>
                    )}

                </div>
            </div>

        </main>
    );
}
