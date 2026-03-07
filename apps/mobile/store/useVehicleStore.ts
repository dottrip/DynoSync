import { create } from 'zustand'
import { Vehicle } from '../lib/api'
import { getCache, setCache } from '../lib/cache'

interface VehicleState {
    vehicles: Vehicle[]
    loading: boolean
    error: string | null
    setVehicles: (vehicles: Vehicle[]) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    updateVehicle: (id: string, updates: Partial<Vehicle>) => void
    removeVehicle: (id: string) => void
    reset: () => void
}

const CACHE_KEY = 'vehicles'

export const useVehicleStore = create<VehicleState>((set) => ({
    vehicles: getCache<Vehicle[]>(CACHE_KEY) ?? [],
    loading: !getCache<Vehicle[]>(CACHE_KEY),
    error: null,

    setVehicles: (vehicles) => {
        set({ vehicles })
        setCache(CACHE_KEY, vehicles)
    },

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    updateVehicle: (id, updates) => set((state) => {
        const next = state.vehicles.map(v => v.id === id ? { ...v, ...updates } : v)
        setCache(CACHE_KEY, next)
        return { vehicles: next }
    }),

    removeVehicle: (id) => set((state) => {
        const next = state.vehicles.filter(v => v.id !== id)
        setCache(CACHE_KEY, next)
        return { vehicles: next }
    }),

    reset: () => {
        set({ vehicles: [], loading: true, error: null })
        setCache(CACHE_KEY, null)
    },
}))
