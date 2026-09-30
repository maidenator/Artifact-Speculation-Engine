import createArtifactEngine, {
  type ArtifactEngineInstance,
  type ArtifactEngineClass,
} from "../wasm/artifact_engine"
import wasmUrl from "../wasm/artifact_engine.wasm?url"

let engine: ArtifactEngineClass | null = null

createArtifactEngine({
  locateFile(path: string) {
    if (path.endsWith(".wasm")) {
      return wasmUrl
    }
    return path
  },
})
  .then((module: ArtifactEngineInstance) => {
    engine = new module.ArtifactInterface(BigInt(1337))
    self.postMessage({ type: "READY" })
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    self.postMessage({ type: "ERROR", error: message })
  })

self.onmessage = (e: MessageEvent<any>): void => {
  const data = e.data

  try {
    if (!engine) {
      throw new Error("Artifact engine not initialized yet.")
    }

    if (data.type === "BATCH") {
      engine.setSeed(BigInt(data.seed || Date.now()))
      const resultJson = engine.generateBatchJson(data.count || 1, data.upgrade ?? true)
      self.postMessage({
        type: "BATCH_RESULT",
        success: true,
        data: JSON.parse(resultJson),
      })
      return
    }

    if (data.type === "BATCH_HISTORY") {
      engine.setSeed(BigInt(data.seed || Date.now()))
      const resultJson = engine.generateBatchWithHistoryJson(data.count || 1)
      self.postMessage({
        type: "BATCH_HISTORY_RESULT",
        success: true,
        data: JSON.parse(resultJson),
      })
      return
    }

    // Default simulation fallback
    if (data.configJson) {
      engine.setSeed(BigInt(data.seed || Date.now()))
      const resultJson = engine.runSimulationJson(data.configJson)
      self.postMessage({
        type: "RESULT",
        success: true,
        data: JSON.parse(resultJson),
      })
      return
    }

    throw new Error("Invalid message payload")
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    self.postMessage({
      type: "ERROR",
      success: false,
      error: message,
    })
  }
}