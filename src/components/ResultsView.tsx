import { useState } from "react"
import { ArtifactCard } from "./ArtifactCard"
import { fmtDays, fmtTime } from "../utils/format"
import { SimulationMode, type ScoreMode, type SimulationResult, type HuntListResult } from "../types/artifact"
import { exportSimulationToGOOD } from "../utils/good"
import { SLOT_NAMES, MAIN_STAT_NAMES } from "../constants/artifactData"
import { useSimulationSettings } from "../hooks/useSimulationSettings"
import { GenshinSelect } from "./selection"

const SLOT_ICONS: Record<number, string> = {
  0: "/icons/slot/flower.png",
  1: "/icons/slot/feather.png",
  2: "/icons/slot/sands.png",
  3: "/icons/slot/goblet.png",
  4: "/icons/slot/circlet.png",
}



function ArtifactSkeleton({ loading }: { loading: boolean }) {
  return (
    <>
      <article
        className={`bg-[#e9e5dc] border border-line rounded-md overflow-hidden flex flex-col h-max shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-transform duration-200 hover:-translate-y-[2px] ${loading ? "animate-pulse" : ""}`}
        style={{ opacity: loading ? 1 : 0.4, pointerEvents: "none" }}
      >
        <div className="bg-gradient-to-br from-[#a75727] to-[#d89643] border-b-2 border-[#eab05f] flex flex-col relative overflow-hidden">
          <header className="px-3 py-1.5 flex justify-between items-center text-white gap-1.5 z-10">
            <span className="bg-black/35 px-1.5 py-0.5 rounded text-[11.5px] font-bold text-white">#--</span>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-white/10 rounded" />
              <div className="w-[60px] h-[14px] bg-white/10 rounded" />
            </div>
            <span className="bg-black/25 text-[#f0ebe1] px-1.5 py-0.5 rounded text-[11.5px] font-bold ml-auto">+0</span>
          </header>
          <div className="flex flex-col gap-0.5 m-0 px-3 pt-4 pb-3 font-genshin h-[60px]" />
        </div>

        <div className="flex flex-col gap-2 mx-3 my-3">
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="h-5 bg-black/10 rounded" />
          ))}
        </div>

        <div className="mt-auto px-4 pb-2 pt-1">
          <div className="h-px bg-black/10 w-full mb-2 opacity-50" />
          <div className="flex justify-between px-1 mb-1 mt-1">
            <div className="h-[14px] w-20 bg-black/10 rounded" />
            <div className="h-[14px] w-8 bg-black/10 rounded" />
          </div>
        </div>
      </article>
    </>
  )
}

interface ResultsViewProps {
  result: SimulationResult
  huntResult?: HuntListResult | null
  loading: boolean
  ranMode: SimulationMode
  scoreMode?: ScoreMode
  ranPriority: number[]
  elapsedMs: number | null
}

