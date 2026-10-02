import { SLOT_NAMES, MAIN_STAT_NAMES, SUBSTAT_NAMES, FLAT_STATS, AVG_SUBSTAT_ROLL } from "../constants/artifactData"
import { ARTIFACT_DOMAINS } from "../constants/domains"
import { useHuntList } from "../hooks/useHuntList"
import type { HuntListItem } from "../types/artifact"

const SLOT_ICONS: Record<number, string> = {
  0: "/icons/slot/flower.png",
  1: "/icons/slot/feather.png",
  2: "/icons/slot/sands.png",
  3: "/icons/slot/goblet.png",
  4: "/icons/slot/circlet.png",
}

function fmtRollValue(stat: number, rolls: number): string {
  const avg = AVG_SUBSTAT_ROLL[stat]
  if (!avg) return ""
  const value = avg * rolls
  if (FLAT_STATS.has(stat)) return `≈${Math.round(value)}`
  return `≈${value.toFixed(1)}%`
}

export function HuntItemCard({ item }: { item: HuntListItem }) {
  const { openModal, removeItem } = useHuntList()

  const setName = (() => {
    if (!item.setId) return null
    for (const domain of ARTIFACT_DOMAINS) {
      for (const set of domain.sets) {
        if (set.id === item.setId) return set.name
      }
    }
    return null
  })()

  const fallbackIcon = `/icons/artifactset/Gladiator${["Flower", "Feather", "Sands", "Goblet", "Circlet"][item.slot]}.png`
  const artifactIcon = item.setId 
    ? `/icons/artifactset/${item.setId}${item.slot === 0 ? "4" : item.slot === 1 ? "2" : item.slot === 2 ? "5" : item.slot === 3 ? "1" : "3"}.png`
    : fallbackIcon

  return (
    <div
      className="group relative bg-white/[0.04] border border-white/10 rounded-xl p-3.5 cursor-pointer transition-all duration-200 ease-out hover:border-gold/40 hover:bg-gold/[0.04] hover:shadow-[0_4px_16px_rgba(211,163,82,0.1)] hover:scale-[1.02] active:scale-[0.97]"
      onClick={() => openModal(item.id)}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          removeItem(item.id)
        }}
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/5 hover:bg-red-500/20 border border-transparent hover:border-red-500/40 text-muted hover:text-red-400 cursor-pointer transition-all flex items-center justify-center text-[12px] opacity-0 group-hover:opacity-100 z-10"
      >
        ×
      </button>

      {/* Header: slot icon + main stat + artifact icon */}
      <div className="flex items-start justify-between gap-2.5 mb-2.5">
        <div className="flex items-center gap-2.5">
          <img src={SLOT_ICONS[item.slot]} alt="" className="w-7 h-7 object-contain drop-shadow-md opacity-80 shrink-0" />
          <div className="min-w-0">
            <p className="font-genshin text-[12px] font-semibold text-gold truncate">{SLOT_NAMES[item.slot]}</p>
            <p className="font-genshin text-[10.5px] text-muted truncate">{MAIN_STAT_NAMES[item.mainStat]}</p>
          </div>
        </div>
        <img src={artifactIcon} alt="" className="w-10 h-10 object-contain drop-shadow-lg shrink-0 -mt-1 -mr-1 opacity-90" />
      </div>

      {/* Set name if specified */}
      {setName && (
        <p className="font-genshin text-[10px] text-muted/70 mb-2 truncate">⬡ {setName}</p>
      )}

      {/* Substats */}
      {item.substats.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.substats.map((sub) => (
            <span
              key={sub.stat}
              className="font-genshin inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-white/[0.06] border border-white/10 rounded-full text-muted"
            >
              <span className="text-gold font-bold">{sub.minRolls}×</span>
              <span className="truncate">{SUBSTAT_NAMES[sub.stat]}</span>
              <span className="opacity-50">{fmtRollValue(sub.stat, sub.minRolls)}</span>
            </span>
          ))}
        </div>
      )}

      {item.substats.length === 0 && (
        <p className="font-genshin text-[10.5px] text-muted/50 italic">No substat requirements</p>
      )}
    </div>
  )
}
