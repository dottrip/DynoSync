import { useState, useEffect } from 'react'
import { api, PublicVehicleProfile } from '../lib/api'

export interface FormattedBuildProfile {
    id: string
    name: string
    model: string
    owner: string
    whp: number
    whpDelta: string | null
    torque: number
    torqueDelta: string | null
    zeroSixty: number | null
    zeroSixtyDelta: string | null
    image: string
    social: {
        instagram: string | null
        discord: string | null
    }
    overview: { engine: string; drivetrain: string; turbo: string; fuel: string }
    mods: Record<string, Array<{ name: string; desc: string }>>
    history: {
        stats: { mods: number; sheets: string; time: string }
        dynoGallery: Array<{ id: string; title: string; whp: number; tq: number | null; img: string }>
        timeline: Array<{ date: string; title: string; desc: string; impact: string | null }>
    }
}

export function usePublicVehicle(vehicleId: string) {
    const [data, setData] = useState<FormattedBuildProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!vehicleId) return

        api.public.getVehicle(vehicleId)
            .then(profile => {
                const dynoRecords = profile.dyno_records || []
                const modLogs = profile.mod_logs || []
                const sortedDynos = [...dynoRecords].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())

                let maxWhp = 0
                let maxTq = 0
                let best060 = Infinity

                sortedDynos.forEach(d => {
                    if (d.whp > maxWhp) maxWhp = d.whp
                    if (d.torque_nm && d.torque_nm > maxTq) maxTq = d.torque_nm
                    if (d.zero_to_sixty && d.zero_to_sixty < best060) best060 = d.zero_to_sixty
                })

                if (best060 === Infinity) best060 = 0

                let whpDelta = null
                let tqDelta = null
                let zsDelta = null

                if (sortedDynos.length > 1) {
                    const first = sortedDynos[0]
                    const last = sortedDynos[sortedDynos.length - 1]

                    if (last.whp > first.whp) {
                        const pct = Math.round(((last.whp - first.whp) / first.whp) * 100)
                        whpDelta = `+${pct}%`
                    }
                    if (last.torque_nm && first.torque_nm && last.torque_nm > first.torque_nm) {
                        const pct = Math.round(((last.torque_nm - first.torque_nm) / first.torque_nm) * 100)
                        tqDelta = `+${pct}%`
                    }
                    if (last.zero_to_sixty && first.zero_to_sixty && last.zero_to_sixty < first.zero_to_sixty) {
                        const diff = (first.zero_to_sixty - last.zero_to_sixty).toFixed(1)
                        zsDelta = `-${diff}s`
                    }
                }

                const modsGrouped: Record<string, Array<{ name: string; desc: string }>> = {}
                modLogs.forEach(m => {
                    if (!modsGrouped[m.category]) modsGrouped[m.category] = []
                    const lines = m.description.split('\n')
                    modsGrouped[m.category].push({
                        name: m.category.toUpperCase() + ' Upgrade',
                        desc: lines[0]
                    })
                })

                const findModDesc = (cat: string) => modLogs.find(m => m.category === cat)?.description?.split('\n')[0] || 'Unknown/Stock'

                // Timeline: combine and sort descending
                const timeline: FormattedBuildProfile['history']['timeline'] = []

                // Add mods to timeline
                modLogs.forEach(m => {
                    const date = new Date(m.installed_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
                    timeline.push({
                        date,
                        title: m.category.charAt(0).toUpperCase() + m.category.slice(1) + ' Upgrade',
                        desc: m.description,
                        impact: m.cost ? `$${m.cost}` : null,
                        _timestamp: new Date(m.installed_at).getTime()
                    } as any)
                })

                // Add dynos to timeline
                let prevWhp = 0
                sortedDynos.forEach(d => {
                    const date = new Date(d.recorded_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
                    const diff = prevWhp > 0 ? d.whp - prevWhp : 0
                    timeline.push({
                        date,
                        title: d.notes?.split('\n')[0] || 'Dyno Tuning',
                        desc: `WHP: ${d.whp} | Torque: ${d.torque_nm || 'N/A'} Nm`,
                        impact: diff > 0 ? `+${diff} WHP` : null,
                        _timestamp: new Date(d.recorded_at).getTime()
                    } as any)
                    prevWhp = d.whp
                })

                timeline.sort((a: any, b: any) => b._timestamp - a._timestamp)

                const formatted: FormattedBuildProfile = {
                    id: profile.id,
                    name: profile.trim ? `${profile.make} ${profile.model} ${profile.trim}` : `${profile.make} ${profile.model}`,
                    model: `${profile.make} ${profile.model} (${profile.year})`,
                    owner: `@${profile.users?.username || 'unknown'}`,
                    whp: maxWhp,
                    whpDelta,
                    torque: maxTq,
                    torqueDelta: tqDelta,
                    zeroSixty: best060 || null,
                    zeroSixtyDelta: zsDelta,
                    image: profile.image_url || 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80',
                    social: {
                        instagram: profile.users?.instagram_handle || null,
                        discord: profile.users?.discord_id || null,
                    },
                    overview: {
                        engine: findModDesc('engine'),
                        drivetrain: profile.drivetrain || 'Stock/Unknown',
                        turbo: findModDesc('exhaust'), // Approximate for turbo
                        fuel: findModDesc('other')
                    },
                    mods: modsGrouped,
                    history: {
                        stats: {
                            mods: modLogs.length,
                            sheets: dynoRecords.length.toString().padStart(2, '0'),
                            time: 'N/A' // Not calculating time between first and last for now
                        },
                        dynoGallery: dynoRecords.map(d => ({
                            id: d.id,
                            title: d.notes?.split('\n')[0] || 'Dyno Sheet',
                            whp: d.whp,
                            tq: d.torque_nm || null,
                            img: profile.image_url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80'
                        })),
                        timeline
                    }
                }

                setData(formatted)
            })
            .catch(err => {
                setError(err.message)
            })
            .finally(() => setLoading(false))
    }, [vehicleId])

    return { data, loading, error }
}
