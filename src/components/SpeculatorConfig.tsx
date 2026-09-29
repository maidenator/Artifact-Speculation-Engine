import { Field } from "./Field"
import { SubstatPriority } from "./SubstatPriority"
import { MAIN_STAT_NAMES, SLOT_MAIN_STATS, SLOT_NAMES } from "../constants/artifactData"
import type { StateSetter } from "../types/artifact"
import { GenshinSelect } from "./selection"

// 1. UPDATED PATHS: Pointing to the new "stat" folder
const SLOT_ICONS: Record<number, string> = {
  0: "/icons/flower.png",
  1: "/icons/feather.png",
  2: "/icons/sands.png",
  3: "/icons/goblet.png",
  4: "/icons/circlet.png",
}

function getStatIcon(statName: string): string | undefined {
  // Elements & Physical
  if (statName.includes("Anemo")) return "/icons/element/anemo.png";
  if (statName.includes("Cryo")) return "/icons/element/cryo.png";
  if (statName.includes("Dendro")) return "/icons/element/dendro.png";
  if (statName.includes("Electro")) return "/icons/element/electro.png";
  if (statName.includes("Geo")) return "/icons/element/geo.png";
  if (statName.includes("Hydro")) return "/icons/element/hydro.png";
  if (statName.includes("Pyro")) return "/icons/element/pyro.png";
  if (statName.includes("Physical")) return "/icons/element/physical.png";

  // Percent Stats (Must be checked BEFORE flat stats)
  if (statName.includes("ATK %")) return "/icons/stat/attack_percent.png";
  if (statName.includes("DEF %")) return "/icons/stat/defense_percent.png";
  if (statName.includes("HP %")) return "/icons/stat/hp_percent.png";

  // Flat Stats
  if (statName.includes("ATK")) return "/icons/stat/attack.png";
  if (statName.includes("DEF")) return "/icons/stat/defense.png";
  if (statName.includes("HP")) return "/icons/stat/hp.png";

  // Other Base Stats
  if (statName.includes("Crit DMG")) return "/icons/stat/crit_damage.png";
  if (statName.includes("Crit Rate")) return "/icons/stat/crit_rate.png";
  if (statName.includes("Elemental Mastery")) return "/icons/stat/elemental_mastery.png";
  if (statName.includes("Energy Recharge")) return "/icons/stat/energy_recharge.png";
  if (statName.includes("Healing Bonus")) return "/icons/stat/healing_bonus.png";
  return undefined; 
}

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

  const slotOptionsList = [
    { label: "Any piece", value: "" },
    ...SLOT_NAMES.map((name, i) => ({
      label: name,
      value: i,
      icon: SLOT_ICONS[i],
    })),
  ]

  // 3. APPLIED HELPER: Attaches the icon to the dropdown options
  const mainStatOptionsList = [
    { label: "Any main stat", value: "" },
    ...mainStatOptions.map((id) => {
      const statName = MAIN_STAT_NAMES[id];
      return {
        label: statName,
        value: id,
        icon: getStatIcon(statName),
      };
    }),
  ]

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
              <GenshinSelect
                value={targetSlot}
                onChange={(val) => onSlotChange(String(val))}
                options={slotOptionsList}
              />
            </Field>

            <Field id="mainstat" label="Main stat">
              <GenshinSelect
                value={targetMainStat}
                onChange={(val) => setTargetMainStat(val === "" ? "" : Number(val))}
                options={mainStatOptionsList}
              />
            </Field>
          </>
        )}
      </div>

      <SubstatPriority priority={priority} setPriority={setPriority} />
    </section>
  )
}