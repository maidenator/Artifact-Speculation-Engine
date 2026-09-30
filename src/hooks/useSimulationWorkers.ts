import { useEffect, useRef, useState } from "react"
import SimulationWorker from "../workers/simulation.worker?worker"
import { RESIN_PER_DAY, RESIN_PER_RUN } from "../constants/resin"
import { scoreArtifact, weightsFromPriority } from "../utils/scoring"
import { SimulationMode, type SimulationResult, type SimulationSettings, type WorkerMessageData, type ArtifactOutput } from "../types/artifact"

export function useSimulationWorkers() {
  const [engineReady, setEngineReady] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [ranMode, setRanMode] = useState<SimulationMode>(SimulationMode.ResinBudget)
  const [ranPriority, setRanPriority] = useState<number[]>([])
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  
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

  return { engineReady, engineError, loading, runError, result, ranMode, ranPriority, elapsedMs, run, generateBatch, generateBatchHistory }
}