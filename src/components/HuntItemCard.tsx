import { SLOT_NAMES, MAIN_STAT_NAMES, SUBSTAT_NAMES, FLAT_STATS, AVG_SUBSTAT_ROLL } from "../constants/artifactData"
import { ARTIFACT_DOMAINS } from "../constants/domains"
import { useHuntList } from "../hooks/useHuntList"
import type { HuntListItem } from "../types/artifact"
import { SplitDomainIcon, DomainSetIcon } from "./DomainSelect"

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
  const { openModal, removeItem, updateItem } = useHuntList()

  const domain = item.domainId ? ARTIFACT_DOMAINS.find((d) => d.id === item.domainId) : null

  let setEnkaId: number | undefined
  const setName = (() => {
    if (!item.setId) {
      return domain ? `${domain.name} (Any)` : null
    }
    for (const d of ARTIFACT_DOMAINS) {
      for (const set of d.sets) {
        if (set.id === item.setId) {
          setEnkaId = set.enkaId
          return set.name
        }
      }
    }
    return null
  })()

  return (
    <div
      className="group relative bg-white/[0.04] border border-white/10 rounded-xl p-3.5 cursor-pointer transition-all duration-200 ease-out hover:border-gold/40 hover:bg-gold/[0.04] hover:shadow-[0_4px_16px_rgba(211,163,82,0.1)] hover:scale-[1.02] active:scale-[0.97] flex items-center gap-3 overflow-hidden"
      onClick={() => openModal(item.id)}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          removeItem(item.id)
        }}
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/5 hover:bg-red-500/20 border border-transparent hover:border-red-500/40 text-muted hover:text-red-400 cursor-pointer transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      {/* Main Content (Left Side) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Header: slot icon + main stat */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <img src={SLOT_ICONS[item.slot]} alt="" className="w-7 h-7 object-contain drop-shadow-md opacity-80 shrink-0" />
          <div className="min-w-0">
            <p className="font-genshin text-[12px] font-semibold text-gold truncate">{SLOT_NAMES[item.slot]}</p>
            <p className="font-genshin text-[10.5px] text-muted truncate">{MAIN_STAT_NAMES[item.mainStat]}</p>
          </div>
        </div>

        {/* Set name if specified */}
        {setName && (
          <p className="font-genshin text-[10px] text-muted/70 mb-2 truncate">⬡ {setName}</p>
        )}

        {/* Substats */}
        {item.substats.length > 0 && (
          <div className="flex flex-wrap gap-1 relative z-20">
            {item.substats.map((sub) => (
              <div
                key={sub.stat}
                className="group/substat font-genshin inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-[10px] bg-white/[0.06] border border-white/10 rounded-full text-muted cursor-default transition-colors hover:border-red-500/20 hover:bg-red-500/5"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-gold font-bold">{sub.minRolls}×</span>
                <span className="truncate">{SUBSTAT_NAMES[sub.stat]}</span>
                <span className="opacity-50">{fmtRollValue(sub.stat, sub.minRolls)}</span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    updateItem(item.id, {
                      ...item,
                      substats: item.substats.filter((s) => s.stat !== sub.stat)
                    })
                  }}
                  className="w-4 h-4 ml-0.5 rounded-full bg-transparent hover:bg-red-500/20 border border-transparent hover:border-red-500/40 text-red-400 cursor-pointer transition-all flex items-center justify-center opacity-0 group-hover/substat:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {item.substats.length === 0 && (
          <p className="font-genshin text-[10.5px] text-muted/50 italic m-0">No substat requirements</p>
        )}
      </div>

      {/* Artifact Image (Right Side, Centered & Larger) */}
      <div className="shrink-0 flex items-center justify-center mr-2 w-16 h-16 transition-transform duration-200 group-hover:scale-110">
        {!item.setId && domain ? (
          <SplitDomainIcon domain={domain} slot={item.slot} className="w-[60px] h-[45px]" iconClassName="w-[45px] h-[45px]" />
        ) : (
          <DomainSetIcon enkaId={setEnkaId} fallbackName={setName || "Artifact"} className="w-16 h-16 object-contain opacity-90" slot={item.slot} />
        )}
      </div>
    </div>
  )
}
