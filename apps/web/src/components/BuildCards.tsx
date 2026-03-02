import React from 'react';

// Shared types (simplified from API for frontend usage)
export type DynoRecord = {
    id: string;
    whp: number;
    torque_nm?: number | null;
    zero_to_sixty?: number | null;
    quarter_mile?: number | null;
    recorded_at: string;
    notes?: string | null;
};

export type ModLog = {
    id: string;
    category: string;
    description: string;
    cost?: number | null;
    installed_at: string;
};

// ─── Categories Setup ──────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
    engine: '#f59e0b', exhaust: '#ef4444', intake: '#3ea8ff',
    suspension: '#8b5cf6', brakes: '#dc2626', wheels: '#6b7280',
    aero: '#06b6d4', interior: '#a78bfa', electronics: '#10b981', other: '#64748b',
};

// SVG Icons based on Category
const CatIcon = ({ category, color }: { category: string; color: string }) => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    );
};

// ─── Dyno Card ───────────────────────────────────────────────────
export function DynoCard({ record, prev }: { record: DynoRecord; prev?: DynoRecord }) {
    const delta = prev ? record.whp - prev.whp : null;
    const deltaPct = delta !== null && prev ? (delta / prev.whp) * 100 : null;
    const isBaseline = record.notes?.toLowerCase() === 'stock baseline';
    const rxDate = new Date(record.recorded_at);

    return (
        <div className="flex flex-col sm:flex-row bg-[#0d1f30] rounded-xl border border-[#1c2e40] p-4 mb-3 w-full transition-colors hover:border-[#3ea8ff]/50">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-white text-3xl font-black">{record.whp}</span>
                    <span className="text-[#3ea8ff] text-sm font-bold pt-1">WHP</span>

                    {delta !== null && deltaPct !== null && (
                        <div className={`flex items-center gap-1 rounded px-2 py-0.5 ${delta >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                            <span className={`text-xs font-bold ${delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {delta >= 0 ? '↑' : '↓'} {delta >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%
                            </span>
                        </div>
                    )}

                    {isBaseline && (
                        <div className="bg-slate-500/20 rounded px-2 py-0.5">
                            <span className="text-slate-400 text-[10px] font-extrabold tracking-widest">STOCK</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-4 mb-1">
                    {record.torque_nm != null && <span className="text-[#4a6480] text-sm font-semibold">{record.torque_nm} LB-FT</span>}
                    {record.zero_to_sixty != null && <span className="text-[#4a6480] text-sm font-semibold">{record.zero_to_sixty}s 0-60</span>}
                    {record.quarter_mile != null && <span className="text-[#4a6480] text-sm font-semibold">{record.quarter_mile}s 1/4 Mi</span>}
                </div>

                {record.notes && !isBaseline && (
                    <p className="text-[#3d5470] text-sm mt-2 italic line-clamp-2">{record.notes}</p>
                )}
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-[#1c2e40]">
                <span className="text-[#4a6480] text-sm font-semibold">{rxDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                <span className="text-[#2a3f55] text-xs">{rxDate.getFullYear()}</span>
            </div>
        </div>
    );
}

// ─── Mod Card ────────────────────────────────────────────────────
export function ModCard({ log }: { log: ModLog }) {
    const color = CAT_COLOR[log.category.toLowerCase()] ?? '#64748b';
    const logDate = new Date(log.installed_at);

    return (
        <div
            className="flex bg-[#0d1f30] rounded-xl border border-[#1c2e40] overflow-hidden mb-3 w-full transition-transform hover:-translate-y-0.5"
            style={{ borderLeftWidth: '4px', borderLeftColor: color }}
        >
            <div className="w-14 items-center justify-center flex shrink-0" style={{ backgroundColor: `${color}18` }}>
                <CatIcon category={log.category} color={color} />
            </div>

            <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-2">
                    <div
                        className="rounded px-2 py-0.5 border"
                        style={{ backgroundColor: `${color}20`, borderColor: `${color}40` }}
                    >
                        <span className="text-[10px] font-extrabold tracking-widest uppercase" style={{ color }}>
                            {log.category}
                        </span>
                    </div>
                    <span className="text-[#3d5470] text-xs">
                        {logDate.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>

                <p className="text-white text-sm leading-relaxed mb-1 line-clamp-2">
                    {log.description}
                </p>

                {log.cost != null && (
                    <span className="text-emerald-500 text-sm font-bold">${log.cost.toFixed(2)}</span>
                )}
            </div>
        </div>
    );
}
