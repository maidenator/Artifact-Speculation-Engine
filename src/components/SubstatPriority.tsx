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
    <details className="advanced font-genshin" open style={{ borderTop: "none", marginTop: "24px" }}>
      <style>{`
        details.advanced summary::-webkit-details-marker { display: none; }
        details.advanced summary { list-style: none; }
        .substat-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .substat-summary .arrow-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          transform-origin: center center;
          transition: transform 0.2s ease;
        }
        details.advanced[open] .substat-summary .arrow-box {
          transform: rotate(180deg);
        }
      `}</style>
      
      {/* 2. Added onClick preventDefault and default cursor so it can no longer be closed */}
      <summary 
        className="font-genshin substat-summary" 
        onClick={(e) => e.preventDefault()}
        style={{ cursor: "default" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>Substat Priority</span>
          <span className="hint font-genshin" style={{ fontSize: "0.85em", opacity: 0.7, fontWeight: "normal" }}>
            Select None for Pure Crit Value
          </span>
        </div>
      </summary>

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