import { useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { useVehicleStore } from '../store/useVehicleStore'

export function useVehicles() {
  const {
    vehicles,
    loading,
    error,
    setVehicles,
    setLoading,
    setError,
    removeVehicle
  } = useVehicleStore()

  const fetch = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    setError(null)
    try {
      const data = await api.vehicles.list()
      setVehicles(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      // Always resolve loading regardless of showSpinner
      // This prevents infinite loading when offline with no cached data
      setLoading(false)
    }
  }, [setVehicles, setLoading, setError])

  useEffect(() => {
    // Revalidation: if we have data, fetch silently; otherwise show spinner
    fetch(vehicles.length === 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const archive = async (id: string) => {
    try {
      await api.vehicles.archive(id)
      removeVehicle(id)
    } catch (e: any) {
      setError(e.message)
    }
  }

  const refetch = useCallback(() => fetch(false), [fetch])
  const hardRefetch = useCallback(() => fetch(true), [fetch])

  return { vehicles, loading, error, refetch, hardRefetch, archive }
}
