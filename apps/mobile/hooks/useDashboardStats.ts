import { useState, useEffect } from 'react'
import { useVehicles } from './useVehicles'
import { api, Vehicle } from '../lib/api'
import { useStatsStore } from '../store/useStatsStore'

interface DashboardStats {
  vehicleCount: number
  totalWhp: number
  dynoCount: number
  modCount: number
  loading: boolean
}

export function useDashboardStats(): DashboardStats {
  const { vehicles, loading: vehiclesLoading } = useVehicles()
  const { totalWhp, dynoCount, modCount, setStats } = useStatsStore()
  const [loading, setLoading] = useState(false)

  // Only show "loading" indicator on initial fly-in if we have NO data at all
  const isInitialEmpty = totalWhp === 0 && dynoCount === 0 && modCount === 0

  useEffect(() => {
    const fetchStats = async () => {
      if (vehiclesLoading && vehicles.length === 0) return

      const activeVehicles = vehicles.filter((v: Vehicle) => !v.is_archived)

      if (activeVehicles.length === 0) {
        setStats({ totalWhp: 0, dynoCount: 0, modCount: 0 })
        setLoading(false)
        return
      }

      if (isInitialEmpty) setLoading(true)

      try {
        const data = await api.vehicles.getStats()
        setStats(data)
      } catch (error) {
        // Silently fail on network errors; only log unexpected failures on first load
        if (isInitialEmpty && !(error instanceof TypeError)) console.warn('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [vehicles, vehiclesLoading, isInitialEmpty])

  return {
    vehicleCount: vehicles.filter((v: Vehicle) => !v.is_archived).length,
    totalWhp,
    dynoCount,
    modCount,
    loading: loading || (isInitialEmpty && vehiclesLoading),
  }
}
