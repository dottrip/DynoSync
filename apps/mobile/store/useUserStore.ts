import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

type TierType = 'free' | 'pro'

interface UserState {
    tier: TierType
    setTier: (tier: TierType) => void
    reset: () => void
}

const TIER_STORAGE_KEY = '@dynosync_user_tier'

export const useUserStore = create<UserState>((set) => {
    // Initial load from storage is handled by hooks/useTierLimits for reactivity
    return {
        tier: 'free',
        setTier: (tier) => {
            set({ tier })
            AsyncStorage.setItem(TIER_STORAGE_KEY, tier)
        },
        reset: () => {
            set({ tier: 'free' })
            AsyncStorage.removeItem(TIER_STORAGE_KEY)
        }
    }
})
