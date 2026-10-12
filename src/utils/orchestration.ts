import { RESIN_PER_DAY } from "../constants/resin"
import type { ArtifactOutput, SimulationResult, SubstatWeight } from "../types/artifact"
import { scoreArtifact } from "./scoring"

/**
 * Split a total number of trials as evenly as possible across worker threads.
 * Any remainder is distributed to the first few workers.
 * Workers that would receive 0 trials are omitted.
 */
export function splitTrials(totalTrials: number, numWorkers: number): number[] {
  if (numWorkers <= 0 || totalTrials <= 0) return []
  const base = Math.floor(totalTrials / numWorkers)
  const remainder = totalTrials % numWorkers
  const result: number[] = []

  for (let i = 0; i < numWorkers; i++) {
    const count = base + (i < remainder ? 1 : 0)
    if (count > 0) {
      result.push(count)
    }
  }

  return result
}

/**
 * Compute percentile using linear interpolation between closest ranks.
 */
export function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]
  const clampedP = Math.max(0, Math.min(1, p))
  const index = clampedP * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * Aggregate simulation results across multiple worker threads into a unified
 * SimulationResult with Monte Carlo statistics (percentiles, success rate, top artifacts).
 */
export function aggregate(
  results: SimulationResult[],
  substatWeights: SubstatWeight[] = [],
  topK: number = 10
): SimulationResult {
  if (results.length === 0) {
    return {
      targetAchieved: false,
      totalResinSpent: 0,
      equivalentDays: 0,
      domainRunsCompleted: 0,
      strongboxRollsCompleted: 0,
      totalFiveStarsFound: 0,
      topArtifacts: [],
      trials: 0,
      successfulTrials: 0,
      successRate: 0,
      medianResinSpent: 0,
      p90ResinSpent: 0,
      minResinSpent: 0,
      maxResinSpent: 0,
      meanResinSpent: 0,
      trialResinSpents: [],
      trialTargetAchieved: [],
    }
  }

  const totalTrials = results.reduce((acc, r) => acc + (r.trials ?? 1), 0)
  const successfulTrials = results.reduce(
    (acc, r) => acc + (r.successfulTrials ?? (r.targetAchieved ? 1 : 0)),
    0
  )
  const successRate = totalTrials > 0 ? successfulTrials / totalTrials : 0
  const targetAchieved = successfulTrials > 0

  const allResinSpents = results.flatMap((r) => r.trialResinSpents ?? [r.totalResinSpent])
  const allSuccesses = results.flatMap((r) => r.trialTargetAchieved ?? [r.targetAchieved])

  const successfulResins =
    successfulTrials > 0
      ? allResinSpents.filter((_, idx) => allSuccesses[idx])
      : allResinSpents

  const sortedResins = successfulResins.slice().sort((a, b) => a - b)
  const minResinSpent = sortedResins[0] ?? 0
  const maxResinSpent = sortedResins[sortedResins.length - 1] ?? 0
  const medianResinSpent = computePercentile(sortedResins, 0.5)
  const p90ResinSpent = computePercentile(sortedResins, 0.9)
  const meanResinSpent =
    sortedResins.length > 0
      ? sortedResins.reduce((acc, v) => acc + v, 0) / sortedResins.length
      : 0

  const isMultiTrial = totalTrials > 1
  const totalResinSpent = isMultiTrial
    ? Math.round(medianResinSpent)
    : results.reduce((acc, r) => acc + r.totalResinSpent, 0)

  const topArtifacts: ArtifactOutput[] = results
    .flatMap((r) => r.topArtifacts)
    .sort((a, b) => scoreArtifact(b, substatWeights) - scoreArtifact(a, substatWeights))
    .slice(0, topK)

  return {
    targetAchieved,
    totalResinSpent,
    equivalentDays: totalResinSpent / RESIN_PER_DAY,
    domainRunsCompleted: results.reduce((acc, r) => acc + r.domainRunsCompleted, 0),
    strongboxRollsCompleted: results.reduce((acc, r) => acc + r.strongboxRollsCompleted, 0),
    totalFiveStarsFound: results.reduce((acc, r) => acc + r.totalFiveStarsFound, 0),
    topArtifacts,
    trials: totalTrials,
    successfulTrials,
    successRate,
    medianResinSpent,
    p90ResinSpent,
    minResinSpent,
    maxResinSpent,
    meanResinSpent,
    trialResinSpents: allResinSpents,
    trialTargetAchieved: allSuccesses,
  }
}
