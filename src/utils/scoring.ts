import { MAX_SUBSTAT_ROLL, Stat } from "../constants/artifactData"
import type { ArtifactOutput, SubstatWeight } from "../types/artifact"

// Ordered stat ids from a preset, highest weight first
export const priorityFrom = (partial: Record<number, number>): number[] =>
  Object.entries(partial)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => Number(id))

// Ranked list -> weights: the first pick counts most, the last pick least
export const weightsFromPriority = (order: number[]): SubstatWeight[] =>
  order.map((stat, i) => ({ stat, weight: (order.length - i) / order.length }))

export const scoreArtifact = (art: ArtifactOutput, substatWeights: SubstatWeight[]): number => {
  if (substatWeights.length === 0) return art.critValue
  let total = 0
  for (const sub of art.subStats) {
    const match = substatWeights.find((w) => w.stat === sub.type)
    if (match) total += sub.value * match.weight
  }
  return total
}

export const cvTier = (cv: number) =>
  cv > 50 ? "cv-max" : cv >= 40 ? "cv-top" : cv >= 30 ? "cv-high" : cv >= 20 ? "cv-mid" : "cv-low"

export const rvTier = (rv: number) =>
  rv >= 700 ? "cv-max" : rv >= 600 ? "cv-top" : rv >= 500 ? "cv-high" : rv >= 400 ? "cv-mid" : "cv-low"

// Roll Value: every counted substat adds value / biggest possible roll, as a percent.
// 100% = one max roll. With no priority set it counts crit stats, like the Crit Value fallback.
export const rollValue = (art: ArtifactOutput, priority: number[]): number => {
  const counted = priority.length > 0 ? priority : [Stat.CritDMG, Stat.CritRate]
  let total = 0
  for (const sub of art.subStats) {
    if (counted.includes(sub.type)) total += (sub.value / MAX_SUBSTAT_ROLL[sub.type]) * 100
  }
  return total
}

// These are the exact rounded values the C++ engine uses for the 4 tiers (low, mid, high, max).
const ROLL_VALUES_ROUNDED: Record<number, number[]> = {
  [Stat.CritDMG]: [5.4, 6.2, 7.0, 7.8],
  [Stat.CritRate]: [2.7, 3.1, 3.5, 3.9],
  [Stat.EnergyRecharge]: [4.5, 5.2, 5.8, 6.5],
  [Stat.ElementalMastery]: [16.3, 18.7, 21.0, 23.3],
  [Stat.AtkPercent]: [4.1, 4.7, 5.3, 5.8],
  [Stat.HpPercent]: [4.1, 4.7, 5.3, 5.8],
  [Stat.DefPercent]: [5.1, 5.8, 6.6, 7.3],
  [Stat.FlatAtk]: [13.6, 15.6, 17.5, 19.5],
  [Stat.FlatDef]: [16.2, 18.5, 20.8, 23.2],
  [Stat.FlatHp]: [209.1, 239.0, 268.9, 298.8],
}
const TIER_NAMES = ["low", "mid", "high", "max"]

/** Find exactly which tier (0-3) a single roll is. Used for single step diffs. */
export const getRollTier = (statType: number, delta: number): string => {
  const values = ROLL_VALUES_ROUNDED[statType]
  if (!values) return "min"
  let bestIdx = 0; let minDiff = Infinity
  for (let i = 0; i < 4; i++) {
    const diff = Math.abs(values[i] - delta)
    if (diff < minDiff) { minDiff = diff; bestIdx = i }
  }
  return TIER_NAMES[bestIdx]
}

/** 
 * Reverse engineer the sequence of rolls from a total sum.
 * Uses a greedy approach since we just need *a* valid path to color the dots.
 */
export const inferRollTiers = (statType: number, totalValue: number, rolls: number): string[] => {
  const values = ROLL_VALUES_ROUNDED[statType]
  if (!values || rolls <= 0) return Array(Math.max(1, rolls)).fill("min")

  const tiers: string[] = []
  let remaining = totalValue

  for (let r = 0; r < rolls; r++) {
    const rollsLeft = rolls - 1 - r
    let bestTierIdx = 0
    let minError = Infinity

    for (let i = 0; i < 4; i++) {
      const val = values[i]
      // Guess if we picked this, could the rest be made up by avg rolls?
      const targetRest = remaining - val
      const avgRequired = rollsLeft === 0 ? 0 : targetRest / rollsLeft
      
      let error = 0
      if (rollsLeft === 0) {
        error = Math.abs(targetRest)
      } else {
        if (avgRequired < values[0]) error = values[0] - avgRequired
        else if (avgRequired > values[3]) error = avgRequired - values[3]
      }

      if (error < minError) {
        minError = error
        bestTierIdx = i
      }
    }
    
    tiers.push(TIER_NAMES[bestTierIdx])
    remaining -= values[bestTierIdx]
  }

  // Sort them so lower rolls appear first in the dots (optional, but looks cleaner)
  return tiers.sort((a, b) => TIER_NAMES.indexOf(a) - TIER_NAMES.indexOf(b))
}