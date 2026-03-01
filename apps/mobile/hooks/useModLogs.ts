import { useState, useEffect, useCallback } from 'react'
import { api, ModLog } from '../lib/api'
import { getCache, setCache, invalidateCache } from '../lib/cache'

export function useModLogs(vehicleId: string) {
  const key = `mods:${vehicleId}`
  const cached = getCache<ModLog[]>(key)
  const [logs, setLogs] = useState<ModLog[]>(cached ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (showSpinner = false) => {
    if (!vehicleId) return
    if (showSpinner) setLoading(true)
    setError(null)
    try {
      const data = await api.mods.list(vehicleId)
      setCache(key, data)
      setLogs(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId])

  useEffect(() => {
    fetch(!cached)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetch])

  const remove = async (id: string) => {
    await api.mods.delete(vehicleId, id)
    invalidateCache(key)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  return { logs, loading, error, refetch: () => fetch(false), hardRefetch: () => fetch(true), remove }
}
