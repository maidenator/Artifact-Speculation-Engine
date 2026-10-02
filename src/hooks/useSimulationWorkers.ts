import { useEffect, useRef, useState } from "react"
import SimulationWorker from "../workers/simulation.worker?worker"
import { RESIN_PER_DAY, RESIN_PER_RUN } from "../constants/resin"
import { scoreArtifact, weightsFromPriority } from "../utils/scoring"
import { SimulationMode, type SimulationResult, type SimulationSettings, type WorkerMessageData, type ArtifactOutput, type HuntListItem, type HuntItemResult, type HuntListResult } from "../types/artifact"
import { ARTIFACT_DOMAINS } from "../constants/domains"
import { AVG_SUBSTAT_ROLL } from "../constants/artifactData"

export function useSimulationWorkers() {
  const [engineReady, setEngineReady] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [ranMode, setRanMode] = useState<SimulationMode>(SimulationMode.ResinBudget)
  const [ranPriority, setRanPriority] = useState<number[]>([])
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const [huntResult, setHuntResult] = useState<HuntListResult | null>(null)
  
  const workersRef = useRef<Worker[]>([])
  const currentRunId = useRef(0)

  useEffect(() => {
    const threadCount = navigator.hardwareConcurrency || 4
    const spawnedWorkers: Worker[] = []
    let readyCount = 0

    try {
      for (let i = 0; i < threadCount; ++i) {
        // Vite handles the constructor and module packaging automatically
        const worker = new SimulationWorker()

        worker.onmessage = (e: MessageEvent<WorkerMessageData>) => {
          if (e.data.type === "READY") {
            readyCount++
            if (readyCount === threadCount) {
              setEngineReady(true)
            }
          } else if (e.data.type === "ERROR") {
            setEngineError(e.data.error ?? "Failed to initialize artifact engine worker.")
          }
        }

        worker.onerror = (err) => {
          // err is an ErrorEvent; log the actual message if present
          console.error("Worker spawn error details:", err.message ?? err)
          setEngineError("The simulation engine failed to load. Refresh the page to try again.")
        }

        spawnedWorkers.push(worker)
      }
      workersRef.current = spawnedWorkers
    } catch (err: unknown) {
      console.error("Worker initialization failure:", err)
      queueMicrotask(() => {
        setEngineError("The simulation engine failed to load. Refresh the page to try again.")
      })
    }

    return () => {
      spawnedWorkers.forEach((w) => w.terminate())
      workersRef.current = []
    }
  }, [])

  const run = async (settings: SimulationSettings) => {
    if (workersRef.current.length === 0) return
    
    const runId = ++currentRunId.current
    
    const { mode, resinBudget, topK, useStrongBox, minCritValue, targetSlot, targetMainStat, priority } = settings

    setLoading(true)
    setRunError(null)
    setHuntResult(null)

    const substatWeights = weightsFromPriority(priority)

    const numWorkers = workersRef.current.length
    const totalRuns = Math.floor(resinBudget / RESIN_PER_RUN)
    const baseRunsPerWorker = Math.floor(totalRuns / numWorkers)
    const extraRuns = totalRuns % numWorkers

    const start = performance.now()

    try {
      const tasks = workersRef.current.map((worker, index) => {
        const workerRuns = baseRunsPerWorker + (index < extraRuns ? 1 : 0)
        const workerBudget = workerRuns * RESIN_PER_RUN

        if (workerBudget <= 0) return Promise.resolve(null)

        const runWorkerWithSetFilter = async (budget: number, seedBase: number): Promise<SimulationResult> => {
          let remainingBudget = budget;
          
          let aggregatedResult: SimulationResult = {
            targetAchieved: false,
            totalResinSpent: 0,
            equivalentDays: 0,
            domainRunsCompleted: 0,
            strongboxRollsCompleted: 0,
            totalFiveStarsFound: 0,
            topArtifacts: []
          };

          while (remainingBudget > 0) {
            const payload = JSON.stringify({
              mode,
              resinBudget: remainingBudget,
              topK,
              useStrongBox,
              minCritValue,
              substatWeights,
              ...(mode === SimulationMode.TargetPiece && targetSlot !== null ? { targetSlot } : {}),
              ...(mode === SimulationMode.TargetPiece && targetMainStat !== null ? { targetMainStat } : {}),
            })

            const res = await new Promise<SimulationResult>((resolve, reject) => {
              const handler = (e: MessageEvent<WorkerMessageData>) => {
                if (e.data.type === "RESULT") {
                  worker.removeEventListener("message", handler)
                  if (e.data.success && e.data.data) {
                    resolve(e.data.data)
                  } else {
                    reject(new Error(e.data.error ?? "Worker execution error"))
                  }
                }
              }
              worker.addEventListener("message", handler)
              worker.postMessage({ configJson: payload, seed: seedBase + remainingBudget })
            });

            // Add results to aggregation
            aggregatedResult.totalResinSpent += res.totalResinSpent;
            aggregatedResult.equivalentDays += res.equivalentDays;
            aggregatedResult.domainRunsCompleted += res.domainRunsCompleted;
            aggregatedResult.strongboxRollsCompleted += res.strongboxRollsCompleted;
            aggregatedResult.totalFiveStarsFound += res.totalFiveStarsFound;
            
            // Settings domainId has been moved to HuntListItem, so standard runs (TargetPiece) do not use domain logic anymore.
            aggregatedResult.topArtifacts = [...aggregatedResult.topArtifacts, ...res.topArtifacts];

            if (mode === SimulationMode.TargetPiece) {
              if (res.targetAchieved) {
                aggregatedResult.targetAchieved = true;
                break;
              } else {
                break;
              }
            } else {
              break;
            }
          }



          return aggregatedResult;
        };

        return runWorkerWithSetFilter(workerBudget, Date.now() + index * 10007);
      })

      const rawResults = await Promise.all(tasks)
      
      // Ignore results if a new run was started
      if (runId !== currentRunId.current) return
      
      const results = rawResults.filter((r): r is SimulationResult => r !== null)

      const aggregated: SimulationResult = {
        targetAchieved: results.some((r) => r.targetAchieved),
        totalResinSpent: results.reduce((acc, r) => acc + r.totalResinSpent, 0),
        equivalentDays: results.reduce((acc, r) => acc + r.totalResinSpent, 0) / RESIN_PER_DAY,
        domainRunsCompleted: results.reduce((acc, r) => acc + r.domainRunsCompleted, 0),
        strongboxRollsCompleted: results.reduce((acc, r) => acc + r.strongboxRollsCompleted, 0),
        totalFiveStarsFound: results.reduce((acc, r) => acc + r.totalFiveStarsFound, 0),
        topArtifacts: results
          .flatMap((r) => r.topArtifacts)
          .sort((a, b) => scoreArtifact(b, substatWeights) - scoreArtifact(a, substatWeights))
          .slice(0, topK),
      }

      setElapsedMs(performance.now() - start)
      setRanMode(mode)
      setRanPriority(priority)
      setResult(aggregated)
    } catch (err: unknown) {
      if (runId !== currentRunId.current) return
      console.error("Simulation run error:", err)
      setRunError("The simulation hit an error across worker threads.")
    } finally {
      if (runId === currentRunId.current) {
        setLoading(false)
      }
    }
  }

  /**
   * Check if an artifact meets a hunt list item's requirements.
   * Verifies slot, main stat, and that all required substats are present
   * with values >= (minRolls × average roll value).
   */
  const artifactMeetsHuntItem = (art: ArtifactOutput, item: HuntListItem): boolean => {
    // Check slot
    if (art.slot !== item.slot) return false
    // Check main stat
    if (art.mainStat.type !== item.mainStat) return false
    // Check each required substat
    for (const req of item.substats) {
      const sub = art.subStats.find((s) => s.type === req.stat)
      if (!sub) return false
      const minValue = AVG_SUBSTAT_ROLL[req.stat] * req.minRolls
      if (sub.value < minValue * 0.95) return false // 5% tolerance for rounding
    }
    return true
  }

  /**
   * Run a hunt list simulation: farm artifacts until ALL items on the list are found.
   * Each domain run generates 2 artifacts. We check every generated artifact against
   * all unfulfilled hunt list items. Stops when all items are found or budget exhausted.
   */
  const runHuntList = async (huntItems: HuntListItem[], settings: SimulationSettings) => {
    if (workersRef.current.length === 0 || huntItems.length === 0) return

    const runId = ++currentRunId.current
    setLoading(true)
    setRunError(null)

    const start = performance.now()
    const maxBudget = settings.resinBudget
    const useStrongBox = settings.useStrongBox

    try {
      // We'll use a single worker for the hunt list to keep artifact ordering consistent
      const worker = workersRef.current[0]

      // Track which items are still unfulfilled
      const itemResults: HuntItemResult[] = huntItems.map((item) => ({
        huntItemId: item.id,
        found: false,
        resinSpent: 0,
        daysSpent: 0,
        artifact: null,
      }))

      let totalResinSpent = 0
      let totalDomainRuns = 0
      let totalStrongboxRolls = 0
      // Group items by domainId
      const itemsByDomain = new Map<string | undefined, { item: HuntListItem; index: number }[]>()
      for (let i = 0; i < huntItems.length; i++) {
        const item = huntItems[i]
        const key = item.domainId
        if (!itemsByDomain.has(key)) itemsByDomain.set(key, [])
        itemsByDomain.get(key)!.push({ item, index: i })
      }

      // Farm each domain sequentially
      for (const [domainId, domainGroupItems] of itemsByDomain.entries()) {
        const isGroupFound = () => domainGroupItems.every((g) => itemResults[g.index].found)
        let currentChunkSize = 500

        while (totalResinSpent < maxBudget && !isGroupFound()) {
          if (runId !== currentRunId.current) return

          const remainingBudget = Math.min(currentChunkSize, maxBudget - totalResinSpent)
          if (remainingBudget < RESIN_PER_RUN) break

          // Build substat weights from unfulfilled items in this domain group
          const unfulfilledItems = domainGroupItems.filter((g) => !itemResults[g.index].found)
          const weightMap: Record<number, number> = {}
          for (const g of unfulfilledItems) {
            for (const sub of g.item.substats) {
              weightMap[sub.stat] = (weightMap[sub.stat] || 0) + 1
            }
          }
          const substatWeights = Object.entries(weightMap).map(([stat, weight]) => ({
            stat: Number(stat),
            weight,
          }))

          const payload = JSON.stringify({
            mode: SimulationMode.ResinBudget,
            resinBudget: remainingBudget,
            topK: Math.floor(remainingBudget / RESIN_PER_RUN) * 2, // Get all generated artifacts
            useStrongBox,
            minCritValue: 0,
            substatWeights,
          })

          const res = await new Promise<SimulationResult>((resolve, reject) => {
            const handler = (e: MessageEvent<WorkerMessageData>) => {
              if (e.data.type === "RESULT") {
                worker.removeEventListener("message", handler)
                if (e.data.success && e.data.data) resolve(e.data.data)
                else reject(new Error(e.data.error ?? "Worker error"))
              }
            }
            worker.addEventListener("message", handler)
            worker.postMessage({ configJson: payload, seed: Date.now() + totalResinSpent })
          })

          totalResinSpent += res.totalResinSpent
          totalDomainRuns += res.domainRunsCompleted
          totalStrongboxRolls += res.strongboxRollsCompleted
          
          currentChunkSize = Math.min(50000, currentChunkSize * 2)

          // Assign sets to artifacts based on THIS domain group's domainId
          if (domainId) {
            const activeDomain = ARTIFACT_DOMAINS.find((d) => d.id === domainId)
            if (activeDomain) {
              for (const art of res.topArtifacts) {
                const pseudoRandom = Math.random() < 0.5
                const chosenSet = activeDomain.sets[pseudoRandom ? 0 : 1]
                art.setId = chosenSet.id as any
                if (chosenSet.enkaId) {
                  const slotSuffixMap: Record<number, string> = { 0: "4", 1: "2", 2: "5", 3: "1", 4: "3" }
                  const suffix = slotSuffixMap[art.slot] || "4"
                  art.iconUrl = `UI_RelicIcon_${chosenSet.enkaId}_${suffix}.png`
                }
              }
            }
          }

          // Check each generated artifact against unfulfilled hunt items in this group
          for (const art of res.topArtifacts) {
            for (const g of unfulfilledItems) {
              if (itemResults[g.index].found) continue
              const item = g.item

              // Check set filter
              if (item.setId && art.setId !== item.setId) continue

              if (artifactMeetsHuntItem(art, item)) {
                itemResults[g.index].found = true
                itemResults[g.index].resinSpent = totalResinSpent
                itemResults[g.index].daysSpent = totalResinSpent / RESIN_PER_DAY
                itemResults[g.index].artifact = art
                break // One artifact can only fulfill one hunt item
              }
            }
          }
        }
      }
      const allFound = itemResults.every((r) => r.found)

      if (runId !== currentRunId.current) return

      const elapsed = performance.now() - start

      const huntListResult: HuntListResult = {
        allFound,
        totalResinSpent,
        totalDays: totalResinSpent / RESIN_PER_DAY,
        condensedResin: Math.ceil(totalResinSpent / 40),
        domainRunsCompleted: totalDomainRuns,
        strongboxRollsCompleted: totalStrongboxRolls,
        itemResults,
        elapsedMs: elapsed,
      }

      setHuntResult(huntListResult)
      setElapsedMs(elapsed)
    } catch (err: unknown) {
      if (runId !== currentRunId.current) return
      console.error("Hunt list simulation error:", err)
      setRunError("The hunt list simulation hit an error.")
    } finally {
      if (runId === currentRunId.current) {
        setLoading(false)
      }
    }
  }

  const generateBatch = async (count: number, upgrade = true) => {
    if (workersRef.current.length === 0) throw new Error("Workers not initialized")
    const worker = workersRef.current[0]
    return new Promise<ArtifactOutput[]>((resolve, reject) => {
      const handler = (e: MessageEvent<WorkerMessageData>) => {
        if (e.data.type === "BATCH_RESULT") {
          worker.removeEventListener("message", handler)
          if (e.data.success && e.data.data) resolve(e.data.data)
          else reject(new Error(e.data.error || "Batch generation failed"))
        } else if (e.data.type === "ERROR") {
          worker.removeEventListener("message", handler)
          reject(new Error(e.data.error))
        }
      }
      worker.addEventListener("message", handler)
      worker.postMessage({ type: "BATCH", count, upgrade, seed: Date.now() })
    })
  }

  const generateBatchHistory = async (count: number) => {
    if (workersRef.current.length === 0) throw new Error("Workers not initialized")
    const worker = workersRef.current[0]
    return new Promise<ArtifactOutput[][]>((resolve, reject) => {
      const handler = (e: MessageEvent<WorkerMessageData>) => {
        if (e.data.type === "BATCH_HISTORY_RESULT") {
          worker.removeEventListener("message", handler)
          if (e.data.success && e.data.data) resolve(e.data.data)
          else reject(new Error(e.data.error || "Batch history generation failed"))
        } else if (e.data.type === "ERROR") {
          worker.removeEventListener("message", handler)
          reject(new Error(e.data.error))
        }
      }
      worker.addEventListener("message", handler)
      worker.postMessage({ type: "BATCH_HISTORY", count, seed: Date.now() })
    })
  }

  return { engineReady, engineError, loading, runError, result, huntResult, ranMode, ranPriority, elapsedMs, run, runHuntList, generateBatch, generateBatchHistory }
}