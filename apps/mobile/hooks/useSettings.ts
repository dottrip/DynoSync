import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
    imperialUnits: boolean
    notificationsEnabled: boolean
    setImperialUnits: (val: boolean) => void
    setNotificationsEnabled: (val: boolean) => void
}

export const useSettings = create<SettingsState>()(
    persist(
        (set) => ({
            imperialUnits: false, // Default to metric
            notificationsEnabled: true,
            setImperialUnits: (val) => set({ imperialUnits: val }),
            setNotificationsEnabled: (val) => set({ notificationsEnabled: val }),
        }),
        {
            name: '@dynosync:settings:v1',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
)
