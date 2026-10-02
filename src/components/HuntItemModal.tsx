import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { SLOT_NAMES, SLOT_MAIN_STATS, MAIN_STAT_NAMES, SUBSTAT_NAMES, FLAT_STATS, AVG_SUBSTAT_ROLL, Stat } from "../constants/artifactData"
import { useHuntList } from "../hooks/useHuntList"
import { ARTIFACT_DOMAINS } from "../constants/domains"
import type { HuntListItem, HuntSubstat } from "../types/artifact"
import { GenshinSelect } from "./selection"
import { DomainSetIcon, SplitDomainIcon } from "./DomainSelect"

const SLOT_ICONS: Record<number, string> = {
  0: "/icons/slot/flower.png",
  1: "/icons/slot/feather.png",
  2: "/icons/slot/sands.png",
  3: "/icons/slot/goblet.png",
  4: "/icons/slot/circlet.png",
}

function getStatIcon(statName: string): string | undefined {
  if (statName.includes("Anemo")) return "/icons/element/anemo.png"
  if (statName.includes("Cryo")) return "/icons/element/cryo.png"
  if (statName.includes("Dendro")) return "/icons/element/dendro.png"
  if (statName.includes("Electro")) return "/icons/element/electro.png"
  if (statName.includes("Geo")) return "/icons/element/geo.png"
  if (statName.includes("Hydro")) return "/icons/element/hydro.png"
  if (statName.includes("Pyro")) return "/icons/element/pyro.png"
  if (statName.includes("Physical")) return "/icons/element/physical.png"
  if (statName.includes("ATK %")) return "/icons/stat/attack_percent.png"
  if (statName.includes("DEF %")) return "/icons/stat/defense_percent.png"
  if (statName.includes("HP %")) return "/icons/stat/hp_percent.png"
  if (statName.includes("ATK")) return "/icons/stat/attack.png"
  if (statName.includes("DEF")) return "/icons/stat/defense.png"
  if (statName.includes("HP")) return "/icons/stat/hp.png"
  if (statName.includes("Crit DMG")) return "/icons/stat/crit_damage.png"
  if (statName.includes("Crit Rate")) return "/icons/stat/crit_rate.png"
  if (statName.includes("Elemental Mastery")) return "/icons/stat/elemental_mastery.png"
  if (statName.includes("Energy Recharge")) return "/icons/stat/energy_recharge.png"
  if (statName.includes("Healing Bonus")) return "/icons/stat/healing_bonus.png"
  return undefined
}

// For flat stats we need to know which ones to format without %
function fmtRollValue(stat: number, rolls: number): string {
  const avg = AVG_SUBSTAT_ROLL[stat]
  if (!avg) return ""
  const value = avg * rolls
  if (FLAT_STATS.has(stat)) {
    return `≈${Math.round(value)}`
  }
  return `≈${value.toFixed(1)}%`
}

