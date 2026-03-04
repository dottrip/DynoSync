import { useState, useEffect, useCallback } from 'react'
import { api, Vehicle } from '../lib/api'
import { getCache, setCache, invalidateCache } from '../lib/cache'

const KEY = 'vehicles'

export function useVehicles() {
  const cached = getCache<Vehicle[]>(KEY)
  const [vehicles, setVehicles] = useState<Vehicle[]>(cached ?? [])
  // Only show spinner if we have nothing cached yet
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    setError(null)
    try {
      const data = await api.vehicles.list()
      setCache(KEY, data)
      setVehicles(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // If we have cached data, revalidate silently; otherwise show spinner
    fetch(!cached)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetch])

  const archive = async (id: string) => {
    await api.vehicles.archive(id)
    setVehicles(prev => {
      const next = prev.filter(v => v.id !== id)
      setCache(KEY, next)
      return next
    })
  }

  return { vehicles, loading, error, refetch: () => fetch(false), hardRefetch: () => fetch(true), archive }
}
