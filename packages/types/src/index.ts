// Shared TypeScript types for DynoSync

export type TierType = 'free' | 'pro'

export interface User {
  id: string
  email: string
  username: string
  tier: TierType
  aiCreditsUsed: number
  aiCreditsResetAt: string
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
  quarterMile?: number // seconds
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
export const TIER_LIMITS: Record<TierType, { vehicles: number; dynoRecords: number; modLogs: number; aiCreditsPerMonth: number }> = {
  free: { vehicles: 1, dynoRecords: 5, modLogs: 10, aiCreditsPerMonth: 3 },
  pro: { vehicles: 5, dynoRecords: Infinity, modLogs: Infinity, aiCreditsPerMonth: 100 },
}

// AI feature credit costs
export const AI_CREDIT_COSTS = {
  advisor_quick: 1,   // Flash model, basic analysis
  advisor_deep: 3,    // Pro model, deep reasoning
  ocr_scan: 1,        // Flash model, dyno sheet extraction
} as const

export type AIFeatureType = keyof typeof AI_CREDIT_COSTS
