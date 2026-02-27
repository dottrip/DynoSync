import { useState, useEffect, useCallback } from 'react'
import { api, Vehicle } from '../lib/api'

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.vehicles.list()
      setVehicles(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const archive = async (id: string) => {
    await api.vehicles.archive(id)
    setVehicles(prev => prev.filter(v => v.id !== id))
  }

  return { vehicles, loading, error, refetch: fetch, archive }
}
