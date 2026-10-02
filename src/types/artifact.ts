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
  iconUrl?: string
  setId?: number | string
  enkaId?: number
}

export interface WeaponOutput {
  level: number
  refinement: number
  iconUrl: string
}

export interface CharacterOutput {
  avatarId: number
  name: string
  level: number
  element: string
  iconUrl: string
  weapon: WeaponOutput
  artifacts: ArtifactOutput[]
  stats?: Record<number, number>
  constellation?: number
}

export interface PlayerProfile {
  nickname: string
  level: number
  worldLevel?: number
  signature?: string
  abyssFloor?: number
  abyssChamber?: number
  achievementCount?: number
  profilePicture?: string
  profilePictureUrl?: string
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

/** Result for a single hunt list item */
export interface HuntItemResult {
  huntItemId: string
  found: boolean
  resinSpent: number
  daysSpent: number
  artifact: ArtifactOutput | null
}

/** Aggregated result for the entire hunt list */
export interface HuntListResult {
  allFound: boolean
  totalResinSpent: number
  totalDays: number
  condensedResin: number
  domainRunsCompleted: number
  strongboxRollsCompleted: number
  itemResults: HuntItemResult[]
  elapsedMs: number
}

export interface WorkerMessageData {
  type: "READY" | "ERROR" | "RESULT" | "BATCH_RESULT" | "BATCH_HISTORY_RESULT"
  success?: boolean
  data?: any
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

export interface HuntSubstat {
  stat: number        // stat ID from Stat enum
  minRolls: number    // 1–9 roll count (average roll values assumed)
}

export interface HuntListItem {
  id: string          // unique ID
  slot: number        // 0–4 (Flower, Feather, Sands, Goblet, Circlet)
  mainStat: number    // stat ID from Stat enum
  substats: HuntSubstat[]  // up to 4
  domainId?: string   // optional target domain
  setId?: string      // optional target set
}