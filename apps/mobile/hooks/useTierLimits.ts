import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useVehicles } from './useVehicles'
import { TIER_LIMITS } from '@dynosync/types'
import { api } from '../lib/api'
import { getCache, setCache } from '../lib/cache'

type TierType = 'free' | 'pro'

const TIER_CACHE_KEY = 'user_tier'

function normalizeTier(raw: string | undefined | null): TierType {
  if (raw === 'pro') return 'pro'
  return 'free'
}

export function useTierLimits() {
  const { session } = useAuth()
  const { vehicles } = useVehicles()

  // Use cached tier as initial value to prevent flash of "FREE"
  const cachedTier = getCache<TierType>(TIER_CACHE_KEY)
  const [tier, setTier] = useState<TierType>(cachedTier || 'free')

  useEffect(() => {
    if (!session) return
    api.profile.getMe().then(profile => {
      const normalizedTier = normalizeTier(profile.tier)
      setTier(normalizedTier)
      setCache(TIER_CACHE_KEY, normalizedTier)
    }).catch(() => {
      const metaTier = session.user?.user_metadata?.tier
      const normalizedTier = normalizeTier(metaTier)
      setTier(normalizedTier)
      setCache(TIER_CACHE_KEY, normalizedTier)
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
