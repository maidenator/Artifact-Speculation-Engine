import { useState, useEffect, useRef, type ReactNode } from "react"
import SimulationWorker from "./workers/simulation.worker?worker"
interface ArtifactSubstatEntry { type: number; value: number; rolls: number }

interface ArtifactOutput {
  slot: number
  level: number
  mainStat: { type: number; value: number }
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

interface WorkerMessageData {
  type: "READY" | "ERROR" | "RESULT"
  success?: boolean
  data?: SimulationResult
  error?: string
}

export const Stat = {
  CritDMG: 0,
  CritRate: 1,
  ElementalMastery: 2,
  EnergyRecharge: 3,
  AtkPercent: 4,
  FlatAtk: 5,
  HpPercent: 6,
  FlatHp: 7,
  DefPercent: 8,
  FlatDef: 9,
  HealingBonus: 10,
  PyroDMG: 11,
  HydroDMG: 12,
  ElectroDMG: 13,
  CryoDMG: 14,
  AnemoDMG: 15,
  GeoDMG: 16,
  DendroDMG: 17,
  PhysicalDMG: 18,
} as const;

export type StatId = (typeof Stat)[keyof typeof Stat];

export const Slot = {
  Flower: 0,
  Feather: 1,
  Sands: 2,
  Goblet: 3,
  Circlet: 4,
} as const;

export type SlotId = (typeof Slot)[keyof typeof Slot];

export const MAIN_STAT_NAMES: Record<number, string> = {
  [Stat.CritDMG]: "Crit DMG",
  [Stat.CritRate]: "Crit Rate",
  [Stat.ElementalMastery]: "Elemental Mastery",
  [Stat.EnergyRecharge]: "Energy Recharge",
  [Stat.AtkPercent]: "ATK%",
  [Stat.FlatAtk]: "Flat ATK",
  [Stat.HpPercent]: "HP%",
  [Stat.FlatHp]: "Flat HP",
  [Stat.DefPercent]: "DEF%",
  [Stat.FlatDef]: "Flat DEF",
  [Stat.HealingBonus]: "Healing Bonus",
  [Stat.PyroDMG]: "Pyro DMG",
  [Stat.HydroDMG]: "Hydro DMG",
  [Stat.ElectroDMG]: "Electro DMG",
  [Stat.CryoDMG]: "Cryo DMG",
  [Stat.AnemoDMG]: "Anemo DMG",
  [Stat.GeoDMG]: "Geo DMG",
  [Stat.DendroDMG]: "Dendro DMG",
  [Stat.PhysicalDMG]: "Physical DMG",
};

export const SUBSTAT_NAMES: Record<number, string> = {
  [Stat.CritDMG]: "Crit DMG",
  [Stat.CritRate]: "Crit Rate",
  [Stat.ElementalMastery]: "Elemental Mastery",
  [Stat.EnergyRecharge]: "Energy Recharge",
  [Stat.AtkPercent]: "ATK%",
  [Stat.FlatAtk]: "Flat ATK",
  [Stat.HpPercent]: "HP%",
  [Stat.FlatHp]: "Flat HP",
  [Stat.DefPercent]: "DEF%",
  [Stat.FlatDef]: "Flat DEF",
};

export const SLOT_NAMES = ["Flower", "Feather", "Sands", "Goblet", "Circlet"];

export const SLOT_MAIN_STATS: Record<number, number[]> = {
  [Slot.Flower]: [
    Stat.FlatHp,
  ],
  [Slot.Feather]: [
    Stat.FlatAtk,
  ],
  [Slot.Sands]: [
    Stat.HpPercent,
    Stat.AtkPercent,
    Stat.DefPercent,
    Stat.EnergyRecharge,
    Stat.ElementalMastery,
  ],
  [Slot.Goblet]: [
    Stat.HpPercent,
    Stat.AtkPercent,
    Stat.DefPercent,
    Stat.PyroDMG,
    Stat.HydroDMG,
    Stat.ElectroDMG,
    Stat.CryoDMG,
    Stat.AnemoDMG,
    Stat.GeoDMG,
    Stat.DendroDMG,
    Stat.PhysicalDMG,
    Stat.ElementalMastery,
  ],
  [Slot.Circlet]: [
    Stat.HpPercent,
    Stat.AtkPercent,
    Stat.DefPercent,
    Stat.CritRate,
    Stat.CritDMG,
    Stat.HealingBonus,
    Stat.ElementalMastery,
  ],
};

// Stats shown without a % sign
const FLAT_STATS = new Set([2, 5, 7, 9])

const RESIN_PER_RUN = 20
const RESIN_PER_DAY = 180
const RESIN_SHORTCUTS = [
  { label: "1 week", resin: RESIN_PER_DAY * 7 },
  { label: "1 month", resin: RESIN_PER_DAY * 30 },
  { label: "3 months", resin: RESIN_PER_DAY * 90 },
]

const WEIGHT_PRESETS: { label: string; weights: Record<number, number> }[] = [
  {
    label: "Crit Value",
    weights: {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
    },
  },
  {
    label: "Crit + ATK%",
    weights: {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
      [Stat.AtkPercent]: 0.5,
    },
  },
  {
    label: "Crit + ER%",
    weights: {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
      [Stat.EnergyRecharge]: 0.5,
    },
  },
  {
    label: "Crit + EM",
    weights: {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
      [Stat.ElementalMastery]: 0.5,
    },
  },
  {
    label: "Crit + HP%",
    weights: {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
      [Stat.HpPercent]: 0.5,
    },
  },
  {
    label: "Crit + DEF%",
    weights: {
      [Stat.CritDMG]: 1,
      [Stat.CritRate]: 1,
      [Stat.DefPercent]: 0.5,
    },
  },
];

const weightsFrom = (partial: Record<number, number>) =>
  Object.fromEntries(Object.keys(SUBSTAT_NAMES).map((id) => [id, partial[Number(id)] ?? 0])) as Record<number, number>

const fmtStat = (id: number, value: number) =>
  FLAT_STATS.has(id) ? `+${Math.round(value).toLocaleString()}` : `+${value.toFixed(1)}%`

const fmtDays = (days: number) =>
  days < 1 ? "under a day" : days < 10 ? `${days.toFixed(1)} days` : `${Math.round(days).toLocaleString()} days`

const fmtTime = (ms: number) => (ms < 1000 ? `${ms.toFixed(0)} ms` : `${(ms / 1000).toFixed(2)} s`)

const cvTier = (cv: number) => (cv > 50 ? "cv-max" : cv >= 40 ? "cv-top" : cv >= 30 ? "cv-high" : cv >= 20 ? "cv-mid" : "cv-low")

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

export default function App() {
  const [engineReady, setEngineReady] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [ranMode, setRanMode] = useState(0)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const workersRef = useRef<Worker[]>([])

  const [mode, setMode] = useState(0)
  const [resinBudget, setResinBudget] = useState(2000)
  const [topK, setTopK] = useState(3)
  const [useStrongBox, setUseStrongBox] = useState(true)
  const [minCritValue, setMinCritValue] = useState(25)
  const [targetSlot, setTargetSlot] = useState<number | "">("")
  const [targetMainStat, setTargetMainStat] = useState<number | "">("")
  const [weights, setWeights] = useState<Record<number, number>>(weightsFrom(WEIGHT_PRESETS[0].weights))

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

  const runs = Math.floor(resinBudget / RESIN_PER_RUN)
  const mainStatOptions = targetSlot === "" ? Object.keys(MAIN_STAT_NAMES).map(Number) : SLOT_MAIN_STATS[targetSlot]
  const canRun = engineReady && !loading && resinBudget >= RESIN_PER_RUN

  const changeSlot = (value: string) => {
    const slot = value === "" ? "" : Number(value)
    setTargetSlot(slot)
    if (slot !== "" && targetMainStat !== "" && !SLOT_MAIN_STATS[slot].includes(targetMainStat)) setTargetMainStat("")
  }

  const scoreArtifact = (art: ArtifactOutput, substatWeights: { stat: number; weight: number }[]) => {
    if (substatWeights.length === 0) return art.critValue
    let total = 0
    for (const sub of art.subStats) {
      const match = substatWeights.find((w) => w.stat === sub.type)
      if (match) total += sub.value * match.weight
    }
    return total
  }

  const runSimulation = async () => {
    if (!canRun || workersRef.current.length === 0) return
    setLoading(true)
    setRunError(null)

    const substatWeights = Object.entries(weights)
      .map(([stat, weight]) => ({ stat: Number(stat), weight }))
      .filter((w) => w.weight > 0)

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
          ...(mode === 1 && targetSlot !== "" ? { targetSlot } : {}),
          ...(mode === 1 && targetMainStat !== "" ? { targetMainStat } : {}),
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
      setResult(aggregated)
    } catch (err: unknown) {
      console.error("Simulation run error:", err)
      setRunError("The simulation hit an error across worker threads.")
    } finally {
      setLoading(false)
    }
  }

