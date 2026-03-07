import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ActiveVehicleState {
    activeVehicleId: string | null
    setActiveVehicleId: (id: string | null) => void
    reset: () => void
}

export const useActiveVehicle = create<ActiveVehicleState>()(
    persist(
        (set) => ({
            activeVehicleId: null,
            setActiveVehicleId: (id) => set({ activeVehicleId: id }),
            reset: () => set({ activeVehicleId: null }),
        }),
        {
            name: '@dynosync:active-vehicle:v1',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
)
