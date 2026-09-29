import { useState } from "react"
import { ArtifactCard } from "./ArtifactCard"
import { fmtDays, fmtTime } from "../utils/format"
import { SimulationMode, type ScoreMode, type SimulationResult } from "../types/artifact"
import { exportSimulationToGOOD } from "../utils/good"

function ArtifactSkeleton({ loading }: { loading: boolean }) {
  return (
    <>
      <article 
        className={`bg-card-inner border border-line rounded-md overflow-hidden flex flex-col h-max shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-transform duration-200 hover:-translate-y-[2px] ${loading ? "animate-pulse" : ""}`}
        style={{ opacity: loading ? 1 : 0.4, pointerEvents: "none" }}
      >
        <header className="bg-gradient-to-br from-[#a75727] to-[#d89643] px-3 py-1.5 flex justify-between items-center text-white border-b-2 border-[#eab05f] gap-1.5">
          <span className="bg-black/35 px-1.5 py-0.5 rounded text-[11.5px] font-bold text-white">#--</span>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-white/10 rounded" />
            <div className="w-[60px] h-[14px] bg-white/10 rounded" />
          </div>
          <span className="bg-[#1e2330] text-gold px-2 py-0.5 rounded-full text-[12px] font-bold border border-gold ml-auto">+0</span>
        </header>
        
        <div className="flex flex-col gap-0.5 m-0 px-3 pt-4 pb-3 border-b border-white/5 font-genshin h-[45px] bg-white/5 rounded-md mx-3 my-2" />
        
        <div className="flex flex-col gap-2 mx-3 my-3">
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="h-5 bg-white/5 rounded" />
          ))}
        </div>
        
        <div className="h-7 bg-white/5 rounded-md mx-3 mt-3 mb-2" />
      </article>
    </>
  )
}

interface ResultsViewProps {
  result: SimulationResult
  loading: boolean
  ranMode: SimulationMode
  scoreMode?: ScoreMode
  ranPriority: number[]
  elapsedMs: number | null
}

