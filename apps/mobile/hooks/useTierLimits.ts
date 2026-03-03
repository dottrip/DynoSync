import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useVehicles } from './useVehicles'
import { TIER_LIMITS } from '@dynosync/types'
import { api } from '../lib/api'

type TierType = 'free' | 'pro'

function normalizeTier(raw: string | undefined | null): TierType {
  if (raw === 'pro') return 'pro'
  return 'free' // elite and unknown fall back to free limits
}

export function useTierLimits() {
  const { session } = useAuth()
  const { vehicles } = useVehicles()
  const [tier, setTier] = useState<TierType>('free')

  useEffect(() => {
    if (!session) return
    api.profile.getMe().then(profile => {
      setTier(normalizeTier(profile.tier))
    }).catch(() => {
      // fallback: read from auth metadata if API fails
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
  }
}
