import { useState, useCallback, useMemo, useRef } from "react"
import { ArtifactCard, ANIMATION_DURATION_MS } from "./ArtifactCard"
import { ArtifactGrid } from "./ArtifactGrid"
import type { UpgradeAnimation } from "./ArtifactCard"
import { SubstatPriority } from "./SubstatPriority"
import { GenshinSelect } from "./selection"
import { Field } from "./Field"
import { DOMAIN_OPTIONS } from "./DomainSelect"
import { ARTIFACT_DOMAINS } from "../constants/domains"

import { useSimulationWorkers } from "../hooks/useSimulationWorkers"
import { scoreArtifact, weightsFromPriority, getRollTier, inferRollTiers } from "../utils/scoring"
import type { ArtifactOutput, ScoreMode } from "../types/artifact"

const LEVEL_LABELS = ["+0", "+4", "+8", "+12", "+16", "+20"]

interface SandboxArtifact {
  /** All 6 snapshots from the C++ engine: index 0 = +0, index 5 = +20 */
  history: ArtifactOutput[]
  /** Which snapshot is currently being shown (0–5) */
  currentStep: number
  /** Stable identity so sorting doesn't scramble keys */
  id: number
}

let nextId = 0

function ArtifactSkeleton() {
  return (
    <article
      className="bg-[#e9e5dc] border border-line rounded-md overflow-hidden flex flex-col h-max shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
      style={{ opacity: 0.35, pointerEvents: "none" }}
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
  )
}

