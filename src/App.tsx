import { useState, useEffect, useRef } from "react"
import createArtifactEngine, {
  type ArtifactEngineInstance,
  type ArtifactEngineClass
} from "./wasm/artifact_engine"

interface ArtifactSubstatEntry {
  type: number
  value: number
  rolls: number
}

interface ArtifactOutput {
  slot: number
  level: number
  mainStat: {
    type: number
    value: number
  }
  subStats: ArtifactSubstatEntry[]
  critValue: number
}

interface SimulationResult {
  targetAchieved: boolean
  totalResinSpent: number
  equivalentDays: number
  domainRunsCompleted: number
  strongboxRollsCompleted: number
  totalFiveStarsFound: number
  topArtifacts: ArtifactOutput[]
}

const MAIN_STAT_NAMES: Record<number, string> = {
  0: "Crit DMG",
  1: "Crit Rate",
  2: "Elemental Mastery",
  3: "Energy Recharge",
  4: "ATK%",
  5: "Flat ATK",
  6: "HP%",
  7: "Flat HP",
  8: "DEF%",
  9: "Flat DEF",
  10: "Healing Bonus",
  11: "Pyro DMG",
  12: "Hydro DMG",
  13: "Electro DMG",
  14: "Cryo DMG",
  15: "Anemo DMG",
  16: "Geo DMG",
  17: "Dendro DMG",
  18: "Physical DMG",
}

const SUBSTAT_NAMES: Record<number, string> = {
  0: "Crit DMG",
  1: "Crit Rate",
  2: "Elemental Mastery",
  3: "Energy Recharge",
  4: "ATK%",
  5: "Flat ATK",
  6: "HP%",
  7: "Flat HP",
  8: "DEF%",
  9: "Flat DEF",
}

const SLOT_NAMES = ["Flower", "Feather", "Sands", "Goblet", "Circlet"]

