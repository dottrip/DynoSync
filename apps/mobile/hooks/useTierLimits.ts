import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useVehicles } from './useVehicles'
import { TIER_LIMITS } from '@dynosync/types'
import { api } from '../lib/api'

type TierType = 'free' | 'pro'

function normalizeTier(raw: string | undefined | null): TierType {
  if (raw === 'pro') return 'pro'
  return 'free'
}

export function useTierLimits() {
  const { session } = useAuth()
  const { vehicles, refetch } = useVehicles()
  const [tier, setTier] = useState<TierType>('free')

  useEffect(() => {
    if (!session) return
    api.profile.getMe().then(profile => {
      setTier(normalizeTier(profile.tier))
    }).catch(() => {
      const metaTier = session.user?.user_metadata?.tier
      setTier(normalizeTier(metaTier))
    })
  }, [session?.user?.id])

  const limits = TIER_LIMITS[tier]
  const activeVehicles = vehicles.filter(v => !v.is_archived)
  const canAddVehicle = limits.vehicles === Infinity || activeVehicles.length < limits.vehicles

  return {
    tier,
    limits,
    canAddVehicle,
    vehicleCount: activeVehicles.length,
    refetchVehicles: refetch,
  }
}
