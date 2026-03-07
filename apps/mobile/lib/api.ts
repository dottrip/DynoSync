import { supabase } from './supabase'

const API_URL = 'https://dynosync-api.dynosync-dev.workers.dev' // Hardcoded for diagnostic purpose

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }
}

const cache = new Map<string, { data: any; timestamp: number }>()
const errorCache = new Map<string, { error: any; timestamp: number }>()
const inFlight = new Map<string, Promise<any>>()
const CACHE_TTL = 30000 // 30 seconds for success
const ERROR_TTL = 2000 // 2 seconds for errors

/** Clear all API-layer caches. Call on logout to prevent stale data across accounts. */
export function clearApiCache() {
  cache.clear()
  errorCache.clear()
  inFlight.clear()
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isGet = !options || options.method === 'GET' || options.method === undefined
  const cacheKey = path

  if (isGet) {
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data as T

    const err = errorCache.get(cacheKey)
    if (err && Date.now() - err.timestamp < ERROR_TTL) throw err.error

    if (inFlight.has(cacheKey)) return inFlight.get(cacheKey) as Promise<T>
  }

  const promise = (async () => {
    try {
      const headers = await getHeaders()
      const finalUrl = `${API_URL}${path}`

      // Only log non-cached/non-failing requests to reduce bridge noise
      if (process.env.NODE_ENV === 'development') {
        console.log(`📡 [API] -> ${path}`)
      }

      const res = await fetch(finalUrl, { ...options, headers: { ...headers, ...options?.headers } })
      const text = await res.text()
      let json: any
      try {
        json = JSON.parse(text)
      } catch {
        throw new Error(`Server error: ${text.slice(0, 100)}`)
      }

      if (!res.ok) {
        const error = new Error(json.error ?? 'Request failed') as any
        error.response = { data: json, status: res.status }
        if (isGet) errorCache.set(cacheKey, { error, timestamp: Date.now() })
        throw error
      }

      if (isGet) {
        cache.set(cacheKey, { data: json, timestamp: Date.now() })
        errorCache.delete(cacheKey) // Clear any previous error
      }
      return json as T
    } catch (e) {
      if (isGet) errorCache.set(cacheKey, { error: e, timestamp: Date.now() })
      throw e
    }
  })()

  if (isGet) {
    inFlight.set(cacheKey, promise)
    try {
      return await promise
    } finally {
      inFlight.delete(cacheKey)
    }
  }

  return promise
}