export function ArtifactSandbox() {
  const { engineReady, generateBatchHistory } = useSimulationWorkers()
  const [artifacts, setArtifacts] = useState<SandboxArtifact[]>([])
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(5)
  const [domainId, setDomainId] = useState<string>("")
  const [priority, setPriority] = useState<number[]>([])
  const [scoreMode, setScoreMode] = useState<ScoreMode>("cv")
  const [upgradeAnims, setUpgradeAnims] = useState<Map<number, UpgradeAnimation>>(new Map())
  const animTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  let animKey = useRef(0)

  const substatWeights = useMemo(() => weightsFromPriority(priority), [priority])

  /** Compare two snapshots and return the animation info for the upgraded substat */
  const computeDiff = (current: ArtifactOutput, next: ArtifactOutput): UpgradeAnimation | null => {
    // Case 1: new 4th substat added (3-liner → 4-liner)
    if (next.subStats.length > current.subStats.length) {
      const newSub = next.subStats[next.subStats.length - 1]
      return {
        substatIndex: next.subStats.length - 1,
        delta: newSub.value,
        rollTier: getRollTier(newSub.type, newSub.value),
        statType: newSub.type,
        key: ++animKey.current,
      }
    }
    // Case 2: existing substat upgraded
    for (let i = 0; i < current.subStats.length; i++) {
      if (Math.abs(next.subStats[i].value - current.subStats[i].value) > 0.001) {
        const delta = next.subStats[i].value - current.subStats[i].value
        return {
          substatIndex: i,
          delta,
          rollTier: getRollTier(next.subStats[i].type, delta),
          statType: next.subStats[i].type,
          key: ++animKey.current,
        }
      }
    }
    return null
  }

  /** Schedule animation for a single artifact, auto-clearing after ANIMATION_DURATION_MS */
  const triggerAnim = (artifactId: number, anim: UpgradeAnimation) => {
    // Clear any existing timer for this artifact
    const existing = animTimers.current.get(artifactId)
    if (existing) clearTimeout(existing)

    setUpgradeAnims((prev) => new Map(prev).set(artifactId, anim))

    const timer = setTimeout(() => {
      setUpgradeAnims((prev) => {
        const next = new Map(prev)
        next.delete(artifactId)
        return next
      })
      animTimers.current.delete(artifactId)
    }, ANIMATION_DURATION_MS)
    animTimers.current.set(artifactId, timer)
  }

  const handleGenerate = useCallback(async () => {
    if (!engineReady || loading) return
    setLoading(true)
    setUpgradeAnims(new Map())
    try {
      const histories = await generateBatchHistory(count)

      const activeDomain = ARTIFACT_DOMAINS.find(d => d.id === domainId);

      const newArtifacts: SandboxArtifact[] = histories.map((history) => {
        if (activeDomain) {
          const pseudoRandom = Math.random() < 0.5;
          const chosenSet = activeDomain.sets[pseudoRandom ? 0 : 1];
          for (const snapshot of history) {
            snapshot.setId = chosenSet.id;
            snapshot.enkaId = chosenSet.enkaId;
            if (chosenSet.enkaId) {
              const slotSuffixMap: Record<number, string> = { 0: "4", 1: "2", 2: "5", 3: "1", 4: "3" };
              const suffix = slotSuffixMap[snapshot.slot] || "4";
              snapshot.iconUrl = `UI_RelicIcon_${chosenSet.enkaId}_${suffix}.png`;
            }
          }
        }
        // Step 0: Initialize base rollTiers
        for (const sub of history[0].subStats) {
          sub.rollTiers = inferRollTiers(sub.type, sub.value, sub.rolls)
        }

        // Step 1 to 5: Propagate and append exact diffs to preserve chronological stack
        for (let s = 1; s < history.length; s++) {
          const prev = history[s - 1]
          const curr = history[s]

          // Copy previous history exactly
          for (let i = 0; i < curr.subStats.length; i++) {
            curr.subStats[i].rollTiers = i < prev.subStats.length
              ? [...(prev.subStats[i].rollTiers || [])]
              : []
          }

          // Compute diff without incrementing animation key (we just want the tier string)
          let diffTier = "min"
          let diffIdx = -1
          if (curr.subStats.length > prev.subStats.length) {
            diffIdx = curr.subStats.length - 1
            diffTier = getRollTier(curr.subStats[diffIdx].type, curr.subStats[diffIdx].value)
          } else {
            for (let i = 0; i < prev.subStats.length; i++) {
              if (Math.abs(curr.subStats[i].value - prev.subStats[i].value) > 0.001) {
                diffIdx = i
                diffTier = getRollTier(curr.subStats[i].type, curr.subStats[i].value - prev.subStats[i].value)
                break
              }
            }
          }

          if (diffIdx !== -1) {
            curr.subStats[diffIdx].rollTiers!.push(diffTier)
          }
        }

        return {
          history,
          currentStep: 0,
          id: nextId++,
        }
      })

      setArtifacts(newArtifacts)
    } catch (err) {
      console.error("Sandbox generation error:", err)
    } finally {
      setLoading(false)
    }
  }, [engineReady, loading, count, domainId, generateBatchHistory])

  const upgradeOne = (id: number) => {
    setArtifacts((prev) => {
      return prev.map((a) => {
        if (a.id !== id || a.currentStep >= 5) return a
        const current = a.history[a.currentStep]
        const next = a.history[a.currentStep + 1]
        const diff = computeDiff(current, next)
        if (diff) triggerAnim(a.id, diff)
        return { ...a, currentStep: a.currentStep + 1 }
      })
    })
  }

  const upgradeAll = () => {
    setArtifacts((prev) => {
      return prev.map((a) => {
        if (a.currentStep >= 5) return a
        const current = a.history[a.currentStep]
        const next = a.history[a.currentStep + 1]
        const diff = computeDiff(current, next)
        if (diff) triggerAnim(a.id, diff)
        return { ...a, currentStep: a.currentStep + 1 }
      })
    })
  }

  const maxAll = () => {
    setUpgradeAnims(new Map())
    setArtifacts((prev) => prev.map((a) => ({ ...a, currentStep: 5 })))
  }

  const resetAll = () => {
    setUpgradeAnims(new Map())
    setArtifacts((prev) => prev.map((a) => ({ ...a, currentStep: 0 })))
  }

  const allMaxed = artifacts.length > 0 && artifacts.every((a) => a.currentStep >= 5)
  const allBase = artifacts.length > 0 && artifacts.every((a) => a.currentStep === 0)

  // Sort artifacts by score when priority is set
  const sortedArtifacts = useMemo(() => {
    if (priority.length === 0) return artifacts
    return [...artifacts].sort((a, b) => {
      const artA = a.history[a.currentStep]
      const artB = b.history[b.currentStep]
      return scoreArtifact(artB, substatWeights) - scoreArtifact(artA, substatWeights)
    })
  }, [artifacts, priority, substatWeights])

  return (
    <div className="font-genshin max-w-[1400px] mx-auto px-5 pt-9 pb-[72px] min-h-screen text-[15px] leading-relaxed box-border">
      {/* Header */}
      <div className="relative bg-page z-[100] pt-9 pb-4 mb-3">
        <header>
          <h1 className="font-genshin font-bold text-[28px] text-gold mb-1.5 leading-[1.2] tracking-[0.5px]">
            Artifact Sandbox
          </h1>
          <p className="font-genshin text-muted max-w-[60ch] mb-2.5">
            Generate random artifacts and upgrade them step by step
          </p>
          <p
            className={`font-genshin inline-flex items-center gap-2 mb-[22px] text-[13px] text-muted`}
            role="status"
          >
            <span className={`w-2 h-2 rounded-full ${engineReady ? "bg-ok" : "bg-muted"}`} />
            {engineReady ? "Engine ready" : "Loading engine..."}
          </p>
        </header>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 lg:h-auto">
        {/* Left Sidebar: Controls */}
        <aside className="lg:h-auto lg:max-h-[calc(100vh-72px)] lg:overflow-y-auto flex flex-col gap-4">
          {/* Generate Card */}
          <section className="bg-card border border-line rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
            <div className="px-5 pt-5 pb-4 border-b border-line">
              <h2 className="font-genshin font-bold text-[28px] text-gold mb-6 leading-[1.2] tracking-[0.5px]">Generate</h2>

              <div className="mb-4">
                <Field id="sandboxDomain" label="Domain">
                  <GenshinSelect
                    value={domainId}
                    onChange={(val) => setDomainId(String(val))}
                    options={DOMAIN_OPTIONS}
                    maxHeight="220px"
                  />
                </Field>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Count Input */}
                <div className="flex items-center gap-2">
                  <label className="font-genshin text-[13px] text-muted" htmlFor="sandbox-count">
                    Count
                  </label>
                  <input
                    id="sandbox-count"
                    type="number"
                    min={1}
                    max={50}
                    value={count}
                    onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="font-genshin w-16 px-2.5 py-1.5 bg-card-inner border border-line rounded-md text-ink text-[14px] text-center focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!engineReady || loading}
                  className="font-genshin font-bold text-[#211c14] bg-gradient-to-b from-[#d3a352] to-[#b88636] px-5 py-2 rounded-lg cursor-pointer hover:brightness-115 active:translate-y-[1px] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed border-none text-[14px] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                >
                  {loading ? "Generating..." : "Generate Artifacts"}
                </button>
              </div>
            </div>

            {/* Upgrade Controls */}
            {artifacts.length > 0 && (
              <div className="px-5 py-3 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={upgradeAll}
                  disabled={allMaxed}
                  className="font-genshin px-4 py-1.5 text-[13px] border border-line rounded-full cursor-pointer bg-black/15 text-muted hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Upgrade All +4
                </button>
                <button
                  type="button"
                  onClick={maxAll}
                  disabled={allMaxed}
                  className="font-genshin px-4 py-1.5 text-[13px] border border-line rounded-full cursor-pointer bg-black/15 text-muted hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Max All (+20)
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  disabled={allBase}
                  className="font-genshin px-4 py-1.5 text-[13px] border border-line rounded-full cursor-pointer bg-black/15 text-muted hover:border-[#ff5c5c] hover:text-[#ff5c5c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Reset All
                </button>
              </div>
            )}
          </section>

          {/* Substat Priority Card — reused from Speculator */}
          <section className="bg-card border border-line rounded-lg p-5 shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
            <h2 className="font-genshin font-bold text-[28px] text-gold mb-2 leading-[1.2] tracking-[0.5px]">Sandbox Config</h2>
            <p className="font-genshin text-[12.5px] text-muted mb-4">Prioritize substats to sort and highlight your artifacts</p>
            <SubstatPriority priority={priority} setPriority={setPriority} />
          </section>
        </aside>

        {/* Right: Artifacts Grid */}
        <main className="lg:h-0 lg:min-h-full flex flex-col">
          <section className="bg-card border border-line rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col h-full">
            <div className="bg-card z-10 px-5 pt-5 pb-3 border-b border-line shrink-0">
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <h2 className="font-genshin font-bold text-[18px] m-0 text-gold tracking-[0.5px]">
                  Artifacts ({loading ? "..." : artifacts.length})
                </h2>

                <div className="flex items-center gap-3">
                  {/* Score Mode Toggle — reused pattern from ResultsView */}
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

              {priority.length > 0 && artifacts.length > 0 && (
                <p className="font-genshin text-[12px] text-muted mt-2 opacity-70">
                  Sorted by priority • Matching substats are highlighted
                </p>
              )}
            </div>

            {artifacts.length === 0 && !loading ? (
              <ArtifactGrid className="flex-1">
                <ArtifactSkeleton />
                <ArtifactSkeleton />
                <ArtifactSkeleton />
              </ArtifactGrid>
            ) : loading ? (
              <div className="relative flex-1 flex flex-col min-h-0">
                <ArtifactGrid className="flex-1 opacity-30">
                  <ArtifactSkeleton />
                  <ArtifactSkeleton />
                  <ArtifactSkeleton />
                </ArtifactGrid>
                <div className="font-genshin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 text-slate-400 text-[1.3rem] font-bold px-6 py-3 rounded-lg opacity-50">
                  Generating artifacts...
                </div>
              </div>
            ) : (
              <ArtifactGrid className="flex-1">
                {sortedArtifacts.map((sandboxArt, idx) => {
                  const displayArt = sandboxArt.history[sandboxArt.currentStep]
                  const isMaxed = sandboxArt.currentStep >= 5

                  // For 3-liner artifacts, peek at the next upgrade step to find the incoming 4th substat
                  let previewSubstat: { type: number; value: number } | undefined
                  if (displayArt.subStats.length < 4 && sandboxArt.currentStep < 5) {
                    const nextSnapshot = sandboxArt.history[sandboxArt.currentStep + 1]
                    if (nextSnapshot && nextSnapshot.subStats.length > displayArt.subStats.length) {
                      const newSub = nextSnapshot.subStats[nextSnapshot.subStats.length - 1]
                      previewSubstat = { type: newSub.type, value: newSub.value }
                    }
                  }

                  return (
                    <div key={sandboxArt.id} className="flex flex-col gap-2 w-full max-w-[300px] mx-auto">
                      <ArtifactCard
                        artifact={displayArt}
                        rank={idx + 1}
                        scoreMode={scoreMode}
                        priority={priority}
                        previewSubstat={previewSubstat}
                        upgradeAnimation={upgradeAnims.get(sandboxArt.id) ?? null}
                      />

                      {/* Per-Card Upgrade Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => upgradeOne(sandboxArt.id)}
                          disabled={isMaxed}
                          className="font-genshin flex-1 px-3 py-1.5 text-[12px] font-semibold border border-line rounded-md cursor-pointer bg-card-inner text-muted hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          {isMaxed ? "Maxed" : `Enhance ${LEVEL_LABELS[sandboxArt.currentStep + 1]}`}
                        </button>

                        {/* Level Progress Dots */}
                        <div className="flex items-center gap-1">
                          {LEVEL_LABELS.map((label, step) => (
                            <span
                              key={step}
                              title={label}
                              className={`w-2 h-2 rounded-full transition-all duration-200 ${step <= sandboxArt.currentStep
                                ? "bg-gold shadow-[0_0_6px_rgba(211,163,82,0.5)]"
                                : "bg-line"
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </ArtifactGrid>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
