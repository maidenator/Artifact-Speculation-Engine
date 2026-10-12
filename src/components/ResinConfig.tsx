import { Field } from "./Field"
import { GenshinSelect } from "./selection"
import { RESIN_PER_RUN, RESIN_SHORTCUTS } from "../constants/resin"
import { MAIN_STAT_NAMES, SLOT_MAIN_STATS, SLOT_NAMES } from "../constants/artifactData"
import { useSimulationSettings } from "../hooks/useSimulationSettings"
import { SimulationMode } from "../types/artifact"

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

export function ResinConfig() {
  const settings = useSimulationSettings((state) => state.settings)
  const setMode = useSimulationSettings((state) => state.setMode)
  const setResinBudget = useSimulationSettings((state) => state.setResinBudget)
  const setTrials = useSimulationSettings((state) => state.setTrials)
  const setUseStrongBox = useSimulationSettings((state) => state.setUseStrongBox)
  const setMinCritValue = useSimulationSettings((state) => state.setMinCritValue)
  const setTargetMainStat = useSimulationSettings((state) => state.setTargetMainStat)
  const onSlotChange = useSimulationSettings((state) => state.changeSlot)

  const targetSlot = settings.targetSlot
  const mainStatOptions =
    targetSlot === null ? Object.keys(MAIN_STAT_NAMES).map(Number) : SLOT_MAIN_STATS[targetSlot]

  const slotOptionsList = [
    { label: "Any piece", value: "" },
    ...SLOT_NAMES.map((name, i) => ({
      label: name,
      value: i,
      icon: SLOT_ICONS[i],
    })),
  ]

  const mainStatOptionsList = [
    { label: "Any main stat", value: "" },
    ...mainStatOptions.map((id) => {
      const statName = MAIN_STAT_NAMES[id]
      return {
        label: statName,
        value: id,
        icon: getStatIcon(statName),
      }
    }),
  ]

  return (
    <section className="bg-card border border-line rounded-lg p-5 mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
      {/* 24px space below title */}
      <h2 className="font-genshin font-bold text-[28px] text-gold mb-6 leading-[1.2] tracking-[0.5px]">Resin Config</h2>

      {/* Set gap to exactly 24px so the space between fields and lines is uniform */}
      <div className="flex flex-col gap-6">
        <Field id="resin" label={settings.mode === SimulationMode.ResinBudget ? "Resin to spend" : "Maximum Resin to spend"}>
          <div className="flex items-center gap-2 bg-[var(--input-bg,rgba(15,23,42,0.6))] border border-white/15 rounded-md px-3 py-2">
            <img src="/icons/resin.png" alt="Resin" className="w-[18px] h-[18px] shrink-0 opacity-90" />
            <input
              id="resin"
              type="text"
              inputMode="numeric"
              className="font-genshin flex-1 min-w-0 bg-transparent border-none outline-none shadow-none text-inherit text-[15.2px] p-0"
              value={settings.resinBudget ? settings.resinBudget.toLocaleString() : ""}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "")
                setResinBudget(rawValue === "" ? 0 : Number(rawValue))
              }}
              onBlur={() => setResinBudget(Math.max(RESIN_PER_RUN, Math.floor(settings.resinBudget / RESIN_PER_RUN) * RESIN_PER_RUN))}
            />
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {RESIN_SHORTCUTS.map((s) => (
              <button key={s.label} type="button" className="px-3 py-1 text-[12.5px] text-muted bg-white/5 border border-line rounded-2xl cursor-pointer transition-all hover:border-gold hover:text-gold font-genshin" onClick={() => setResinBudget(s.resin)}>
                {s.label}
              </button>
            ))}
          </div>
        </Field>

        <hr className="border-none border-t border-white/15 m-0" />

        <Field id="mode" label="How should the simulator spend resin?">
          <GenshinSelect
            value={settings.mode}
            onChange={(val) => setMode(Number(val) as SimulationMode)}
            options={[
              { label: "Hunt list (multi-piece)", value: SimulationMode.HuntList },
              { label: "Target specific artifact", value: SimulationMode.TargetPiece },
              { label: "Set resin budget", value: SimulationMode.ResinBudget },
            ]}
          />
        </Field>

        {settings.mode === SimulationMode.HuntList && (
          <div className="bg-white/5 border border-line rounded-lg p-3 text-[13px] text-muted leading-relaxed">
            Configure target artifacts in the <strong className="text-gold">Hunt List</strong> panel to the right. The simulator will farm until all listed pieces are found or the maximum resin limit is reached.
          </div>
        )}

        {settings.mode === SimulationMode.TargetPiece && (
          <>
            <Field id="trials" label="Monte Carlo trials">
              <GenshinSelect
                value={settings.trials ?? 100}
                onChange={(val) => setTrials(Number(val))}
                options={[
                  { label: "50 trials", value: 50 },
                  { label: "100 trials (Recommended)", value: 100 },
                  { label: "250 trials", value: 250 },
                  { label: "500 trials", value: 500 },
                  { label: "1,000 trials", value: 1000 },
                ]}
              />
            </Field>

            <hr className="border-none border-t border-white/15 m-0" />

            <Field id="slot" label="Target artifact type">
              <GenshinSelect
                value={settings.targetSlot ?? ""}
                onChange={(val) => onSlotChange(String(val))}
                options={slotOptionsList}
                maxHeight="220px"
              />
            </Field>

            <Field id="mainstat" label="Target main stat">
              <GenshinSelect
                value={settings.targetMainStat ?? ""}
                onChange={(val) => setTargetMainStat(val === "" ? null : Number(val))}
                options={mainStatOptionsList}
                maxHeight="220px"
              />
            </Field>

            <Field id="mincv" label="Minimum Crit Value (CV)">
              <div className="bg-[var(--input-bg,rgba(15,23,42,0.6))] border border-white/15 rounded-md px-3 py-2 flex items-center">
                <input
                  id="mincv"
                  type="text"
                  inputMode="decimal"
                  className="font-genshin flex-1 min-w-0 bg-transparent border-none outline-none text-inherit text-[15.2px]"
                  value={settings.minCritValue || ""}
                  placeholder="e.g. 25"
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "")
                    setMinCritValue(val === "" ? 0 : parseFloat(val) || 0)
                  }}
                />
              </div>
            </Field>
          </>
        )}
      </div>

      <hr className="border-none border-t border-white/15 my-6" />

      <label className="font-genshin flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.useStrongBox}
          onChange={(e) => setUseStrongBox(e.target.checked)}
          style={{ display: "none" }}
        />
        <div className="flex items-center gap-3">
          <img
            src="/icons/strongbox.webp"
            alt="Strongbox"
            className="w-[50px] h-[50px] transition-all duration-200"
            style={{
              opacity: settings.useStrongBox ? 1 : 0.35,
              filter: settings.useStrongBox ? "none" : "grayscale(100%)"
            }}
          />
          <div>
            <span>Use Strongbox?</span>
            <small className="block opacity-70 text-[0.85em]">Turns 3 unwanted pieces into 1 extra Artifact</small>
          </div>
        </div>
      </label>
    </section>
  )
}