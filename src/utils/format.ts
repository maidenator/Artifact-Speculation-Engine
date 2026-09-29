import { FLAT_STATS } from "../constants/artifactData"

export const fmtStat = (id: number, value: number) =>
  FLAT_STATS.has(id) ? `+${Math.round(value).toLocaleString()}` : `+${value.toFixed(1)}%`

export const fmtDays = (days: number) =>
  days < 1 ? "under a day" : days < 10 ? `${days.toFixed(1)} days` : `${Math.round(days).toLocaleString()} days`

export const fmtTime = (ms: number) =>
  ms < 1000 ? `${ms.toFixed(0)} ms` : `${(ms / 1000).toFixed(2)} s`