import { useState, useCallback, useEffect } from 'react'
import { api, LeaderboardEntry } from '../lib/api'

export function useLeaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchLeaderboard = useCallback(async (criteria?: string, region?: string) => {
        setLoading(true)
        setError(null)
        try {
            const data = await api.leaderboard.getTopRuns(criteria, region)
            setEntries(data)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLeaderboard()
    }, [fetchLeaderboard])

    return { entries, loading, error, refetch: fetchLeaderboard }
}
