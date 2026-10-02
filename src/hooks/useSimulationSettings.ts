import { create } from "zustand"
import { SLOT_MAIN_STATS, WEIGHT_PRESETS } from "../constants/artifactData"
import { priorityFrom } from "../utils/scoring"
import { SimulationMode, type SimulationSettings } from "../types/artifact"

interface SimulationSettingsState {
  settings: SimulationSettings
  setMode: (mode: SimulationMode) => void
  setResinBudget: (resinBudget: number) => void
  setTopK: (topK: number) => void
  setUseStrongBox: (useStrongBox: boolean) => void
  setMinCritValue: (minCritValue: number) => void
  setTargetSlot: (slot: number | null) => void
  setTargetMainStat: (targetMainStat: number | null) => void
  setPriority: (priority: number[]) => void
  changeSlot: (value: string) => void
  resetSettings: () => void
}

const defaultSettings: SimulationSettings = {
  mode: SimulationMode.TargetPiece,
  resinBudget: 2000,
  topK: 10,
  useStrongBox: true,
  minCritValue: 25,
  targetSlot: null,
  targetMainStat: null,
  priority: priorityFrom(WEIGHT_PRESETS[0].weights),
}

export const useSimulationSettings = create<SimulationSettingsState>((set) => ({
  settings: defaultSettings,
  setMode: (mode) => set((state) => ({ settings: { ...state.settings, mode } })),
  setResinBudget: (resinBudget) => set((state) => ({ settings: { ...state.settings, resinBudget } })),
  setTopK: (topK) => set((state) => ({ settings: { ...state.settings, topK } })),
  setUseStrongBox: (useStrongBox) => set((state) => ({ settings: { ...state.settings, useStrongBox } })),
  setMinCritValue: (minCritValue) => set((state) => ({ settings: { ...state.settings, minCritValue } })),
  setTargetSlot: (targetSlot) => set((state) => ({ settings: { ...state.settings, targetSlot } })),
  setTargetMainStat: (targetMainStat) => set((state) => ({ settings: { ...state.settings, targetMainStat } })),
  setPriority: (priority) => set((state) => ({ settings: { ...state.settings, priority } })),
  
  changeSlot: (value: string) => set((state) => {
    const slot = value === "" ? null : Number(value)
    let mainStat = state.settings.targetMainStat
    
    if (slot !== null && mainStat !== null && !SLOT_MAIN_STATS[slot].includes(mainStat)) {
      mainStat = null
    }
    
    return { settings: { ...state.settings, targetSlot: slot, targetMainStat: mainStat } }
  }),
  
  resetSettings: () => set({
    settings: {
      ...defaultSettings,
      mode: SimulationMode.ResinBudget,
      topK: 3, // As per original resetSettings logic
    }
  }),
}))