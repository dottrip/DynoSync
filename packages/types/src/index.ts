// Shared TypeScript types for DynoSync

export type TierType = 'free' | 'pro' | 'elite'

export interface User {
  id: string
  email: string
  username: string
  tier: TierType
  createdAt: string
}

export interface Vehicle {
  id: string
  userId: string
  make: string
  model: string
  year: number
  trim?: string
  drivetrain?: 'FWD' | 'RWD' | 'AWD'
  isArchived: boolean
  createdAt: string
}

export interface DynoRecord {
  id: string
  vehicleId: string
  whp: number
  torqueNm?: number
  zeroToSixty?: number // seconds
  notes?: string
  recordedAt: string
  createdAt: string
}

export interface ModLog {
  id: string
  vehicleId: string
  rawInput: string        // plain-language input from user
  parsedData?: ModLogParsed
  createdAt: string
}

export interface ModLogParsed {
  category?: 'powertrain' | 'suspension' | 'aero' | 'fuel' | 'ecu' | 'other'
  partName?: string
  brand?: string
  estimatedHpGain?: number
  cost?: number
  notes?: string
}

// Tier limits
export const TIER_LIMITS: Record<TierType, { vehicles: number; dynoRecords: number; modLogs: number; aiSuggestionsPerMonth: number }> = {
  free:  { vehicles: 1,         dynoRecords: 5,         modLogs: 10,        aiSuggestionsPerMonth: 3 },
  pro:   { vehicles: 5,         dynoRecords: Infinity,  modLogs: Infinity,  aiSuggestionsPerMonth: Infinity },
  elite: { vehicles: Infinity,  dynoRecords: Infinity,  modLogs: Infinity,  aiSuggestionsPerMonth: Infinity },
}
