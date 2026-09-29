import { useState } from "react"
import { SLOT_MAIN_STATS, WEIGHT_PRESETS } from "../constants/artifactData"
import { priorityFrom } from "../utils/scoring"
import type { SimulationSettings } from "../types/artifact"

export function useSimulationSettings() {
  const [mode, setMode] = useState(0)
  const [resinBudget, setResinBudget] = useState(2000)
  const [topK, setTopK] = useState(3)
  const [useStrongBox, setUseStrongBox] = useState(true)
  const [minCritValue, setMinCritValue] = useState(25)
  const [targetSlot, setTargetSlot] = useState<number | "">("")
  const [targetMainStat, setTargetMainStat] = useState<number | "">("")
  const [priority, setPriority] = useState<number[]>(priorityFrom(WEIGHT_PRESETS[0].weights))

  // Changing the slot clears a main stat that slot can't roll
  const changeSlot = (value: string) => {
    const slot = value === "" ? "" : Number(value)
    setTargetSlot(slot)
    if (slot !== "" && targetMainStat !== "" && !SLOT_MAIN_STATS[slot].includes(targetMainStat)) {
      setTargetMainStat("")
    }
  }

  const resetSettings = () => {
    setMode(0); setResinBudget(2000); setTopK(3); setUseStrongBox(true); setMinCritValue(25)
    setTargetSlot(""); setTargetMainStat(""); setPriority(priorityFrom(WEIGHT_PRESETS[0].weights))
  }

  const settings: SimulationSettings = {
    mode,
    resinBudget,
    topK,
    useStrongBox,
    minCritValue,
    targetSlot,
    targetMainStat,
    priority,
  }

  return {
    settings,
    setMode,
    setResinBudget,
    setTopK,
    setUseStrongBox,
    setMinCritValue,
    setTargetMainStat,
    setPriority,
    changeSlot,
    resetSettings,
  }
}