import { useState, useEffect, useCallback } from 'react'
import { api, DynoRecord } from '../lib/api'

export function useDynoRecords(vehicleId: string) {
  const [records, setRecords] = useState<DynoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.dyno.list(vehicleId)
      setRecords(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [vehicleId])

  useEffect(() => { fetch() }, [fetch])

  const remove = async (id: string) => {
    await api.dyno.delete(vehicleId, id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  return { records, loading, error, refetch: fetch, remove }
}
