import { describe, it, expect } from "vitest"
import { priorityFrom, weightsFromPriority, cvTier, rvTier, scoreArtifact, rollValue } from "./scoring"
import { Stat } from "../constants/artifactData"

describe("scoring utilities", () => {
  it("computes priority from weights object correctly", () => {
    const weights = {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
      [Stat.AtkPercent]: 0.5,
      [Stat.HpPercent]: 0,
    }
    
    // Sorts by weight desc, filters out 0
    const priority = priorityFrom(weights)
    expect(priority).toEqual([Stat.CritDMG, Stat.CritRate, Stat.AtkPercent])
  })

  it("assigns decreasing fractional weights based on priority order", () => {
    const priority = [Stat.CritDMG, Stat.CritRate, Stat.AtkPercent]
    const weights = weightsFromPriority(priority)
    
    expect(weights).toEqual([
      { stat: Stat.CritDMG, weight: 1 },         // 3/3
      { stat: Stat.CritRate, weight: 2/3 },      // 2/3
      { stat: Stat.AtkPercent, weight: 1/3 },    // 1/3
    ])
  })

  it("calculates tiers correctly", () => {
    expect(cvTier(51)).toBe("cv-max")
    expect(cvTier(40)).toBe("cv-top")
    expect(cvTier(10)).toBe("cv-low")
    
    expect(rvTier(750)).toBe("cv-max")
    expect(rvTier(450)).toBe("cv-mid")
  })

  it("scores artifacts based on substat weights", () => {
    const art = {
      slot: 0,
      level: 20,
      mainStat: { type: Stat.HpPercent, value: 47.8 },
      critValue: 20,
      subStats: [
        { type: Stat.CritDMG, value: 14.0, rolls: 2 },
        { type: Stat.CritRate, value: 3.0, rolls: 1 },
      ]
    }
    const weights = [
      { stat: Stat.CritDMG, weight: 1 },
      { stat: Stat.CritRate, weight: 0.5 },
    ]
    expect(scoreArtifact(art, weights)).toBe(14.0 * 1 + 3.0 * 0.5)
  })

  it("calculates roll value correctly", () => {
    const art = {
      slot: 0,
      level: 20,
      mainStat: { type: Stat.HpPercent, value: 47.8 },
      critValue: 20,
      subStats: [
        { type: Stat.CritDMG, value: 7.8, rolls: 1 },
      ]
    }
    // MAX_SUBSTAT_ROLL[Stat.CritDMG] is 7.8
    expect(rollValue(art, [Stat.CritDMG])).toBeCloseTo(100)
  })
})
