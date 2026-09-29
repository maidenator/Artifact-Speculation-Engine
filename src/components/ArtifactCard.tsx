import { MAIN_STAT_NAMES, SLOT_NAMES, SUBSTAT_NAMES } from "../constants/artifactData"
import { fmtStat } from "../utils/format"
import { cvTier } from "../utils/scoring"
import type { ArtifactOutput } from "../types/artifact"

interface ArtifactCardProps {
  artifact: ArtifactOutput
  rank: number
}

export function ArtifactCard({ artifact: art, rank }: ArtifactCardProps) {
  return (
    <article className={`artifact card-${cvTier(art.critValue)}`}>
      <header>
        <span className="rank">#{rank}</span>
        <strong>{SLOT_NAMES[art.slot] ?? "Piece"}</strong>
        <span className="level">+{art.level}</span>
      </header>
      <p className="main">
        <span>{MAIN_STAT_NAMES[art.mainStat.type] ?? art.mainStat.type}</span>
        <strong>{fmtStat(art.mainStat.type, art.mainStat.value)}</strong>
      </p>
      <ul>
        {art.subStats.map((sub, i) => (
          <li key={i}>
            <span>{SUBSTAT_NAMES[sub.type] ?? sub.type}<i title={`${sub.rolls} rolls`}>{" " + "•".repeat(Math.min(sub.rolls, 6))}</i></span>
            <span>{fmtStat(sub.type, sub.value)}</span>
          </li>
        ))}
      </ul>
      <footer className={cvTier(art.critValue)}>
        <span>Crit Value</span>
        <strong>{art.critValue.toFixed(1)}</strong>
      </footer>
    </article>
  )
}