import { MAIN_STAT_NAMES, SLOT_NAMES, SUBSTAT_NAMES } from "../constants/artifactData"
import { fmtStat } from "../utils/format"
import { rvTier, cvTier, rollValue } from "../utils/scoring"
import type { ArtifactOutput, ScoreMode } from "../types/artifact"

interface ArtifactCardProps {
  artifact: ArtifactOutput
  rank: number
  scoreMode: ScoreMode
  priority: number[]
}

export function ArtifactCard({ artifact: art, rank, scoreMode, priority }: ArtifactCardProps) {
  return (
    <article className={`artifact card-${scoreMode === "cv" ? cvTier(art.critValue) : rvTier(rollValue(art, priority))}`}>
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
      <footer className={scoreMode === "cv" ? cvTier(art.critValue) : rvTier(rollValue(art, priority))}>
        <span>{scoreMode === "cv" ? "Crit Value" : "Roll Value"}</span>
        <strong>
          {scoreMode === "cv" ? art.critValue.toFixed(1) : `${Math.round(rollValue(art, priority))}%`}
        </strong>
      </footer>
    </article>
  )
}