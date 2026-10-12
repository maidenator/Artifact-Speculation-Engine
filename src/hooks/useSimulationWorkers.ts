import { useEffect, useRef, useState } from "react"
import SimulationWorker from "../workers/simulation.worker?worker"
import { RESIN_PER_DAY, RESIN_PER_RUN } from "../constants/resin"
import { scoreArtifact, weightsFromPriority } from "../utils/scoring"
import { SimulationMode, type SimulationResult, type SimulationSettings, type WorkerMessageData, type ArtifactOutput, type HuntListItem, type HuntItemResult, type HuntListResult } from "../types/artifact"
import { ARTIFACT_DOMAINS } from "../constants/domains"

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

        const payload = JSON.stringify({
          mode,
          resinBudget: workerBudget,
          topK,
          useStrongBox,
          minCritValue,
          substatWeights,
          ...(mode === SimulationMode.TargetPiece && targetSlot !== null ? { targetSlot } : {}),
          ...(mode === SimulationMode.TargetPiece && targetMainStat !== null ? { targetMainStat } : {}),
        })

        return new Promise<SimulationResult>((resolve, reject) => {
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
          worker.postMessage({ configJson: payload, seed: Date.now() + index * 10007 })
        })
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

      // Assign random sets to artifacts that don't have one (cosmetic only)
      for (const art of aggregated.topArtifacts) {
        if (!art.setId) {
          const randomDomain = ARTIFACT_DOMAINS[Math.floor(Math.random() * ARTIFACT_DOMAINS.length)]
          const chosenSet = randomDomain.sets[Math.random() < 0.5 ? 0 : 1]
          art.setId = chosenSet.id as any
          if (chosenSet.enkaId) {
            const slotSuffixMap: Record<number, string> = { 0: "4", 1: "2", 2: "5", 3: "1", 4: "3" }
            const suffix = slotSuffixMap[art.slot] || "4"
            art.iconUrl = `UI_RelicIcon_${chosenSet.enkaId}_${suffix}.png`
          }
        }
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
   * Run a hunt list simulation: farm artifacts until ALL items on the list are found
   * or budget exhausted. Runs the C++ HuntList engine directly in WebAssembly per domain.
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

      // Group items by domainId (defaulting undefined to first domain)
      const itemsByDomain = new Map<string, { item: HuntListItem; index: number }[]>()
      for (let i = 0; i < huntItems.length; i++) {
        const item = huntItems[i]
        const key = item.domainId || ARTIFACT_DOMAINS[0].id
        if (!itemsByDomain.has(key)) itemsByDomain.set(key, [])
        itemsByDomain.get(key)!.push({ item, index: i })
      }

      // Farm each domain sequentially using C++ HuntList engine
      for (const [domainId, domainGroupItems] of itemsByDomain.entries()) {
        if (runId !== currentRunId.current) return
        if (totalResinSpent >= maxBudget) break

        const remainingBudget = maxBudget - totalResinSpent
        if (remainingBudget < RESIN_PER_RUN) break

        const activeDomain = ARTIFACT_DOMAINS.find((d) => d.id === domainId) || ARTIFACT_DOMAINS[0]

        // Map items in this domain group to C++ HuntTarget structures
        const huntTargets = domainGroupItems.map((g) => {
          let setIndex = -1
          if (g.item.setId && activeDomain) {
            if (activeDomain.sets[0].id === g.item.setId) setIndex = 0
            else if (activeDomain.sets[1].id === g.item.setId) setIndex = 1
          }

          return {
            id: g.item.id,
            slot: g.item.slot,
            mainStat: g.item.mainStat,
            setIndex,
            substats: g.item.substats.map((s) => ({
              stat: s.stat,
              minRolls: s.minRolls,
            })),
          }
        })

        const payload = JSON.stringify({
          mode: SimulationMode.HuntList,
          resinBudget: remainingBudget,
          useStrongBox,
          huntTargets,
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

        const domainStartingResin = totalResinSpent
        totalResinSpent += res.totalResinSpent
        totalDomainRuns += res.domainRunsCompleted
        totalStrongboxRolls += res.strongboxRollsCompleted

        // Process found hunt results returned from C++
        if (res.huntResults) {
          for (const hr of res.huntResults) {
            const g = domainGroupItems.find((d) => d.item.id === hr.id)
            if (g && hr.found && hr.artifact) {
              const art = hr.artifact
              // Assign the correct set metadata based on setIndex
              if (activeDomain && hr.setIndex >= 0 && hr.setIndex < activeDomain.sets.length) {
                const chosenSet = activeDomain.sets[hr.setIndex]
                art.setId = chosenSet.id as any
                art.setName = chosenSet.name
                if (chosenSet.enkaId) {
                  const slotSuffixMap: Record<number, string> = { 0: "4", 1: "2", 2: "5", 3: "1", 4: "3" }
                  const suffix = slotSuffixMap[art.slot] || "4"
                  art.iconUrl = `UI_RelicIcon_${chosenSet.enkaId}_${suffix}.png`
                }
              }

              const exactResin = domainStartingResin + hr.resinSpent
              itemResults[g.index].found = true
              itemResults[g.index].resinSpent = exactResin
              itemResults[g.index].daysSpent = exactResin / RESIN_PER_DAY
              itemResults[g.index].artifact = art
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