export default function App() {
  const [engineReady, setEngineReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const engineRef = useRef<ArtifactEngineClass | null>(null)

  // Simulation Form State
  const [mode, setMode] = useState<number>(0)
  const [resinBudget, setResinBudget] = useState<number>(2000)
  const [topK, setTopK] = useState<number>(3)
  const [useStrongBox, setUseStrongBox] = useState<boolean>(true)
  const [minCritValue, setMinCritValue] = useState<number>(25.0)

  // Substat Weights
  const [weights, setWeights] = useState<Record<number, number>>({
    0: 1.0, // Crit DMG
    1: 2.0, // Crit Rate
    2: 0.0,
    3: 0.5, // ER%
    4: 0.5, // ATK%
    5: 0.0,
    6: 0.0,
    7: 0.0,
    8: 0.0,
    9: 0.0,
  })

  useEffect(() => {
    let isMounted = true

    createArtifactEngine()
      .then((module: ArtifactEngineInstance) => {
        if (isMounted) {
          engineRef.current = new module.ArtifactInterface(BigInt(Date.now()))
          setEngineReady(true)
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load Wasm artifact engine:", err)
      })

    return () => {
      isMounted = false
      if (engineRef.current) {
        engineRef.current.delete()
      }
    }
  }, [])

  const handleWeightChange = (statId: number, val: string) => {
    const parsed = parseFloat(val)
    setWeights((prev) => ({
      ...prev,
      [statId]: isNaN(parsed) ? 0 : parsed,
    }))
  }

  const runSimulation = () => {
    const engine = engineRef.current
    if (!engine) return

    setLoading(true)

    setTimeout(() => {
      try {
        const substatWeights = Object.entries(weights)
          .map(([stat, weight]) => ({ stat: Number(stat), weight }))
          .filter((w) => w.weight > 0)

        const payload = JSON.stringify({
          mode,
          resinBudget,
          topK,
          useStrongBox,
          minCritValue,
          substatWeights,
        })

        const startTime = performance.now()
        const rawJson: string = engine.runSimulationJson(payload)
        const parsed: SimulationResult = JSON.parse(rawJson)
        const duration = performance.now() - startTime

        setElapsedMs(duration)
        setResult(parsed)
      } catch (err) {
        console.error("Simulation run error:", err)
      } finally {
        setLoading(false)
      }
    }, 10)
  }

  return (
    <div style={{ maxWidth: "880px", margin: "40px auto", padding: "0 20px", fontFamily: "system-ui, -apple-system, sans-serif", color: "#111", background: "#fff" }}>
      <header style={{ borderBottom: "1px solid #ccc", paddingBottom: "16px", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", margin: "0 0 8px 0" }}>Genshin Artifact Simulation Engine</h1>
        <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>
          Engine Status: <strong>{engineReady ? "Ready (Wasm loaded)" : "Initializing Wasm..."}</strong>
        </p>
      </header>

      {/* Configuration Section */}
      <section style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "20px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", marginTop: 0, marginBottom: "16px" }}>Simulation Settings</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(Number(e.target.value))}
              style={{ width: "100%", padding: "6px 8px", border: "1px solid #aaa", borderRadius: "3px" }}
            >
              <option value={0}>Fixed Resin</option>
              <option value={1}>Target Goal</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>
              {mode === 0 ? "Resin Budget" : "Max Resin Limit"}
            </label>
            <input
              type="number"
              step={20}
              min={20}
              value={resinBudget}
              onChange={(e) => setResinBudget(Math.max(20, Number(e.target.value)))}
              style={{ width: "100%", padding: "6px 8px", border: "1px solid #aaa", borderRadius: "3px", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>Keep Top N Pieces</label>
            <input
              type="number"
              min={1}
              max={50}
              value={topK}
              onChange={(e) => setTopK(Math.max(1, Number(e.target.value)))}
              style={{ width: "100%", padding: "6px 8px", border: "1px solid #aaa", borderRadius: "3px", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>Target Min CV</label>
            <input
              type="number"
              step={0.5}
              min={0}
              value={minCritValue}
              onChange={(e) => setMinCritValue(Number(e.target.value))}
              style={{ width: "100%", padding: "6px 8px", border: "1px solid #aaa", borderRadius: "3px", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={useStrongBox}
              onChange={(e) => setUseStrongBox(e.target.checked)}
            />
            Recycle non-matching 5★ pieces via Strongbox (3-for-1 reroll)
          </label>
        </div>

        <fieldset style={{ border: "1px solid #ddd", borderRadius: "4px", padding: "12px", marginBottom: "20px" }}>
          <legend style={{ fontSize: "13px", fontWeight: "bold", padding: "0 6px" }}>Substat Scoring Weights (0 to ignore)</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
            {Object.entries(SUBSTAT_NAMES).map(([idStr, name]) => {
              const id = Number(idStr)
              return (
                <div key={id}>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "2px" }}>{name}</label>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    value={weights[id]}
                    onChange={(e) => handleWeightChange(id, e.target.value)}
                    style={{ width: "100%", padding: "4px 6px", border: "1px solid #bbb", borderRadius: "3px", boxSizing: "border-box" }}
                  />
                </div>
              )
            })}
          </div>
        </fieldset>

        <button
          onClick={runSimulation}
          disabled={!engineReady || loading}
          style={{
            padding: "8px 20px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: engineReady && !loading ? "pointer" : "not-allowed",
            background: "#f0f0f0",
            border: "1px solid #888",
            borderRadius: "3px",
          }}
        >
          {loading ? "Running simulation..." : "Execute Simulation"}
        </button>
      </section>

      {/* Results Section */}
      {result && (
        <section style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "12px", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", margin: 0 }}>Results</h2>
            <span style={{ fontSize: "13px", padding: "2px 8px", border: "1px solid #999", borderRadius: "3px" }}>
              {result.targetAchieved ? "Goal Reached" : "Budget Exhausted"}
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px", fontSize: "14px" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px 0", color: "#555" }}>Resin Spent:</td>
                <td style={{ padding: "8px 0", fontWeight: "bold" }}>{result.totalResinSpent}</td>
                <td style={{ padding: "8px 0", color: "#555" }}>Days Equivalent:</td>
                <td style={{ padding: "8px 0", fontWeight: "bold" }}>{result.equivalentDays.toFixed(1)} days</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px 0", color: "#555" }}>5★ Pieces Found:</td>
                <td style={{ padding: "8px 0", fontWeight: "bold" }}>{result.totalFiveStarsFound}</td>
                <td style={{ padding: "8px 0", color: "#555" }}>Strongbox Rerolls:</td>
                <td style={{ padding: "8px 0", fontWeight: "bold" }}>{result.strongboxRollsCompleted}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", color: "#555" }}>Compute Time:</td>
                <td colSpan={3} style={{ padding: "8px 0", fontWeight: "bold" }}>
                  {elapsedMs !== null
                    ? elapsedMs < 1000
                      ? `${elapsedMs.toFixed(2)} ms`
                      : `${(elapsedMs / 1000).toFixed(2)} s`
                    : "--"}
                </td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>Saved Artifacts ({result.topArtifacts.length})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
            {result.topArtifacts.map((art, idx) => (
              <div key={idx} style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "12px", background: "#fafafa" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "bold" }}>
                  <span>{SLOT_NAMES[art.slot] ?? "Piece"}</span>
                  <span>+{art.level}</span>
                </div>
                <div style={{ fontSize: "13px", borderBottom: "1px solid #eee", paddingBottom: "6px", marginBottom: "6px" }}>
                  Main: {MAIN_STAT_NAMES[art.mainStat.type] ?? art.mainStat.type} (+{art.mainStat.value.toFixed(1)})
                </div>
                <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
                  {art.subStats.map((sub, sIdx) => (
                    <div key={sIdx} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{SUBSTAT_NAMES[sub.type] ?? sub.type}</span>
                      <span>+{sub.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "8px", paddingTop: "6px", borderTop: "1px solid #eee", fontSize: "13px", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
                  <span>Crit Value:</span>
                  <span>{art.critValue.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}