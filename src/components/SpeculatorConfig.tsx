import { Field } from "./Field"
import { SubstatPriority } from "./SubstatPriority"
import { MAIN_STAT_NAMES, SLOT_MAIN_STATS, SLOT_NAMES } from "../constants/artifactData"
import type { StateSetter } from "../types/artifact"

interface SpeculatorConfigProps {
  mode: number
  topK: number
  minCritValue: number
  targetSlot: number | ""
  targetMainStat: number | ""
  priority: number[]
  setTopK: StateSetter<number>
  setMinCritValue: StateSetter<number>
  setTargetMainStat: StateSetter<number | "">
  setPriority: StateSetter<number[]>
  onSlotChange: (value: string) => void
}

export function SpeculatorConfig({
  mode,
  topK,
  minCritValue,
  targetSlot,
  targetMainStat,
  priority,
  setTopK,
  setMinCritValue,
  setTargetMainStat,
  setPriority,
  onSlotChange,
}: SpeculatorConfigProps) {
  const mainStatOptions = targetSlot === "" ? Object.keys(MAIN_STAT_NAMES).map(Number) : SLOT_MAIN_STATS[targetSlot]

  return (
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
              <select id="slot" value={targetSlot} onChange={(e) => onSlotChange(e.target.value)}>
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

      <SubstatPriority priority={priority} setPriority={setPriority} />
    </section>
  )
}