export function ResultsView({ result, huntResult, loading, ranMode, ranPriority, elapsedMs }: ResultsViewProps) {
  const [scoreMode, setScoreMode] = useState<ScoreMode>("cv")
  const topK = useSimulationSettings(state => state.settings.topK)
  const setTopK = useSimulationSettings(state => state.setTopK)

  // If we have hunt results, show the hunt-specific view
  if (huntResult && !loading) {
    const foundCount = huntResult.itemResults.filter((r) => r.found).length
    const totalCount = huntResult.itemResults.length

    return (
      <section className="bg-card border border-line rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.05)] flex flex-col flex-1 min-h-0 overflow-hidden" aria-live="polite">

        {/* Damage Report Header */}
        <div className="bg-card z-10 px-5 pt-5 pb-4 border-b border-line shrink-0">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div>
              <h2 className="font-genshin font-bold text-[28px] m-0 text-gold leading-[1.2] tracking-[0.5px]">
                Damage Report
              </h2>
              <p className="font-genshin text-[12px] text-muted mt-1">
                {foundCount}/{totalCount} artifacts found
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`font-genshin text-[13px] font-semibold px-2.5 py-0.5 border border-current rounded-full ${huntResult.allFound ? "text-ok" : "text-bad"}`}>
                {huntResult.allFound ? "All found" : "Budget exhausted"}
              </span>
            </div>
          </div>

          {/* Cost summary */}
          <div className="mt-4 bg-gradient-to-r from-gold/10 to-transparent border border-gold/20 rounded-xl p-4">
            <div className="flex items-baseline gap-2">
              <span className="font-genshin text-[14px] text-muted">Total Cost:</span>
              <span className="font-genshin text-[28px] font-bold text-gold tracking-[0.5px]">
                {huntResult.totalResinSpent.toLocaleString()}
              </span>
              <img src="/icons/resin.png" alt="Resin" className="w-5 h-5 opacity-80 self-center" />
            </div>
            <p className="font-genshin text-[13px] text-muted mt-1">
              ≈ {fmtDays(huntResult.totalDays)} of natural regeneration
              <span className="text-muted/50 ml-3">
                ({huntResult.condensedResin.toLocaleString()} Condensed Resin)
              </span>
            </p>
          </div>

          {/* Stats row */}
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 m-0 font-genshin mt-4">
            <div className="px-3 py-2.5 bg-black/15 border border-line rounded-md">
              <dt className="text-[12.5px] text-muted">Domain runs</dt>
              <dd className="m-0 font-genshin text-[22px] font-[650] tracking-[0.5px]">{huntResult.domainRunsCompleted.toLocaleString()}</dd>
            </div>
            <div className="px-3 py-2.5 bg-black/15 border border-line rounded-md">
              <dt className="text-[12.5px] text-muted">Strongbox rolls</dt>
              <dd className="m-0 font-genshin text-[22px] font-[650] tracking-[0.5px]">{huntResult.strongboxRollsCompleted.toLocaleString()}</dd>
            </div>
            <div className="px-3 py-2.5 bg-black/15 border border-line rounded-md">
              <dt className="text-[12.5px] text-muted">Engine Run time</dt>
              <dd className="m-0 font-genshin text-[22px] font-[650] tracking-[0.5px]">{fmtTime(huntResult.elapsedMs)}</dd>
            </div>
          </dl>

          <h3 className="font-genshin text-[16px] m-0 text-gold tracking-[0.5px] mt-5">
            Per-Artifact Breakdown
          </h3>
        </div>

        {/* Per-artifact receipt */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 p-5 pb-10 max-h-[650px] overflow-y-auto artifacts-scroll">
          {huntResult.itemResults.map((itemResult, idx) => (
            <div
              key={itemResult.huntItemId}
              className={`flex flex-col p-4 rounded-xl border transition-all h-full ${itemResult.found
                  ? "bg-white/[0.02] border-white/10"
                  : "bg-red-500/[0.03] border-red-500/20"
                }`}
            >
              {/* Artifact card */}
              <div className="w-full shrink-0 mb-4">
                {itemResult.artifact ? (
                  <ArtifactCard
                    artifact={itemResult.artifact}
                    rank={idx + 1}
                    scoreMode={scoreMode}
                    priority={ranPriority}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[340px] bg-white/[0.03] border border-dashed border-white/10 rounded-lg">
                    <span className="font-genshin text-[13px] text-muted/50">Not found</span>
                  </div>
                )}
              </div>

              {/* Cost info */}
              <div className="flex flex-col justify-start gap-1.5 mt-auto">
                {itemResult.found && itemResult.artifact ? (
                  <>
                    <div className="flex items-center gap-2 mb-0.5">
                      <img src={SLOT_ICONS[itemResult.artifact.slot]} alt="" className="w-4 h-4 opacity-60" />
                      <span className="font-genshin text-[13px] font-semibold text-gold">
                        {SLOT_NAMES[itemResult.artifact.slot]}
                      </span>
                      <span className="font-genshin text-[12px] text-muted">
                        • {MAIN_STAT_NAMES[itemResult.artifact.mainStat.type]}
                      </span>
                    </div>
                    <p className="font-genshin text-[12px] text-muted">
                      Found after approx{" "}
                      <span className="text-gold font-semibold">{itemResult.resinSpent.toLocaleString()} Resin</span>
                      <span className="text-muted/60 ml-1">({fmtDays(itemResult.daysSpent)})</span>
                    </p>
                  </>
                ) : (
                  <p className="font-genshin text-[12px] text-bad mt-auto">
                    Could not be found within the resin budget
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // Standard results view (backward compatible)
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
          <div className="flex items-center gap-3">
            <h3 className="font-genshin text-[16px] m-0 text-gold tracking-[0.5px]">Best pieces</h3>
            <GenshinSelect
              value={topK}
              onChange={(val) => setTopK(Number(val))}
              options={[
                { label: "Show top 3", value: 3 },
                { label: "Show top 5", value: 5 },
                { label: "Show top 10", value: 10 },
                { label: "Show top 20", value: 20 },
                { label: "Show top 50", value: 50 },
              ]}
              theme="dark"
              className="w-36"
              buttonClassName="h-8 text-[13px]"
            />
            <span className="font-genshin text-[13px] text-muted/50">
              ({loading ? "..." : result.topArtifacts.length} found)
            </span>
          </div>

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