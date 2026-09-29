import { Field } from "./Field"
import { RESIN_PER_DAY, RESIN_PER_RUN, RESIN_SHORTCUTS } from "../constants/resin"
import { fmtDays } from "../utils/format"
import type { StateSetter } from "../types/artifact"

interface ResinConfigProps {
  mode: number
  resinBudget: number
  useStrongBox: boolean
  setMode: StateSetter<number>
  setResinBudget: StateSetter<number>
  setUseStrongBox: StateSetter<boolean>
}

export function ResinConfig({
  mode,
  resinBudget,
  useStrongBox,
  setMode,
  setResinBudget,
  setUseStrongBox,
}: ResinConfigProps) {
  const runs = Math.floor(resinBudget / RESIN_PER_RUN)

  return (
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
  )
}