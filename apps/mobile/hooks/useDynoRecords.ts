import { useState, useEffect, useCallback } from 'react'
import { api, DynoRecord } from '../lib/api'
import { getCache, setCache, invalidateCache } from '../lib/cache'
import { useVehicleStore } from '../store/useVehicleStore'

export function useDynoRecords(vehicleId: string) {
  const key = `dyno:${vehicleId}`
  const cached = getCache<DynoRecord[]>(key)
  const [records, setRecords] = useState<DynoRecord[]>(cached ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)
  const { setVehicles } = useVehicleStore()

  const fetch = useCallback(async (showSpinner = false) => {
    if (!vehicleId) return
    if (showSpinner) setLoading(true)
    setError(null)
    try {
      const data = await api.dyno.list(vehicleId)
      setCache(key, data)
      setRecords(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      if (showSpinner) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId])

  useEffect(() => {
    fetch(!cached)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetch])

  const remove = async (id: string) => {
    try {
      await api.dyno.delete(vehicleId, id)
      invalidateCache(key)
      setRecords(prev => prev.filter(r => r.id !== id))

      // Sync vehicle list to update Active/Project status counts
      const updatedVehicles = await api.vehicles.list()
      setVehicles(updatedVehicles)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return { records, loading, error, refetch: () => fetch(false), hardRefetch: () => fetch(true), remove }
}