export function ResultsView({ result, loading, ranMode, ranPriority, elapsedMs }: ResultsViewProps) {
  const [scoreMode, setScoreMode] = useState<ScoreMode>("cv")

  return (
    <section className="bg-card border border-line rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.05)] flex flex-col flex-1 min-h-0 overflow-hidden" aria-live="polite">
      
      <div className="bg-card z-10 px-5 pt-5 pb-3 border-b border-line shrink-0">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <h2 className="font-genshin font-bold text-[28px] m-0 text-gold leading-[1.2] tracking-[0.5px]">Results</h2>
          {ranMode === SimulationMode.TargetPiece && !loading && (
            <span className={`font-genshin text-[13px] font-semibold px-2.5 py-0.5 border border-current rounded-full ${result.targetAchieved ? "text-ok" : "text-bad"}`}>
              {result.targetAchieved ? "Goal reached" : "Goal not reached within budget"}
            </span>
          )}
        </div>

        <p className={`font-genshin my-3 text-[16px] tracking-[0.3px] ${loading ? "animate-pulse" : ""}`} style={{ opacity: loading ? 0.5 : 1 }}>
          {loading ? (
            <span className="inline-block bg-white/10 rounded w-[70%] h-[1.1em]" />
          ) : (
            <>
              Spending {result.totalResinSpent.toLocaleString()} Resin (Around {fmtDays(result.equivalentDays)}) got you{" "}
              <strong className="text-[1.2em] text-gold">{result.totalFiveStarsFound.toLocaleString()}</strong> Artifacts.
            </>
          )}
        </p>

        <dl className={`grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 m-0 font-genshin ${loading ? "animate-pulse" : ""}`} style={{ opacity: loading ? 0.5 : 1 }}>
          <div className="px-3 py-2.5 bg-black/15 border border-line rounded-md">
            <dt className="text-[12.5px] text-muted">Domain runs</dt>
            <dd className="m-0 font-genshin text-[22px] font-[650] tracking-[0.5px]">{loading ? <span className="inline-block w-10 h-[1.1em] bg-white/10 rounded" /> : result.domainRunsCompleted.toLocaleString()}</dd>
          </div>
          <div className="px-3 py-2.5 bg-black/15 border border-line rounded-md">
            <dt className="text-[12.5px] text-muted">Strongbox rolls</dt>
            <dd className="m-0 font-genshin text-[22px] font-[650] tracking-[0.5px]">{loading ? <span className="inline-block w-10 h-[1.1em] bg-white/10 rounded" /> : result.strongboxRollsCompleted.toLocaleString()}</dd>
          </div>
          <div className="px-3 py-2.5 bg-black/15 border border-line rounded-md">
            <dt className="text-[12.5px] text-muted">Engine Run time</dt>
            <dd className="m-0 font-genshin text-[22px] font-[650] tracking-[0.5px]">{loading ? <span className="inline-block w-10 h-[1.1em] bg-white/10 rounded" /> : (elapsedMs !== null ? fmtTime(elapsedMs) : "-")}</dd>
          </div>
        </dl>

        <div className="flex justify-between items-center gap-3 flex-wrap mt-4">
          <h3 className="font-genshin text-[16px] m-0 text-gold tracking-[0.5px]">Best pieces ({loading ? "..." : result.topArtifacts.length})</h3>
          
          <div className="flex items-center gap-3">
            {!loading && result.topArtifacts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const goodData = exportSimulationToGOOD(result.topArtifacts);
                  const blob = new Blob([JSON.stringify(goodData, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `speculation_results_good_${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="font-genshin px-3.5 py-1 text-[12.5px] border border-line rounded-full cursor-pointer hover:border-gold hover:text-gold bg-black/15 text-muted transition-colors"
              >
                Export to GOOD
              </button>
            )}
            
            <div className="font-genshin inline-flex border border-line rounded-full overflow-hidden bg-black/15" role="group" aria-label="Score shown on each piece">
              <button 
                type="button" 
                aria-pressed={scoreMode === "cv"} 
                onClick={() => setScoreMode("cv")}
                className={`px-3.5 py-1 text-[12.5px] border-0 cursor-pointer hover:text-gold ${scoreMode === "cv" ? "bg-gold text-[#121620] font-semibold" : "bg-transparent text-muted"}`}
              >
                Crit Value
              </button>
              <button 
                type="button" 
                aria-pressed={scoreMode === "rv"} 
                onClick={() => setScoreMode("rv")}
                className={`px-3.5 py-1 text-[12.5px] border-0 cursor-pointer hover:text-gold ${scoreMode === "rv" ? "bg-gold text-[#121620] font-semibold" : "bg-transparent text-muted"}`}
              >
                Roll Value
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="relative">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] auto-rows-max content-start gap-4 p-5 pb-10 max-h-[650px] overflow-y-auto artifacts-scroll opacity-30">
            <ArtifactSkeleton loading={true} />
            <ArtifactSkeleton loading={true} />
            <ArtifactSkeleton loading={true} />
          </div>
          <div className="font-genshin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 text-slate-400 text-[1.3rem] font-bold px-6 py-3 rounded-lg opacity-50">
            Simulating artifact farming...
          </div>
        </div>
      ) : result.topArtifacts.length === 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] auto-rows-max content-start gap-4 p-5 pb-10 max-h-[650px] overflow-y-auto artifacts-scroll">
          <ArtifactSkeleton loading={false} />
          <ArtifactSkeleton loading={false} />
          <ArtifactSkeleton loading={false} />
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] auto-rows-max content-start gap-4 p-5 pb-10 max-h-[650px] overflow-y-auto artifacts-scroll">
          {result.topArtifacts.map((art, idx) => (
            <ArtifactCard key={`${art.slot}-${art.mainStat.type}-${idx}`} artifact={art} rank={idx + 1} scoreMode={scoreMode} priority={ranPriority} />
          ))}
        </div>
      )}
      
    </section>
  )
}