import { SUBSTAT_NAMES, WEIGHT_PRESETS } from "../constants/artifactData"
import { priorityFrom } from "../utils/scoring"
import type { StateSetter } from "../types/artifact"

interface SubstatPriorityProps {
  priority: number[]
  setPriority: StateSetter<number[]>
}

export function SubstatPriority({ priority, setPriority }: SubstatPriorityProps) {
  const hasWeights = priority.length > 0
  const unpicked = Object.keys(SUBSTAT_NAMES).map(Number).filter((id) => !priority.includes(id))

  return (
    <details className="advanced font-genshin">
      <summary className="font-genshin">Substat Priority {hasWeights ? "" : "(none set, using Crit Value)"}</summary>
      <p className="hint font-genshin" style={{ marginBottom: '20px' }}>Pieces are ranked by summing each substat * its weight. Setting a weight to 0 ignores that substat.</p>
      <p className="text-sm font-genshin">Some pre-defined presets:</p>
      <div className="chips">
        {WEIGHT_PRESETS.map((p) => (
          <button key={p.label} type="button" className="chip font-genshin" onClick={() => setPriority(priorityFrom(p.weights))}>
            {p.label}
          </button>
        ))}
      </div>
      <p className="pick-label font-genshin">Sort by Affix</p>
      <div className="chips">
        {[...priority, ...unpicked].map((id) => {
          const rank = priority.indexOf(id)
          const picked = rank !== -1
          return (
            <button
              key={id}
              type="button"
              className={`chip font-genshin${picked ? " picked" : ""}`}
              aria-pressed={picked}
              onClick={() => setPriority((prev) => (picked ? prev.filter((s) => s !== id) : [...prev, id]))}
            >
              {picked ? <span className="chip-rank">{rank + 1}</span> : "+"}{" "}
              {SUBSTAT_NAMES[id]}
            </button>
          )
        })}
      </div>
    </details>
  )
}