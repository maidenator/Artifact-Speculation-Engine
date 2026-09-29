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