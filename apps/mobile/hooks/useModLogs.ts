import { useState, useEffect, useCallback } from 'react'
import { api, ModLog } from '../lib/api'

export function useModLogs(vehicleId: string) {
  const [logs, setLogs] = useState<ModLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.mods.list(vehicleId)
      setLogs(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [vehicleId])

  useEffect(() => { fetch() }, [fetch])

  const remove = async (id: string) => {
    await api.mods.delete(vehicleId, id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  return { logs, loading, error, refetch: fetch, remove }
}
