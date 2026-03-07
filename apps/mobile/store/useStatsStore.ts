import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface StatsState {
    totalWhp: number
    dynoCount: number
    modCount: number
    setStats: (stats: { totalWhp: number; dynoCount: number; modCount: number }) => void
    reset: () => void
}

export const useStatsStore = create<StatsState>()(
    persist(
        (set) => ({
            totalWhp: 0,
            dynoCount: 0,
            modCount: 0,
            setStats: (stats) => set(stats),
            reset: () => set({ totalWhp: 0, dynoCount: 0, modCount: 0 }),
        }),
        {
            name: '@dynosync:stats-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
)
