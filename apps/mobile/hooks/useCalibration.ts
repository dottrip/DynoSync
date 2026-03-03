import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DiagnosticBias = 'reliability' | 'balanced' | 'performance';
export type ReasoningDepth = 'quick' | 'deep';
export type NoiseFilter = 'low' | 'med' | 'high';

interface CalibrationState {
    bias: DiagnosticBias;
    depth: ReasoningDepth;
    filter: NoiseFilter;
    setBias: (bias: DiagnosticBias) => void;
    setDepth: (depth: ReasoningDepth) => void;
    setFilter: (filter: NoiseFilter) => void;
}

export const useCalibration = create<CalibrationState>()(
    persist(
        (set) => ({
            bias: 'balanced',
            depth: 'quick',
            filter: 'med',
            setBias: (bias) => set({ bias }),
            setDepth: (depth) => set({ depth }),
            setFilter: (filter) => set({ filter }),
        }),
        {
            name: 'neural-calibration-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
