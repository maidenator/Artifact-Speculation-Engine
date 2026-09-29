import { useState } from "react"
import { ArtifactCard } from "./ArtifactCard"
import { fmtDays, fmtTime } from "../utils/format"
import type { ScoreMode, SimulationResult } from "../types/artifact"

function ArtifactSkeleton({ loading }: { loading: boolean }) {
  return (
    <>
      <style>{`
        @keyframes skeletonPulse {
          0% { opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { opacity: 0.2; }
        }
        .artifact-skeleton {
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
      `}</style>
      <article 
        className={`artifact ${loading ? "artifact-skeleton" : ""}`} 
        style={{ opacity: loading ? 1 : 0.4, pointerEvents: "none" }}
      >
        <header>
          <span className="rank">#--</span>
          <div className="slot-wrapper">
            <div style={{ width: "20px", height: "20px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }} />
            <div style={{ width: "60px", height: "14px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }} />
          </div>
          <span className="level">+0</span>
        </header>
        
        <div className="main" style={{ height: "45px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", margin: "8px 12px" }} />
        
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "12px 12px" }}>
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} style={{ height: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
          ))}
        </div>
        
        <div style={{ height: "28px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", margin: "12px 12px 8px 12px" }} />
      </article>
    </>
  )
}

interface ResultsViewProps {
  result: SimulationResult
  loading: boolean
  ranMode: number
  scoreMode?: ScoreMode
  ranPriority: number[]
  elapsedMs: number | null
}

export function ResultsView({ result, loading, ranMode, ranPriority, elapsedMs }: ResultsViewProps) {
  const [scoreMode, setScoreMode] = useState<ScoreMode>("cv")

  return (
    <section className="card results" aria-live="polite">
      
      <div className="sticky-results-header">
        <div className="results-head">
          <h2 className="font-genshin font-bold text-3xl">Results</h2>
          {ranMode === 1 && !loading && (
            <span className={`badge font-genshin ${result.targetAchieved ? "ok" : "bad"}`}>
              {result.targetAchieved ? "Goal reached" : "Goal not reached within budget"}
            </span>
          )}
        </div>

        <p className={`summary font-genshin ${loading ? "artifact-skeleton" : ""}`} style={{ opacity: loading ? 0.5 : 1 }}>
          {loading ? (
            <span style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", borderRadius: "4px", width: "70%", height: "1.1em" }} />
          ) : (
            <>
              Spending {result.totalResinSpent.toLocaleString()} Resin (Around {fmtDays(result.equivalentDays)}) got you{" "}
              <strong style={{ fontSize: "1.2em", color: "var(--gold)" }}>{result.totalFiveStarsFound.toLocaleString()}</strong> Artifacts.
            </>
          )}
        </p>

        <dl className={`stats font-genshin ${loading ? "artifact-skeleton" : ""}`} style={{ opacity: loading ? 0.5 : 1 }}>
          <div>
            <dt>Domain runs</dt>
            <dd>{loading ? <span style={{ display: "inline-block", width: "40px", height: "1.1em", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }} /> : result.domainRunsCompleted.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Strongbox rolls</dt>
            <dd>{loading ? <span style={{ display: "inline-block", width: "40px", height: "1.1em", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }} /> : result.strongboxRollsCompleted.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Engine Run time</dt>
            <dd>{loading ? <span style={{ display: "inline-block", width: "40px", height: "1.1em", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }} /> : (elapsedMs !== null ? fmtTime(elapsedMs) : "-")}</dd>
          </div>
        </dl>

        <div className="pieces-head">
          <h3 className="font-genshin">Best pieces ({loading ? "..." : result.topArtifacts.length})</h3>
          <div className="toggle font-genshin" role="group" aria-label="Score shown on each piece">
            <button 
              type="button" 
              aria-pressed={scoreMode === "cv"} 
              onClick={() => setScoreMode("cv")}
              style={{
                backgroundColor: scoreMode === "cv" ? "var(--gold)" : "transparent",
                color: scoreMode === "cv" ? "#111" : "inherit"
              }}
            >
              Crit Value
            </button>
            <button 
              type="button" 
              aria-pressed={scoreMode === "rv"} 
              onClick={() => setScoreMode("rv")}
              style={{
                backgroundColor: scoreMode === "rv" ? "var(--gold)" : "transparent",
                color: scoreMode === "rv" ? "#111" : "inherit"
              }}
            >
              Roll Value
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ position: "relative" }}>
          <div className="artifacts" style={{ opacity: 0.3 }}>
            <ArtifactSkeleton loading={true} />
            <ArtifactSkeleton loading={true} />
            <ArtifactSkeleton loading={true} />
          </div>
          <div 
            className="font-genshin"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              zIndex: 10,
              color: "#94a3b8",
              fontSize: "1.3rem",
              fontWeight: "bold",
              padding: "12px 24px",
              borderRadius: "8px",
              opacity: 0.5,
            }}
          >
            Simulating artifact farming...
          </div>
        </div>
      ) : result.topArtifacts.length === 0 ? (
        <div className="artifacts">
          <ArtifactSkeleton loading={false} />
          <ArtifactSkeleton loading={false} />
          <ArtifactSkeleton loading={false} />
        </div>
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