  const resetSettings = () => {
    setMode(0); setResinBudget(2000); setTopK(3); setUseStrongBox(true); setMinCritValue(25)
    setTargetSlot(""); setTargetMainStat(""); setWeights(weightsFrom(WEIGHT_PRESETS[0].weights))
  }

  const hasWeights = Object.values(weights).some((w) => w > 0)

  return (
    <div className="app">
      <style>{CSS}</style>

      <header>
        <h1 className="font-genshin font-bold text-3xl">Artifact Speculation Engine</h1>
        <p className="lede">Simulate resin spending and see what you'd realistically get</p>
        <p className={`status ${engineError ? "bad" : engineReady ? "ok" : ""}`} role="status">
          <span className="dot" />
          {engineError ?? (engineReady ? "Engine ready" : "Loading engine...")}
        </p>
      </header>

      <section className="card">  
        <h2 className="font-genshin font-bold text-3xl">Resin Config</h2>
        <div className="grid">
          <Field id="mode" label="How should the simulator spend resin?" hint={mode === 0 ? "Spend the whole budget and show the best pieces." : "Keep farming until a piece meets your goal or the budget runs out."}>
            <select id="mode" value={mode} onChange={(e) => setMode(Number(e.target.value))}>
              <option value={0}>Set resin budget</option>
              <option value={1}>Target specific artifact</option>
            </select>
          </Field>

          <Field id="resin" label={mode === 0 ? "Resin to spend" : "Maximum Resin to spend"} hint={`${runs.toLocaleString()} domain runs, about ${fmtDays(resinBudget / RESIN_PER_DAY)} of resin at ${RESIN_PER_DAY}/day`}>
            <input
              id="resin" type="number" inputMode="numeric" min={RESIN_PER_RUN} step={RESIN_PER_RUN}
              value={resinBudget || ""}
              onChange={(e) => setResinBudget(Number(e.target.value))}
              onBlur={() => setResinBudget((prev) => Math.max(RESIN_PER_RUN, Math.floor(prev / RESIN_PER_RUN) * RESIN_PER_RUN))}
            />
            <div className="chips">
              {RESIN_SHORTCUTS.map((s) => (
                <button key={s.label} type="button" className="chip" onClick={() => setResinBudget(s.resin)}>{s.label}</button>
              ))}
            </div>
          </Field>
        </div>
        <label className="check">
          <input type="checkbox" checked={useStrongBox} onChange={(e) => setUseStrongBox(e.target.checked)} />
          <span>
            Use Strongbox?
            <small>Turns 3 unwanted pieces into 1 extra Artifact</small>
          </span>
        </label>
      </section>

      <section className="card">
        <h2 className="font-genshin font-bold text-3xl">Speculator Config</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field id="topk" label="How Many Pieces to Keep?" hint="The best pieces by score are shown after the run.">
            <input
              id="topk"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={topK || ""}
              onChange={(e) => setTopK(Number(e.target.value))}
              onBlur={() => setTopK((prev) => Math.min(50, Math.max(1, Math.round(prev))))}
            />
          </Field>

          {mode === 1 && (
            <>
              <Field id="mincv" label="Minimum Crit Value" hint="Crit Value = Crit DMG + 2 * Crit Rate.">
                <input
                  id="mincv"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.5}
                  value={minCritValue}
                  onChange={(e) => setMinCritValue(Number(e.target.value))}
                />
              </Field>

              <Field id="slot" label="Piece type">
                <select id="slot" value={targetSlot} onChange={(e) => changeSlot(e.target.value)}>
                  <option value="">Any piece</option>
                  {SLOT_NAMES.map((name, i) => (
                    <option key={name} value={i}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="mainstat" label="Main stat">
                <select
                  id="mainstat"
                  value={targetMainStat}
                  onChange={(e) => setTargetMainStat(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">Any main stat</option>
                  {mainStatOptions.map((id) => (
                    <option key={id} value={id}>
                      {MAIN_STAT_NAMES[id]}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
        </div>

        <details className="advanced">
          <summary>Substat Priority {hasWeights ? "" : "(none set, using Crit Value)"}</summary>
          <p className="hint" style={{ marginBottom: '20px' }}>Pieces are ranked by summing each substat * its weight. Setting a weight to 0 to ignores that substat.</p>
          <p className="text-sm">Some pre-defined presets:</p>
          <div className="chips">
            
            {WEIGHT_PRESETS.map((p) => (
              <button key={p.label} type="button" className="chip" onClick={() => setWeights(weightsFrom(p.weights))}>{p.label}</button>
            ))}
          </div>
          <div className="weights">
            {Object.entries(SUBSTAT_NAMES).map(([idStr, name]) => {
              const id = Number(idStr)
              return (
                <Field key={id} id={`w${id}`} label={name}>
                  <input id={`w${id}`} type="number" inputMode="decimal" min={0} step={0.1} value={weights[id]}
                    onChange={(e) => setWeights((prev) => ({ ...prev, [id]: Math.max(0, Number(e.target.value) || 0) }))} />
                </Field>
              )
            })}
          </div>
        </details>
      </section>

      <div className="actions">
        <button className="primary" onClick={runSimulation} disabled={!canRun}>
          {loading ? "Running..." : "Run simulation"}
        </button>
        <button className="ghost" onClick={resetSettings} disabled={loading}>Reset settings</button>
        {!engineReady && !engineError && <span className="hint">Waiting for the engine to load</span>}
      </div>

      {runError && <p className="error" role="alert">{runError}</p>}

      {result && (
        <section className="card results" aria-live="polite">
          <div className="results-head">
            <h2>Results</h2>
            {ranMode === 1 && (
              <span className={`badge ${result.targetAchieved ? "ok" : "bad"}`}>
                {result.targetAchieved ? "Goal reached" : "Goal not reached within budget"}
              </span>
            )}
          </div>

          <p className="summary">
            Spending {result.totalResinSpent.toLocaleString()} resin (about {fmtDays(result.equivalentDays)}) got you{" "}
            <strong>{result.totalFiveStarsFound.toLocaleString()} five-star pieces</strong>.
          </p>

          <dl className="stats">
            <div><dt>Domain runs</dt><dd>{result.domainRunsCompleted.toLocaleString()}</dd></div>
            <div><dt>Strongbox rolls</dt><dd>{result.strongboxRollsCompleted.toLocaleString()}</dd></div>
            <div><dt>Run time</dt><dd>{elapsedMs !== null ? fmtTime(elapsedMs) : "-"}</dd></div>
          </dl>

          <h3>Best pieces ({result.topArtifacts.length})</h3>
          {result.topArtifacts.length === 0 ? (
            <p className="hint">No pieces matched. Try more resin or a lower minimum Crit Value.</p>
          ) : (
            <div className="artifacts">
              {result.topArtifacts.map((art, idx) => (
                <article key={idx} className={`artifact card-${cvTier(art.critValue)}`}>
                  <header>
                    <span className="rank">#{idx + 1}</span>
                    <strong>{SLOT_NAMES[art.slot] ?? "Piece"}</strong>
                    <span className="level">+{art.level}</span>
                  </header>
                  <p className="main">
                    <span>{MAIN_STAT_NAMES[art.mainStat.type] ?? art.mainStat.type}</span>
                    <strong>{fmtStat(art.mainStat.type, art.mainStat.value)}</strong>
                  </p>
                  <ul>
                    {art.subStats.map((sub, i) => (
                      <li key={i}>
                        <span>{SUBSTAT_NAMES[sub.type] ?? sub.type}<i title={`${sub.rolls} rolls`}>{" " + "•".repeat(Math.min(sub.rolls, 6))}</i></span>
                        <span>{fmtStat(sub.type, sub.value)}</span>
                      </li>
                    ))}
                  </ul>
                  <footer className={cvTier(art.critValue)}>
                    <span>Crit Value</span>
                    <strong>{art.critValue.toFixed(1)}</strong>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

const CSS = `
:root{color-scheme:light dark;--page:#eceff3;--card:#fff;--ink:#181b21;--muted:#5d6572;--line:#d9dee5;--accent:#0f766e;--on-accent:#fff;--ok:#15803d;--bad:#b42318;--gold:#b7791f}
@media(prefers-color-scheme:dark){:root{--page:#111418;--card:#1b1f26;--ink:#e8eaee;--muted:#98a1ae;--line:#2c333d;--accent:#2dd4bf;--on-accent:#06201d;--ok:#4ade80;--bad:#f87171;--gold:#fbbf24}}
html,body{margin:0;background:var(--page);color:var(--ink)}
.app{max-width:900px;margin:0 auto;padding:36px 20px 72px;min-height:100vh;box-sizing:border-box;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.app *{box-sizing:border-box}
.app h1{font-size:28px;line-height:1.2;margin:0 0 6px}
.app h2{font-size:18px;margin:0 0 14px}
.app h3{font-size:16px;margin:22px 0 10px}
.lede{margin:0 0 10px;color:var(--muted);max-width:60ch}
.status{display:inline-flex;align-items:center;gap:8px;margin:0 0 22px;font-size:13px;color:var(--muted)}
.dot{width:8px;height:8px;border-radius:50%;background:var(--muted)}
.status.ok .dot{background:var(--ok)}.status.bad{color:var(--bad)}.status.bad .dot{background:var(--bad)}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:20px;margin-bottom:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px;margin-bottom:6px}
.field label{display:block;font-size:13px;font-weight:600;margin-bottom:5px}
.app input[type=number],.app select{width:100%;padding:8px 10px;font:inherit;color:inherit;background:var(--card);border:1px solid var(--line);border-radius:6px}
.app input:focus-visible,.app select:focus-visible,.app button:focus-visible,.app summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.hint{margin:5px 0 0;font-size:12.5px;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.chip{padding:3px 10px;font:inherit;font-size:12.5px;color:inherit;background:transparent;border:1px solid var(--line);border-radius:999px;cursor:pointer}
.chip:hover{border-color:var(--accent);color:var(--accent)}
.check{display:flex;gap:10px;align-items:flex-start;margin-top:14px;cursor:pointer}
.check input{margin-top:4px}.check small{display:block;color:var(--muted);font-size:12.5px}
.advanced{margin-top:16px;border-top:1px solid var(--line);padding-top:12px}
.advanced summary{cursor:pointer;font-weight:600;font-size:14px}
.weights{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-top:14px}
.actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:4px 0 20px}
.primary{padding:10px 26px;font:inherit;font-weight:600;color:var(--on-accent);background:var(--accent);border:0;border-radius:6px;cursor:pointer}
.ghost{padding:10px 14px;font:inherit;color:var(--muted);background:transparent;border:0;cursor:pointer}
.app button:disabled{opacity:.5;cursor:not-allowed}
.error{padding:10px 14px;margin:0 0 16px;color:var(--bad);border:1px solid var(--bad);border-radius:6px}
.results-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.results-head h2{margin:0}
.badge{font-size:13px;font-weight:600;padding:2px 10px;border:1px solid currentColor;border-radius:999px}
.badge.ok{color:var(--ok)}.badge.bad{color:var(--bad)}
.summary{margin:12px 0 16px;font-size:16px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:0}
.stats div{padding:10px 12px;border:1px solid var(--line);border-radius:8px}
.stats dt{font-size:12.5px;color:var(--muted)}.stats dd{margin:0;font-size:20px;font-weight:650}
.artifacts{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.artifact{border:1px solid var(--line);border-top:3px solid var(--gold);border-radius:8px;padding:12px 14px}
.artifact header{display:flex;align-items:baseline;gap:8px;margin-bottom:8px}
.rank{font-size:12.5px;color:var(--muted)}.level{margin-left:auto;color:var(--gold);font-weight:650}
.main{display:flex;justify-content:space-between;margin:0 0 8px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.artifact ul{list-style:none;margin:0;padding:0;font-size:13.5px}
.artifact li{display:flex;justify-content:space-between;padding:1px 0}
.artifact li i{font-style:normal;color:var(--gold);letter-spacing:1px}
.artifact footer{display:flex;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px solid var(--line)}
.cv-max strong{color:var(--bad)}
.artifact.card-cv-max{border-color:var(--bad)}
.artifact.card-cv-top{border-color:var(--gold)}
.artifact.card-cv-high{border-color:var(--ok)}
.artifact.card-cv-mid{border-color:var(--muted)}
.artifact.card-cv-low{border-color:var(--line)}
.cv-top strong{color:var(--gold)}.cv-high strong{color:var(--ok)}.cv-low strong{color:var(--muted)}
`