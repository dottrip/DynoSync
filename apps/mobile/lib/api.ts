import { supabase } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787'

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers, ...options?.headers } })
  const text = await res.text()
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Server error: ${text.slice(0, 100)}`)
  }
  if (!res.ok) throw new Error(json.error ?? 'Request failed')
  return json as T
}

export const api = {
  auth: {
    sync: (email: string, username: string) => request<{ success: boolean }>('/auth/sync', { method: 'POST', body: JSON.stringify({ email, username }) }),
  },
  vehicles: {
    list: () => request<Vehicle[]>('/vehicles'),
    get: (id: string) => request<Vehicle>(`/vehicles/${id}`),
    create: (body: CreateVehicleInput) => request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CreateVehicleInput>) => request<Vehicle>(`/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    archive: (id: string) => request<{ success: boolean }>(`/vehicles/${id}`, { method: 'DELETE' }),
  },
  dyno: {
    list: (vehicleId: string) => request<DynoRecord[]>(`/dyno/${vehicleId}`),
    get: (vehicleId: string, id: string) => request<DynoRecord>(`/dyno/${vehicleId}/${id}`),
    create: (vehicleId: string, body: CreateDynoInput) => request<DynoRecord>(`/dyno/${vehicleId}`, { method: 'POST', body: JSON.stringify(body) }),
    delete: (vehicleId: string, id: string) => request<{ success: boolean }>(`/dyno/${vehicleId}/${id}`, { method: 'DELETE' }),
  },
  mods: {
    list: (vehicleId: string) => request<ModLog[]>(`/mods/${vehicleId}`),
    get: (vehicleId: string, id: string) => request<ModLog>(`/mods/${vehicleId}/${id}`),
    create: (vehicleId: string, body: CreateModLogInput) => request<ModLog>(`/mods/${vehicleId}`, { method: 'POST', body: JSON.stringify(body) }),
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
  },
  feedback: {
    submit: (type: string, message: string) => request<{ success: boolean }>('/feedback', { method: 'POST', body: JSON.stringify({ type, message }) }),
  },
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
  drivetrain?: 'FWD' | 'RWD' | 'AWD'
  image_url?: string
  is_archived: boolean
  is_public: boolean
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

export interface PublicVehicleProfile extends Vehicle {
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
  created_at: string
}
