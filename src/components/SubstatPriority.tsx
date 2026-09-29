import { SUBSTAT_NAMES, WEIGHT_PRESETS } from "../constants/artifactData"
import { priorityFrom } from "../utils/scoring"
import type { StateSetter } from "../types/artifact"

interface SubstatPriorityProps {
  priority: number[]
  setPriority: StateSetter<number[]>
}

export function SubstatPriority({ priority, setPriority }: SubstatPriorityProps) {
  const unpicked = Object.keys(SUBSTAT_NAMES).map(Number).filter((id) => !priority.includes(id))

  return (
    <details className="advanced font-genshin">
      <summary 
        className="font-genshin" 
        style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "40px" }}
      >
        <span>Substat Priority</span>
        <span className="hint font-genshin" style={{ fontSize: "0.85em", opacity: 0.7, fontWeight: "normal" }}>
          Select None for Pure Crit Value
        </span>
      </summary>
      <p className="hint font-genshin" style={{ marginBottom: '20px' }}>Pieces are ranked by summing each substat * its weight. Setting a weight to 0 ignores that substat.</p>
      <p className="pick-label font-genshin">Some pre-defined presets</p>
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