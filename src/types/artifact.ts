import type { Dispatch, SetStateAction } from "react"

export type StateSetter<T> = Dispatch<SetStateAction<T>>

export interface ArtifactSubstatEntry {
  type: number
  value: number
  rolls: number
  rollTiers?: string[]
}

export interface ArtifactOutput {
  slot: number
  level: number
  mainStat: { type: number; value: number }
  subStats: ArtifactSubstatEntry[]
  critValue: number
}

export interface SimulationResult {
  targetAchieved: boolean
  totalResinSpent: number
  equivalentDays: number
  domainRunsCompleted: number
  strongboxRollsCompleted: number
  totalFiveStarsFound: number
  topArtifacts: ArtifactOutput[]
}

export interface WorkerMessageData {
  type: "READY" | "ERROR" | "RESULT"
  success?: boolean
  data?: SimulationResult
  error?: string
}

export interface SubstatWeight {
  stat: number
  weight: number
}

export interface WeightPreset {
  label: string
  weights: Record<number, number>
}

export enum SimulationMode {
  ResinBudget = 0,
  TargetPiece = 1,
}

export interface SimulationSettings {
  mode: SimulationMode
  resinBudget: number
  topK: number
  useStrongBox: boolean
  minCritValue: number
  targetSlot: number | null
  targetMainStat: number | null
  priority: number[]
}

export type ScoreMode = "cv" | "rv"