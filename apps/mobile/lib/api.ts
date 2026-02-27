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
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Request failed')
  return json as T
}

export const api = {
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
}

export interface Vehicle {
  id: string
  user_id: string
  make: string
  model: string
  year: number
  trim?: string
  drivetrain?: 'FWD' | 'RWD' | 'AWD'
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
}

export interface DynoRecord {
  id: string
  vehicle_id: string
  whp: number
  torque_nm?: number
  zero_to_sixty?: number
  notes?: string
  recorded_at: string
  created_at: string
}

export interface CreateDynoInput {
  whp: number
  torque_nm?: number
  zero_to_sixty?: number
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
