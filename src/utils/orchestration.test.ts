import { describe, it, expect } from "vitest"
import { splitTrials, computePercentile, aggregate } from "./orchestration"
import type { SimulationResult } from "../types/artifact"

describe("splitTrials", () => {
  it("divides trials evenly when total is a multiple of worker count", () => {
    expect(splitTrials(100, 4)).toEqual([25, 25, 25, 25])
    expect(splitTrials(12, 3)).toEqual([4, 4, 4])
  })

  it("distributes remainder to the earliest workers", () => {
    expect(splitTrials(10, 4)).toEqual([3, 3, 2, 2])
    expect(splitTrials(7, 3)).toEqual([3, 2, 2])
  })

  it("omits workers when trial count is less than worker count", () => {
    expect(splitTrials(2, 4)).toEqual([1, 1])
    expect(splitTrials(1, 8)).toEqual([1])
  })

  it("handles empty or invalid inputs", () => {
    expect(splitTrials(0, 4)).toEqual([])
    expect(splitTrials(-5, 4)).toEqual([])
    expect(splitTrials(10, 0)).toEqual([])
    expect(splitTrials(10, -2)).toEqual([])
  })
})

describe("computePercentile", () => {
  it("returns 0 for empty array", () => {
    expect(computePercentile([], 0.5)).toBe(0)
  })

  it("returns single element for length 1", () => {
    expect(computePercentile([500], 0.5)).toBe(500)
    expect(computePercentile([500], 0.9)).toBe(500)
  })

  it("computes exact percentiles for odd and even arrays", () => {
    const data = [100, 200, 300, 400, 500]
    expect(computePercentile(data, 0)).toBe(100)
    expect(computePercentile(data, 0.5)).toBe(300)
    expect(computePercentile(data, 1.0)).toBe(500)
  })

  it("interpolates intermediate values correctly", () => {
    const data = [100, 200]
    expect(computePercentile(data, 0.5)).toBe(150)
  })
})

describe("aggregate", () => {
  const mockResult = (overrides: Partial<SimulationResult> = {}): SimulationResult => ({
    targetAchieved: true,
    totalResinSpent: 1000,
    equivalentDays: 5.55,
    domainRunsCompleted: 50,
    strongboxRollsCompleted: 15,
    totalFiveStarsFound: 55,
    topArtifacts: [],
    trials: 10,
    successfulTrials: 8,
    successRate: 0.8,
    medianResinSpent: 800,
    p90ResinSpent: 1400,
    minResinSpent: 200,
    maxResinSpent: 2000,
    meanResinSpent: 900,
    trialResinSpents: [200, 400, 600, 800, 1000, 1200, 1400, 1600, 2000, 2000],
    trialTargetAchieved: [true, true, true, true, true, true, true, true, false, false],
    ...overrides,
  })

  it("aggregates trials and calculates combined success rate", () => {
    const worker1 = mockResult({ trials: 10, successfulTrials: 8 })
    const worker2 = mockResult({ trials: 10, successfulTrials: 6 })

    const combined = aggregate([worker1, worker2])

    expect(combined.trials).toBe(20)
    expect(combined.successfulTrials).toBe(14)
    expect(combined.successRate).toBe(0.7)
    expect(combined.targetAchieved).toBe(true)
  })

  it("does not sum resin spent across failed trials for Target mode", () => {
    const worker1 = mockResult({
      trialResinSpents: [400, 600],
      trialTargetAchieved: [true, true],
      trials: 2,
      successfulTrials: 2,
    })
    const worker2 = mockResult({
      trialResinSpents: [2000, 2000],
      trialTargetAchieved: [false, false],
      trials: 2,
      successfulTrials: 0,
    })

    const combined = aggregate([worker1, worker2])

    // Should use median of successful trials (400, 600) -> 500, not 400+600+2000+2000 = 5000!
    expect(combined.medianResinSpent).toBe(500)
    expect(combined.totalResinSpent).toBe(500)
  })

  it("handles empty results safely", () => {
    const combined = aggregate([])
    expect(combined.trials).toBe(0)
    expect(combined.totalResinSpent).toBe(0)
    expect(combined.targetAchieved).toBe(false)
  })
})
