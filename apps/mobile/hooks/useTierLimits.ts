import { useEffect, useCallback, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from './useAuth'
import { useVehicles } from './useVehicles'
import { TIER_LIMITS } from '@dynosync/types'
import { api } from '../lib/api'
import { useUserStore } from '../store/useUserStore'

type TierType = 'free' | 'pro'
const TIER_STORAGE_KEY = '@dynosync_user_tier'

function normalizeTier(raw: string | undefined | null): TierType {
  if (raw === 'pro') return 'pro'
  return 'free'
}

export function useTierLimits() {
  const { session } = useAuth()
  const { vehicles, refetch: refetchVehicles } = useVehicles()
  const { tier, setTier } = useUserStore()

  const lastFetchRef = useRef<number>(0)
  const FETCH_COOLDOWN = 10000 // 10 seconds

  // Initial load from storage
  useEffect(() => {
    AsyncStorage.getItem(TIER_STORAGE_KEY).then(val => {
      if (val === 'pro' || val === 'free') setTier(val as TierType)
    })
  }, [])

  const refetchTier = useCallback(async (force = false) => {
    if (!force && Date.now() - lastFetchRef.current < FETCH_COOLDOWN) return

    try {
      const profile = await api.profile.getMe()
      const t = normalizeTier(profile.tier)
      setTier(t)
      lastFetchRef.current = Date.now()
    } catch (e: any) {
      if (e.response?.status === 404) {
        // User not found yet (new registration) -> default to free tier silently
        setTier('free')
        lastFetchRef.current = Date.now()
      } else if (e instanceof TypeError || e.message?.includes('Network request failed')) {
        // Offline — silently keep current tier, don't spam logs
      } else {
        console.warn('Failed to refetch tier:', e)
      }
    }
  }, [setTier])

  useEffect(() => {
    if (session) refetchTier()
  }, [session?.user?.id])

  const limits = TIER_LIMITS[tier]
  const activeVehicles = vehicles.filter(v => !v.is_archived)
  const canAddVehicle = limits.vehicles === Infinity || activeVehicles.length < limits.vehicles

  return {
    tier,
    limits,
    canAddVehicle,
    vehicleCount: activeVehicles.length,
    refetchVehicles,
    refetchTier
  }
}
