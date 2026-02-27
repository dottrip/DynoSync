import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useVehicles } from './useVehicles'
import { TIER_LIMITS } from '@dynosync/types'

export function useTierLimits() {
  const { user } = useAuth()
  const { vehicles } = useVehicles()

  const tier = (user?.user_metadata?.tier ?? 'free') as keyof typeof TIER_LIMITS
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