export function HuntItemModal() {
  const { modalOpen, editingId, items, addItem, updateItem, closeModal } = useHuntList()

  const editingItem = editingId ? items.find((i) => i.id === editingId) : null

  const [slot, setSlot] = useState<number>(0)
  const [mainStat, setMainStat] = useState<number | null>(null)
  const [substats, setSubstats] = useState<HuntSubstat[]>([])
  const [domainId, setDomainId] = useState<string | undefined>(undefined)
  const [selectedSetId, setSelectedSetId] = useState<string | undefined>(undefined)

  // Available sets based on domain selection
  const availableSets = useMemo(() => {
    if (!domainId) {
      return ARTIFACT_DOMAINS.flatMap((d) => d.sets)
    }
    const domain = ARTIFACT_DOMAINS.find((d) => d.id === domainId)
    return domain?.sets ?? []
  }, [domainId])

  const setOptions = useMemo(() => {
    return [
      { label: "Any", value: "" },
      ...availableSets.map((set) => ({
        label: (
          <div className="flex items-center justify-center w-full">
            <DomainSetIcon enkaId={set.enkaId} fallbackName={set.name} className="w-[30px] h-[30px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" slot={slot} />
          </div>
        ),
        value: set.id,
      })),
    ]
  }, [availableSets, slot])

  const domainOptions = useMemo(() => {
    return [
      { label: "Any", value: "" },
      ...ARTIFACT_DOMAINS.map((domain) => ({
        label: (
          <div className="flex items-center justify-center w-full">
            <SplitDomainIcon domain={domain} slot={slot} />
          </div>
        ),
        value: domain.id,
      })),
    ]
  }, [slot])

  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.modal-drag-handle') && !(e.target as HTMLElement).closest('button')) {
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
  }, [pos])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      setPos({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      })
    }
  }, [isDragging])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false)
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    }
  }, [isDragging])

  // Reset state when modal opens
  useEffect(() => {
    if (modalOpen) {
      setPos({ x: 0, y: 0 })
      if (editingItem) {
        setSlot(editingItem.slot)
        setMainStat(editingItem.mainStat)
        setSubstats([...editingItem.substats])
        setDomainId(editingItem.domainId)
        setSelectedSetId(editingItem.setId)
      } else {
        setSlot(0)
        setMainStat(Stat.FlatHp) // Default: flower -> HP
        setSubstats([])
        setDomainId(undefined)
        setSelectedSetId(undefined)
      }
    }
  }, [modalOpen, editingItem])

  const mainStatOptions = useMemo(() => {
    return SLOT_MAIN_STATS[slot]
  }, [slot])

  // Build main stat select options
  const mainStatSelectOptions = useMemo(() => {
    return mainStatOptions.map((stat) => {
      const name = MAIN_STAT_NAMES[stat]
      const icon = getStatIcon(name)
      return {
        label: (
          <span className="flex items-center gap-2">
            {icon && <img src={icon} alt="" className="w-4 h-4 object-contain invert opacity-60" />}
            <span>{name}</span>
          </span>
        ),
        value: stat,
      }
    })
  }, [mainStatOptions])

  const handleSlotSelect = useCallback((s: number) => {
    setSlot(s)
    // Auto-select main stat for Flower (HP) and Feather (ATK)
    if (s === 0) {
      setMainStat(Stat.FlatHp)
    } else if (s === 1) {
      setMainStat(Stat.FlatAtk)
    } else {
      // Pick the first available main stat for the new slot
      const available = SLOT_MAIN_STATS[s]
      setMainStat(available[0] ?? null)
    }
    // Clear substats that conflict with new main stat
    setSubstats((prev) => prev.filter((sub) => {
      if (s === 0) return sub.stat !== Stat.FlatHp
      if (s === 1) return sub.stat !== Stat.FlatAtk
      return true
    }))
  }, [])

  const handleMainStatChange = useCallback((val: string | number) => {
    const stat = Number(val)
    setMainStat(stat)
    // Remove any substats that conflict with the new main stat
    setSubstats((prev) => prev.filter((s) => s.stat !== stat))
  }, [])

  const toggleSubstat = useCallback((stat: number) => {
    setSubstats((prev) => {
      const existing = prev.find((s) => s.stat === stat)
      if (existing) {
        return prev.filter((s) => s.stat !== stat)
      }
      if (prev.length >= 4) return prev
      return [...prev, { stat, minRolls: 1 }]
    })
  }, [])

  const updateRolls = useCallback((stat: number, delta: number) => {
    setSubstats((prev) => {
      const currentTotal = prev.reduce((sum, s) => sum + s.minRolls, 0)
      const maxTotal = 5 + prev.length
      
      return prev.map((s) => {
        if (s.stat === stat) {
          if (delta > 0) {
            if (s.minRolls >= 6 || currentTotal >= maxTotal) return s
            return { ...s, minRolls: s.minRolls + 1 }
          } else {
            return { ...s, minRolls: Math.max(1, s.minRolls - 1) }
          }
        }
        return s
      })
    })
  }, [])

  const handleSubmit = useCallback(() => {
    if (mainStat === null) return

    const item: HuntListItem = {
      id: editingId || crypto.randomUUID(),
      slot,
      mainStat,
      substats,
      domainId,
      setId: selectedSetId,
    }

    if (editingId) {
      updateItem(editingId, item)
    } else {
      addItem(item)
    }
    closeModal()
  }, [slot, mainStat, substats, domainId, selectedSetId, editingId, addItem, updateItem, closeModal])

  // Resolve set name for header bar
  const selectedSetName = useMemo(() => {
    if (!selectedSetId) return null
    for (const domain of ARTIFACT_DOMAINS) {
      for (const set of domain.sets) {
        if (set.id === selectedSetId) return set.name
      }
    }
    return null
  }, [selectedSetId])

  if (!modalOpen) return null

  const canSubmit = mainStat !== null
  const currentTotalRolls = substats.reduce((sum, s) => sum + s.minRolls, 0)
  const maxTotalRolls = 5 + substats.length
  const mainStatName = mainStat !== null ? MAIN_STAT_NAMES[mainStat] : null
  const mainStatIcon = mainStatName ? getStatIcon(mainStatName) : undefined
  const isFixedMainStat = slot === 0 || slot === 1

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 animate-backdrop-in" 
        onPointerDown={() => { 
          if (canSubmit) {
            handleSubmit()
          } else {
            closeModal()
          }
        }}
      />

      {/* Draggable Container */}
      <div 
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        className="relative z-10"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Card-style modal */}
        <div className={`w-[340px] mx-4 rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.7)] flex flex-col animate-modal-in ${isDragging ? "cursor-grabbing" : ""}`}>

          {/* ═══════════ TOP HALF: Card Header ═══════════ */}

          {/* Set / Domain bar */}
          <div className="bg-[#b85b2e] flex justify-between items-center px-3 py-2 border-b-2 border-[#8a421f] text-white z-20 shadow-sm relative modal-drag-handle cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {selectedSetName ? (
              <span className="font-genshin text-[12px] font-semibold tracking-wide drop-shadow-sm opacity-95 truncate">{selectedSetName}</span>
            ) : (
              <span className="font-genshin text-[12px] font-semibold tracking-wide drop-shadow-sm opacity-60 italic">Any Set</span>
            )}
          </div>
          <button
            onClick={closeModal}
            className="w-6 h-6 rounded-full bg-black/25 hover:bg-black/40 border-none text-white/70 hover:text-white cursor-pointer transition-all flex items-center justify-center text-[14px] shrink-0 ml-2"
          >
            ×
          </button>
        </div>

        {/* Main stat area with gradient + slot icon */}
        <div className="flex flex-col relative z-10 bg-gradient-to-br from-[#a75727] to-[#d89643]">
          {/* Background icon watermark */}
          {mainStatIcon && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <img
                src={mainStatIcon}
                alt=""
                className="absolute -left-4 top-1/2 -translate-y-1/2 w-32 h-32 opacity-[0.05] object-contain"
              />
            </div>
          )}

          {/* Right-side artifact icon (chosen set or chosen domain split) */}
          <div className="absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none z-10 flex items-center justify-center">
            {(() => {
              if (selectedSetId) {
                const activeSet = availableSets.find(s => s.id === selectedSetId)
                if (activeSet) return <DomainSetIcon enkaId={activeSet.enkaId} fallbackName={activeSet.name} slot={slot} className="w-[90px] h-[90px] drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]" />
              } else if (domainId) {
                const activeDomain = ARTIFACT_DOMAINS.find(d => d.id === domainId)
                if (activeDomain) return <SplitDomainIcon domain={activeDomain} slot={slot} className="w-[110px] h-[90px]" iconClassName="w-[80px] h-[80px]" />
              }
              return <DomainSetIcon fallbackName="Any" slot={slot} className="w-[90px] h-[90px] drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]" />
            })()}
          </div>

          {/* Slot selector row */}
          <div className="flex items-center gap-1 px-3 pt-2.5 z-10 relative">
            {SLOT_NAMES.map((name, i) => (
              <button
                key={i}
                onClick={() => handleSlotSelect(i)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all border-none ${
                  slot === i
                    ? "bg-white/25 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                    : "bg-white/5 hover:bg-white/15"
                }`}
                title={name}
              >
                <img src={SLOT_ICONS[i]} alt={name} className="w-5 h-5 object-contain drop-shadow-sm" />
              </button>
            ))}
            <span className="font-genshin text-white/90 text-[14px] font-semibold ml-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              {SLOT_NAMES[slot]}
            </span>
          </div>

          {/* Main stat display / selector */}
          <div className="flex flex-col px-4 pb-3 pt-4 font-genshin relative z-10">
            {isFixedMainStat ? (
              /* Fixed main stat for Flower/Feather */
              <div className="flex flex-col gap-0">
                <span className="text-[#d6d3ce] text-[13px] font-bold tracking-[0.5px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {mainStatName}
                </span>
                <strong className="text-white text-[28px] font-bold leading-[1.05] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {slot === 0 ? "4,780" : "311"}
                </strong>
              </div>
            ) : (
              /* Interactive main stat dropdown */
              <div className="flex flex-col gap-1.5">
                <span className="text-white/60 text-[11px] font-semibold tracking-wider uppercase">Main Stat</span>
                <div className="w-[200px]">
                  <GenshinSelect
                    value={mainStat ?? ""}
                    onChange={handleMainStatChange}
                    options={mainStatSelectOptions}
                    maxHeight="200px"
                    theme="light"
                  />
                </div>
              </div>
            )}

            {/* Stars */}
            <div className="flex gap-[1px] mt-1.5">
              {[...Array(5)].map((_, idx) => (
                <svg key={idx} className="w-[16px] h-[16px] text-[#f9c03b] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════ BOTTOM HALF: Substats + Controls ═══════════ */}
        <div className="bg-[#e9e5dc] flex flex-col flex-1">

          {/* Domain + Set row (compact) */}
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
            <div className="flex-1 min-w-0">
              <span className="font-genshin text-[10px] text-[#495366]/60 font-semibold uppercase tracking-wider">Domain</span>
              <GenshinSelect
                value={domainId ?? ""}
                onChange={(val) => {
                  setDomainId(String(val) || undefined)
                  setSelectedSetId(undefined)
                }}
                options={domainOptions}
                maxHeight="200px"
                theme="light"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-genshin text-[10px] text-[#495366]/60 font-semibold uppercase tracking-wider">Set</span>
              <GenshinSelect
                value={selectedSetId ?? ""}
                onChange={(val) => setSelectedSetId(String(val) || undefined)}
                options={setOptions}
                maxHeight="200px"
                theme="light"
              />
            </div>
          </div>

          {/* Substats header */}
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <span className="font-genshin text-[11px] text-[#495366]/70 font-semibold uppercase tracking-wider">
              Desired Substats ({substats.length}/4)
            </span>
            {substats.length > 0 && (
              <span className="font-genshin text-[10px] text-[#b85b2e] font-bold">
                Rolls: {currentTotalRolls}/{maxTotalRolls}
              </span>
            )}
          </div>

          {/* Substats list */}
          <div className="flex flex-col gap-0 px-3 pb-2 max-h-[260px] overflow-y-auto custom-scrollbar">
            {Object.entries(SUBSTAT_NAMES).map(([idStr, name]) => {
              const id = Number(idStr)
              const isMainStat = id === mainStat
              const selected = substats.find((s) => s.stat === id)
              const icon = getStatIcon(name)
              const canSelect = !isMainStat && (selected || substats.length < 4)

              return (
                <div
                  key={id}
                  className={`flex items-center py-[3px] px-1.5 rounded-md transition-all ${
                    isMainStat
                      ? "opacity-20 cursor-not-allowed"
                      : selected
                      ? "bg-[#b85b2e]/8"
                      : canSelect
                      ? "hover:bg-black/5 cursor-pointer"
                      : "opacity-35 cursor-not-allowed"
                  }`}
                  onClick={() => { if (canSelect && !isMainStat) toggleSubstat(id) }}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mr-2 ${
                      selected ? "bg-[#b85b2e] border-[#b85b2e]" : "border-[#495366]/30 bg-transparent"
                    }`}
                  >
                    {selected && (
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Stat icon + name */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {icon && <img src={icon} alt="" className="w-3.5 h-3.5 object-contain invert opacity-50 shrink-0" />}
                    <span className={`font-genshin text-[12px] text-[#495366] font-semibold truncate ${isMainStat ? "line-through" : ""}`}>
                      {name}
                    </span>
                  </div>

                  {/* Roll counter (inline) */}
                  {selected ? (
                    <div className="flex items-center gap-1 shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
                      {/* Roll dots */}
                      <div className="flex gap-[2px] mr-1">
                        {Array.from({ length: selected.minRolls }).map((_, i) => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#b85b2e]" />
                        ))}
                      </div>
                      <button
                        onClick={() => updateRolls(id, -1)}
                        disabled={selected.minRolls <= 1}
                        className="w-5 h-5 rounded bg-[#3c4556] text-white border-none cursor-pointer transition-all flex items-center justify-center text-[12px] font-bold disabled:opacity-20 disabled:cursor-not-allowed hover:bg-[#4c5566]"
                      >
                        −
                      </button>
                      <span className="font-genshin text-[11px] text-[#b85b2e] w-[16px] text-center font-bold">
                        {selected.minRolls}
                      </span>
                      <button
                        onClick={() => updateRolls(id, 1)}
                        disabled={selected.minRolls >= 6 || currentTotalRolls >= maxTotalRolls}
                        className="w-5 h-5 rounded bg-[#3c4556] text-white border-none cursor-pointer transition-all flex items-center justify-center text-[12px] font-bold disabled:opacity-20 disabled:cursor-not-allowed hover:bg-[#4c5566]"
                      >
                        +
                      </button>
                      <span className="font-genshin text-[9px] text-[#495366]/60 ml-0.5 w-[42px] text-right whitespace-nowrap font-semibold">
                        {fmtRollValue(id, selected.minRolls)}
                      </span>
                    </div>
                  ) : (
                    /* Empty right side for unselected stats - keeps alignment */
                    <div className="w-[120px] shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer / Submit */}
          <div className="mt-auto px-3 pb-3 pt-1">
            <div className="h-px bg-black/10 w-full mb-2" />
            <div className="flex items-center justify-between">
              <button
                onClick={closeModal}
                className="font-genshin text-[12px] text-[#495366]/60 hover:text-[#495366] cursor-pointer bg-transparent border-none transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="font-genshin font-bold text-[12px] text-[#211c14] bg-gradient-to-b from-[#d3a352] to-[#b88636] px-5 py-1.5 rounded-lg cursor-pointer hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed border-none transition-all duration-200 ease-out shadow-[0_3px_8px_rgba(0,0,0,0.25)]"
              >
                {editingId ? "Save" : "Add to Hunt List"}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
