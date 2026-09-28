import createArtifactEngine, {
  type ArtifactEngineInstance,
  type ArtifactEngineClass,
} from "../wasm/artifact_engine"

let engine: ArtifactEngineClass | null = null

createArtifactEngine({
  locateFile(path: string) {
    if (path.endsWith(".wasm")) {
      return "/artifact_engine.wasm"
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

self.onmessage = (e: MessageEvent<{ configJson: string; seed: number }>): void => {
  const { configJson, seed } = e.data

  try {
    if (!engine) {
      throw new Error("Artifact engine not initialized yet.")
    }
    engine.setSeed(BigInt(seed))

    const resultJson = engine.runSimulationJson(configJson)
    self.postMessage({
      type: "RESULT",
      success: true,
      data: JSON.parse(resultJson) as unknown,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    self.postMessage({
      type: "RESULT",
      success: false,
      error: message,
    })
  }
}