import { useState } from "react"
import { ArtifactCard } from "./ArtifactCard"
import { fmtDays, fmtTime } from "../utils/format"
import type {ScoreMode, SimulationResult } from "../types/artifact"

interface ResultsViewProps {
  result: SimulationResult
  ranMode: number
  scoreMode?: ScoreMode
  ranPriority: number[]
  elapsedMs: number | null
}

export function ResultsView({ result, ranMode, ranPriority, elapsedMs }: ResultsViewProps) {
  const [scoreMode, setScoreMode] = useState<ScoreMode>("cv")

  return (
    <section className="card results" aria-live="polite">
      <div className="results-head">
        <h2 className="font-genshin font-bold text-3xl">Results</h2>
        {ranMode === 1 && (
          <span className={`badge ${result.targetAchieved ? "ok" : "bad"}`}>
            {result.targetAchieved ? "Goal reached" : "Goal not reached within budget"}
          </span>
        )}
      </div>

      <p className="summary">
        Spending {result.totalResinSpent.toLocaleString()} resin (about {fmtDays(result.equivalentDays)}) got you{" "}
        <strong>{result.totalFiveStarsFound.toLocaleString()} 5* artifacts</strong>.
      </p>

      <dl className="stats">
        <div><dt>Domain runs</dt><dd>{result.domainRunsCompleted.toLocaleString()}</dd></div>
        <div><dt>Strongbox rolls</dt><dd>{result.strongboxRollsCompleted.toLocaleString()}</dd></div>
        <div><dt>Run time</dt><dd>{elapsedMs !== null ? fmtTime(elapsedMs) : "-"}</dd></div>
      </dl>

      <div className="pieces-head">
        <h3>Best pieces ({result.topArtifacts.length})</h3>
        <div className="toggle" role="group" aria-label="Score shown on each piece">
          <button type="button" aria-pressed={scoreMode === "cv"} onClick={() => setScoreMode("cv")}>Crit Value</button>
          <button type="button" aria-pressed={scoreMode === "rv"} onClick={() => setScoreMode("rv")}>Roll Value</button>
        </div>
      </div>
      {result.topArtifacts.length === 0 ? (
        <p className="hint">No pieces matched. Try more resin or a lower minimum Crit Value.</p>
      ) : (
        <div className="artifacts">
          {result.topArtifacts.map((art, idx) => (
            <ArtifactCard key={idx} artifact={art} rank={idx + 1} scoreMode={scoreMode} priority={ranPriority} />
          ))}
        </div>
      )}
    </section>
  )
}