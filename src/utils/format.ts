import { FLAT_STATS } from "../constants/artifactData"

export const fmtStat = (id: number, value: number) =>
  FLAT_STATS.has(id) ? `+${Math.round(value).toLocaleString()}` : `+${value.toFixed(1)}%`

export function fmtDays(days: number): string {
  if (days < 365) {
    return `${Math.round(days).toLocaleString()} days`
  }

  const years = days / 365.25

  if (years < 10) {
    return `${years.toFixed(1)} years`
  }

  return `${Math.round(years).toLocaleString()} years`
}

export const fmtTime = (ms: number) =>
  ms < 1000 ? `${ms.toFixed(0)} ms` : `${(ms / 1000).toFixed(2)} s`