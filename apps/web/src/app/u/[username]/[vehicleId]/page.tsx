import React from 'react';
import { notFound } from 'next/navigation';
import { DynoCard, ModCard, type DynoRecord, type ModLog } from '@/components/BuildCards';
import Link from 'next/link';

// Use Next.js 15+ async generateMetadata
export async function generateMetadata({ params }: { params: Promise<{ username: string; vehicleId: string }> }) {
    const resolvedParams = await params;
    return {
        title: `${resolvedParams.username}'s Build | DynoSync`,
        description: `Check out this performance build on DynoSync.`,
    };
}

export default async function PublicVehicleProfile({ params }: { params: Promise<{ username: string; vehicleId: string }> }) {
    const resolvedParams = await params;
    const { username, vehicleId } = resolvedParams;

    // Fetch data from public API
    const res = await fetch(`https://dynosync-api.dynosync-dev.workers.dev/public/vehicle/${vehicleId}`, {
        next: { revalidate: 60 } // Revalidate every 60 seconds
    });

    if (!res.ok) {
        if (res.status === 404) notFound();
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a1520] text-white">
                <div className="text-center">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h1 className="text-2xl font-bold mb-2">Error Loading Profile</h1>
                    <p className="text-gray-400">Could not fetch vehicle data. Please try again later.</p>
                </div>
            </div>
        );
    }

    const vehicle = await res.json();
    const dynoRecords: DynoRecord[] = vehicle.dyno_records || [];
    const modLogs: ModLog[] = vehicle.mod_logs || [];

    const sortedDyno = [...dynoRecords].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    const sortedMods = [...modLogs].sort((a, b) => new Date(b.installed_at).getTime() - new Date(a.installed_at).getTime());

    const latestWhp = sortedDyno[0]?.whp;
    const totalCost = sortedMods.reduce((sum, l) => sum + (l.cost ?? 0), 0);

    return (
        <main className="min-h-screen bg-[#0a1520] text-white font-sans selection:bg-[#3ea8ff]/30">

            {/* ── Header Nav ── */}
            <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-[#1c2e40] bg-[#0a1520]/80 backdrop-blur sticky top-0 z-50">
                <div>
                    <div className="text-[#4a6480] text-[10px] font-extrabold tracking-widest mb-1 uppercase">BUILT BY {vehicle.users?.username || username}</div>
                    <h1 className="text-lg sm:text-xl font-black truncate max-w-[200px] sm:max-w-md">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                    </h1>
                </div>
                <div className="flex items-center gap-2 border border-[#1c2e40] rounded-full px-3 py-1.5 bg-[#0d1f30]">
                    <svg className="w-3.5 h-3.5 text-[#4a6480]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[#4a6480] text-[10px] sm:text-xs font-bold tracking-widest">PUBLIC</span>
                </div>
            </nav>

            {/* ── Vehicle Hero Image ── */}
            {vehicle.image_url && (
                <div className="w-full h-[30vh] sm:h-[40vh] relative border-b border-[#1c2e40]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={vehicle.image_url}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a1520] to-transparent/20"></div>
                </div>
            )}

            {/* ── Hero Stats ── */}
            <div className="flex items-center justify-between px-4 sm:px-8 py-6 border-b border-[#1c2e40] bg-[#1c2e40]/30 -mt-px relative z-10 w-full max-w-4xl mx-auto rounded-b-xl sm:rounded-none sm:bg-transparent sm:border-0 sm:py-8 overflow-x-auto no-scrollbar">
                <div className="flex flex-1 flex-col items-center justify-center min-w-[80px]">
                    <span className="text-white text-3xl sm:text-4xl font-black mb-1">{latestWhp ?? '—'}</span>
                    <span className="text-[#4a6480] text-[10px] sm:text-xs font-extrabold tracking-widest">WHP</span>
                </div>
                <div className="w-px h-12 bg-[#1c2e40] mx-2 shrink-0"></div>
                <div className="flex flex-1 flex-col items-center justify-center min-w-[80px]">
                    <span className="text-white text-3xl sm:text-4xl font-black mb-1">{dynoRecords.length}</span>
                    <span className="text-[#4a6480] text-[10px] sm:text-xs font-extrabold tracking-widest">DYNOS</span>
                </div>
                <div className="w-px h-12 bg-[#1c2e40] mx-2 shrink-0"></div>
                <div className="flex flex-1 flex-col items-center justify-center min-w-[80px]">
                    <span className="text-white text-3xl sm:text-4xl font-black mb-1">{modLogs.length}</span>
                    <span className="text-[#4a6480] text-[10px] sm:text-xs font-extrabold tracking-widest">MODS</span>
                </div>
                <div className="w-px h-12 bg-[#1c2e40] mx-2 shrink-0"></div>
                <div className="flex flex-1 flex-col items-center justify-center min-w-[80px]">
                    <span className={`text-2xl sm:text-3xl font-black mb-1 ${totalCost > 0 ? 'text-emerald-500' : 'text-white'}`}>
                        {totalCost > 0 ? `$${totalCost > 999 ? (totalCost / 1000).toFixed(1) + 'k' : totalCost}` : '—'}
                    </span>
                    <span className="text-[#4a6480] text-[10px] sm:text-xs font-extrabold tracking-widest">INVESTED</span>
                </div>
            </div>

            {/* ── Build History Content ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 pb-32">
                <div className="border-b border-[#1c2e40] pb-4 mb-8">
                    <h2 className="text-[#3ea8ff] text-sm font-extrabold tracking-widest">BUILD HISTORY</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

                    {/* Dyno Runs Column */}
                    <div>
                        {sortedDyno.length > 0 ? (
                            <>
                                <h3 className="text-[#4a6480] text-xs font-extrabold tracking-[1.5px] mb-4 ml-1">DYNO RUNS</h3>
                                <div className="space-y-4">
                                    {sortedDyno.map((item, index) => (
                                        <DynoCard
                                            key={item.id}
                                            record={item}
                                            prev={
                                                // Find the immediate previous record chronologically 
                                                // Since sortedDyno is descending (newest first), the previous run is at index + 1
                                                sortedDyno[index + 1]
                                            }
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="p-8 border border-dashed border-[#1c2e40] rounded-xl flex flex-col items-center justify-center text-center">
                                <span className="text-[#4a6480] text-sm mb-2">No dyno records found.</span>
                            </div>
                        )}
                    </div>

                    {/* Modifications Column */}
                    <div>
                        {sortedMods.length > 0 ? (
                            <>
                                <h3 className="text-[#4a6480] text-xs font-extrabold tracking-[1.5px] mb-4 ml-1">MODIFICATIONS</h3>
                                <div className="space-y-4">
                                    {sortedMods.map(item => (
                                        <ModCard key={item.id} log={item} />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="p-8 border border-dashed border-[#1c2e40] rounded-xl flex flex-col items-center justify-center text-center">
                                <span className="text-[#4a6480] text-sm">No modification logs found.</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* ── Promo Footer ── */}
            <Link href="/" className="fixed bottom-0 left-0 right-0 bg-[#0d1f30] border-t border-[#1c2e40] p-4 flex flex-col sm:flex-row items-center justify-center gap-3 transition-colors hover:bg-[#152a40] group z-50">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#3ea8ff] rounded-md flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-[#4a6480] text-sm font-bold tracking-wide group-hover:text-white transition-colors">Powered by DynoSync.co</span>
                </div>
                <span className="text-white text-xs sm:text-sm font-bold px-4 py-1.5 bg-[#1c2e40] rounded-full group-hover:bg-[#3ea8ff] transition-colors">
                    Create Your Digital Garage &rarr;
                </span>
            </Link>

        </main>
    );
}
