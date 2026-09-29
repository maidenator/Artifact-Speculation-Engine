import { Field } from "./Field"
import { SubstatPriority } from "./SubstatPriority"
import { MAIN_STAT_NAMES, SLOT_MAIN_STATS, SLOT_NAMES } from "../constants/artifactData"
import type { StateSetter } from "../types/artifact"
import { GenshinSelect } from "./selection"

const SLOT_ICONS: Record<number, string> = {
  0: "/icons/slot/flower.png",
  1: "/icons/slot/feather.png",
  2: "/icons/slot/sands.png",
  3: "/icons/slot/goblet.png",
  4: "/icons/slot/circlet.png",
}

function getStatIcon(statName: string): string | undefined {
  if (statName.includes("Anemo")) return "/icons/element/anemo.png";
  if (statName.includes("Cryo")) return "/icons/element/cryo.png";
  if (statName.includes("Dendro")) return "/icons/element/dendro.png";
  if (statName.includes("Electro")) return "/icons/element/electro.png";
  if (statName.includes("Geo")) return "/icons/element/geo.png";
  if (statName.includes("Hydro")) return "/icons/element/hydro.png";
  if (statName.includes("Pyro")) return "/icons/element/pyro.png";
  if (statName.includes("Physical")) return "/icons/element/physical.png";

  if (statName.includes("ATK %")) return "/icons/stat/attack_percent.png";
  if (statName.includes("DEF %")) return "/icons/stat/defense_percent.png";
  if (statName.includes("HP %")) return "/icons/stat/hp_percent.png";

  if (statName.includes("ATK")) return "/icons/stat/attack.png";
  if (statName.includes("DEF")) return "/icons/stat/defense.png";
  if (statName.includes("HP")) return "/icons/stat/hp.png";

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
      <h2 className="font-genshin font-bold text-3xl" style={{ marginBottom: "24px" }}>Speculator Config</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        <Field id="topk" label="Artifacts to Show">
          <GenshinSelect
            value={topK}
            onChange={(val) => setTopK(Number(val))}
            options={[
              { label: "1 piece", value: 1 },
              { label: "5 pieces", value: 5 },
              { label: "10 pieces", value: 10 },
              { label: "25 pieces", value: 25 },
              { label: "50 pieces", value: 50 },
            ]}
          />
        </Field>

        {mode === 1 && (
          <>
            <Field id="mincv" label="Minimum Crit Value">
              <input
                id="mincv"
                type="text"
                inputMode="decimal"
                className="font-genshin"
                style={{
                  width: "100%",
                  background: "var(--input-bg, rgba(15, 23, 42, 0.6))",
                  border: "1px solid var(--input-border, rgba(255, 255, 255, 0.15))",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  color: "inherit",
                  outline: "none",
                  fontSize: "0.95rem"
                }}
                value={minCritValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setMinCritValue(0);
                  } else {
                    const num = parseFloat(val);
                    if (!isNaN(num)) {
                      setMinCritValue(num);
                    }
                  }
                }}
              />
            </Field>

            <hr style={{ gridColumn: "1 / -1", border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.15)", margin: 0 }} />

            <Field id="slot" label="Artifact type">
              <GenshinSelect
                value={targetSlot}
                onChange={(val) => onSlotChange(String(val))}
                options={slotOptionsList}
                maxHeight="220px"
              />
            </Field>

            <Field id="mainstat" label="Main stat">
              <GenshinSelect
                value={targetMainStat}
                onChange={(val) => setTargetMainStat(val === "" ? "" : Number(val))}
                options={mainStatOptionsList}
                maxHeight="220px"
              />
            </Field>
          </>
        )}
      </div>
      <SubstatPriority priority={priority} setPriority={setPriority} />
    </section>
  )
}