export const api = {
  auth: {
    sync: (email: string, username: string) => request<{ success: boolean }>('/auth/sync', { method: 'POST', body: JSON.stringify({ email, username }) }),
    deleteAccount: () => request<{ success: boolean }>('/auth/delete-account', { method: 'DELETE' }),
  },
  vehicles: {
    list: () => request<Vehicle[]>('/vehicles'),
    getStats: () => request<{ totalWhp: number; dynoCount: number; modCount: number }>('/vehicles/stats'),
    get: (id: string) => request<Vehicle>(`/vehicles/${id}`),
    create: (body: CreateVehicleInput) => request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateVehicleInput>) => request<Vehicle>(`/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    archive: (id: string) => request<{ success: boolean }>(`/vehicles/${id}`, { method: 'DELETE' }),
  },
  dyno: {
    list: (vehicleId: string) => request<DynoRecord[]>(`/dyno/${vehicleId}`),
    get: (vehicleId: string, id: string) => request<DynoRecord>(`/dyno/${vehicleId}/${id}`),
    create: (vehicleId: string, body: CreateDynoInput) => request<DynoRecord>(`/dyno/${vehicleId}`, { method: 'POST', body: JSON.stringify(body) }),
    update: (vehicleId: string, id: string, body: Partial<CreateDynoInput>) => request<DynoRecord>(`/dyno/${vehicleId}/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (vehicleId: string, id: string) => request<{ success: boolean }>(`/dyno/${vehicleId}/${id}`, { method: 'DELETE' }),
  },
  mods: {
    list: (vehicleId: string) => request<ModLog[]>(`/mods/${vehicleId}`),
    get: (vehicleId: string, id: string) => request<ModLog>(`/mods/${vehicleId}/${id}`),
    create: (vehicleId: string, body: CreateModLogInput) => request<ModLog>(`/mods/${vehicleId}`, { method: 'POST', body: JSON.stringify(body) }),
    update: (vehicleId: string, id: string, body: Partial<CreateModLogInput>) => request<ModLog>(`/mods/${vehicleId}/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (vehicleId: string, id: string) => request<{ success: boolean }>(`/mods/${vehicleId}/${id}`, { method: 'DELETE' }),
  },
  leaderboard: {
    getTopRuns: (criteria?: string, region?: string) => {
      const qs = new URLSearchParams()
      if (criteria) qs.append('criteria', criteria)
      if (region) qs.append('region', region)
      const q = qs.toString()
      return request<LeaderboardEntry[]>(`/leaderboard${q ? '?' + q : ''}`)
    },
  },
  public: {
    getVehicle: (id: string) => request<PublicVehicleProfile>(`/public/vehicles/${id}`, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    }),
  },
  follows: {
    check: (vehicleId: string) => request<{ isFollowing: boolean }>(`/follows/check/${vehicleId}`),
    follow: (vehicleId: string) => request<{ success: boolean; message?: string }>(`/follows/${vehicleId}`, { method: 'POST' }),
    unfollow: (vehicleId: string) => request<{ success: boolean }>(`/follows/${vehicleId}`, { method: 'DELETE' })
  },
  profile: {
    getMe: () => request<UserProfile>('/profile/me'),
    updateAvatar: (avatar_url: string) => request<UserProfile>('/profile/me', { method: 'PATCH', body: JSON.stringify({ avatar_url }) }),
    updatePushToken: (push_token: string) => request<UserProfile>('/profile/me', { method: 'PATCH', body: JSON.stringify({ push_token }) }),
    updateSocialLinks: (instagram_handle?: string, discord_id?: string) => request<UserProfile>('/profile/me', { method: 'PATCH', body: JSON.stringify({ instagram_handle, discord_id }) }),
    upgradeTier: (tier: string) => request<{ success: boolean; user: UserProfile }>('/profile/subscription/upgrade', { method: 'POST', body: JSON.stringify({ tier }) }),
  },
  feedback: {
    submit: (type: string, message: string) => request<{ success: boolean }>('/feedback', { method: 'POST', body: JSON.stringify({ type, message }) }),
  },
  ai: {
    analyzeDyno: (image: string, torqueUnit?: string) => request<AiScanResult>('/ai/analyze-dyno', { method: 'POST', body: JSON.stringify({ image, torqueUnit }) }),
    scanVin: (image: string) => request<{ vin: string; credits_used: number; credits_limit: number }>('/ai/scan-vin', { method: 'POST', body: JSON.stringify({ image }) }),
    getAdvisor: (body: { whp: number; torque: number; torqueUnit: string; vehicle: any; forceRefresh?: boolean; calibration?: any }) => request<AiAdvisorResult>('/ai/advisor', { method: 'POST', body: JSON.stringify(body) }),
    getAdvisorHistory: (vehicleId: string) => request<any[]>(`/ai/advisor/history/${vehicleId}`),
    fetchBaselineSpecs: (params: { make: string, model: string, year: number, trim?: string }) =>
      request<AiBaselineSpecsResult>('/ai/baseline-specs', { method: 'POST', body: JSON.stringify(params) }),
    getCredits: () => request<AiCreditStatus>('/ai/credits'),
    getStats: () => request<AiUsageStats>('/ai/stats'),
  }
}

export interface LeaderboardEntry {
  id: string
  whp: number
  torque_nm?: number
  zero_to_sixty?: number
  quarter_mile?: number
  recorded_at: string
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    trim?: string
  }
  user: {
    username: string
    tier: string
    region?: string
  }
}

export interface Vehicle {
  id: string
  user_id: string
  make: string
  model: string
  year: number
  trim?: string
  status?: string
  mods?: string[]
  drivetrain?: 'FWD' | 'RWD' | 'AWD'
  image_url?: string
  image_thumb_url?: string
  is_archived: boolean
  is_public: boolean
  dyno_records?: { count: number }[]
  mod_logs?: { count: number }[]
  last_advisor_result?: AiAdvisorResult
  advisor_cache_key?: string
  created_at: string
  updated_at: string
}

export interface CreateVehicleInput {
  make: string
  model: string
  year: number
  trim?: string
  drivetrain?: 'FWD' | 'RWD' | 'AWD'
  image_url?: string
  image_thumb_url?: string
  is_public?: boolean
}

export interface DynoRecord {
  id: string
  vehicle_id: string
  whp: number
  torque_nm?: number
  zero_to_sixty?: number
  quarter_mile?: number
  notes?: string
  recorded_at: string
  created_at: string
}

export interface CreateDynoInput {
  whp: number
  torque_nm?: number
  zero_to_sixty?: number
  quarter_mile?: number
  notes?: string
  recorded_at?: string
}

export interface ModLog {
  id: string
  vehicle_id: string
  category: string
  description: string
  cost?: number
  installed_at: string
  created_at: string
}

export interface CreateModLogInput {
  category: string
  description: string
  cost?: number
  installed_at?: string
}

export interface PublicVehicleProfile extends Omit<Vehicle, 'dyno_records' | 'mod_logs'> {
  dyno_records: DynoRecord[]
  mod_logs: ModLog[]
  users: {
    username: string | null;
    instagram_handle?: string | null;
    discord_id?: string | null;
  } | null
}

export interface UserProfile {
  id: string
  email: string
  username?: string
  tier: string
  avatar_url?: string
  instagram_handle?: string
  discord_id?: string
  ai_credits_used?: number
  ai_credits_reset_at?: string
  created_at: string
}

export interface AiScanResult {
  whp: number
  torque: number
  rpm_peak_whp?: number
  rpm_peak_torque?: number
  notes?: string
  recorded_at: string
  confidence: number
}

export interface AiAdvisorResult {
  diagnosis: string
  recommendations: string[]
  provider: 'gemini' | 'cached'
  cached_at?: string
  model_used?: string
  tuning_suggestions?: {
    timing_advance: number
    boost_target: number
    afr_target: number
  }
  // Keep legacy fields to prevent TS errors in ai-lab
  advice?: string
  severity?: string
  suggestion?: {
    title: string
    gain: string
    difficulty: string
    category: string
  }
  note?: string
}

export interface AiBaselineSpecsResult {
  whp: number
  torque_nm: number
  weight_lbs: number
}

export interface AiCreditStatus {
  tier: string
  credits_used: number
  credits_limit: number
  credits_remaining: number
  next_reset: string
  costs: Record<string, number>
}

export interface AiUsageStats {
  total: number
  count: number
  reset_at: string
  breakdown: Record<string, number>
}
