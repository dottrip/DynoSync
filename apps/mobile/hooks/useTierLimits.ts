import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from './useAuth'
import { useVehicles } from './useVehicles'
import { TIER_LIMITS } from '@dynosync/types'
import { api } from '../lib/api'

type TierType = 'free' | 'pro'

const TIER_STORAGE_KEY = '@dynosync_user_tier'

function normalizeTier(raw: string | undefined | null): TierType {
  if (raw === 'pro') return 'pro'
  return 'free'
}

// Synchronous initial value — set by previous session's AsyncStorage read
let cachedTier: TierType | null = null

// Pre-load from AsyncStorage at module init (runs once on app start)
AsyncStorage.getItem(TIER_STORAGE_KEY).then(val => {
  if (val === 'pro' || val === 'free') cachedTier = val
})

export function useTierLimits() {
  const { session } = useAuth()
  const { vehicles } = useVehicles()
  const [tier, setTier] = useState<TierType>(cachedTier || 'free')

  useEffect(() => {
    // On first mount, check if AsyncStorage loaded after module init
    if (cachedTier && cachedTier !== tier) {
      setTier(cachedTier)
    }
  }, [])

  useEffect(() => {
    if (!session) return
    api.profile.getMe().then(profile => {
      const t = normalizeTier(profile.tier)
      setTier(t)
      cachedTier = t
      AsyncStorage.setItem(TIER_STORAGE_KEY, t)
    }).catch(() => {
      const t = normalizeTier(session.user?.user_metadata?.tier)
      setTier(t)
      cachedTier = t
      AsyncStorage.setItem(TIER_STORAGE_KEY, t)
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
