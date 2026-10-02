import { SUBSTAT_NAMES, WEIGHT_PRESETS } from "../constants/artifactData"
import { priorityFrom } from "../utils/scoring"
interface SubstatPriorityProps {
  priority: number[]
  setPriority: (priority: number[]) => void
}

export function SubstatPriority({ priority, setPriority }: SubstatPriorityProps) {
  const unpicked = Object.keys(SUBSTAT_NAMES).map(Number).filter((id) => !priority.includes(id))

  return (
    <details className="font-genshin mt-6 border-none" open>
      <summary 
        className="font-genshin flex justify-between items-center mb-3 list-none [&::-webkit-details-marker]:hidden cursor-default" 
        onClick={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-[17.6px]">Substat Priority</span>
          <span className="font-genshin mt-[5px] text-[12.5px] text-muted tracking-[0.3px] opacity-70 font-normal">
            Select None for Pure Crit Value
          </span>
        </div>
      </summary>

      <p className="font-genshin mt-4 text-[13px] text-muted">Some pre-defined presets</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {WEIGHT_PRESETS.map((p) => (
          <button key={p.label} type="button" className="font-genshin px-3 py-1 text-[12.5px] text-muted bg-white/5 border border-line rounded-2xl cursor-pointer transition-all duration-200 ease-out hover:border-gold hover:text-gold hover:scale-105 active:scale-95" onClick={() => setPriority(priorityFrom(p.weights))}>
            {p.label}
          </button>
        ))}
      </div>
      <p className="font-genshin mt-4 text-[13px] text-muted">Sort by Affix</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {[...priority, ...unpicked].map((id) => {
          const rank = priority.indexOf(id)
          const picked = rank !== -1
          return (
            <button
              key={id}
              type="button"
              className={`font-genshin px-3 py-1 text-[12.5px] border rounded-2xl cursor-pointer transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${picked ? "border-gold text-gold bg-[#e4b76a]/15" : "text-muted bg-white/5 border-line hover:border-gold hover:text-gold"}`}
              aria-pressed={picked}
              onClick={() => setPriority(picked ? priority.filter((s) => s !== id) : [...priority, id])}
            >
              {picked ? <span className="w-5 h-5 rounded-full bg-gold text-page inline-flex items-center justify-center leading-none pt-0.5">{rank + 1}</span> : "+"}{" "}
              {SUBSTAT_NAMES[id]}
            </button>
          )
        })}
      </div>
    </details>
  )
}