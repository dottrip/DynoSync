import { useState, useEffect } from 'react'
import { useVehicles } from './useVehicles'
import { api } from '../lib/api'

interface DashboardStats {
  vehicleCount: number
  totalWhp: number
  dynoCount: number
  modCount: number
  loading: boolean
}

export function useDashboardStats(): DashboardStats {
  const { vehicles, loading: vehiclesLoading } = useVehicles()
  const [stats, setStats] = useState({ totalWhp: 0, dynoCount: 0, modCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (vehiclesLoading) return

      const activeVehicles = vehicles.filter(v => !v.is_archived)

      if (activeVehicles.length === 0) {
        setStats({ totalWhp: 0, dynoCount: 0, modCount: 0 })
        setLoading(false)
        return
      }

      try {
        const results = await Promise.all(
          activeVehicles.map(async v => {
            const [dynos, mods] = await Promise.all([
              api.dyno.list(v.id),
              api.mods.list(v.id),
            ])
            const maxWhp = dynos.length > 0 ? Math.max(...dynos.map(d => d.whp)) : 0
            return { maxWhp, dynoCount: dynos.length, modCount: mods.length }
          })
        )

        const totalWhp = results.reduce((sum, r) => sum + r.maxWhp, 0)
        const dynoCount = results.reduce((sum, r) => sum + r.dynoCount, 0)
        const modCount = results.reduce((sum, r) => sum + r.modCount, 0)

        setStats({ totalWhp, dynoCount, modCount })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [vehicles, vehiclesLoading])

  return {
    vehicleCount: vehicles.filter(v => !v.is_archived).length,
    totalWhp: stats.totalWhp,
    dynoCount: stats.dynoCount,
    modCount: stats.modCount,
    loading: loading || vehiclesLoading,
  }
}
