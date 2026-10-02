import { Field } from "./Field"
import { SubstatPriority } from "./SubstatPriority"
import { MAIN_STAT_NAMES, SLOT_MAIN_STATS, SLOT_NAMES } from "../constants/artifactData"
import { GenshinSelect } from "./selection"
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

export function SpeculatorConfig() {
  const settings = useSimulationSettings((state) => state.settings)
  const setTopK = useSimulationSettings((state) => state.setTopK)
  const setMinCritValue = useSimulationSettings((state) => state.setMinCritValue)
  const setTargetMainStat = useSimulationSettings((state) => state.setTargetMainStat)
  const setPriority = useSimulationSettings((state) => state.setPriority)
  const onSlotChange = useSimulationSettings((state) => state.changeSlot)

  const { mode, topK, minCritValue, targetSlot, targetMainStat, priority } = settings

  const mainStatOptions = targetSlot === null ? Object.keys(MAIN_STAT_NAMES).map(Number) : SLOT_MAIN_STATS[targetSlot]

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
    <section className="bg-card border border-line rounded-lg p-5 mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
      <h2 className="font-genshin font-bold text-[28px] text-gold mb-6 leading-[1.2] tracking-[0.5px]">Speculator Config</h2>

      <div className="grid grid-cols-2 gap-6 items-start">

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

        {mode === SimulationMode.TargetPiece && (
          <>
            <Field id="mincv" label="Min Crit Value">
              <input
                id="mincv"
                type="text"
                inputMode="decimal"
                className="font-genshin w-full bg-[var(--input-bg,rgba(15,23,42,0.6))] border border-white/15 rounded-md px-3 py-2 text-inherit outline-none text-[15.2px]"
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

            <hr className="col-span-full border-none border-t border-white/15 m-0" />

            <Field id="slot" label="Artifact type">
              <GenshinSelect
                value={targetSlot ?? ""}
                onChange={(val) => onSlotChange(String(val))}
                options={slotOptionsList}
                maxHeight="220px"
              />
            </Field>

            <Field id="mainstat" label="Main stat">
              <GenshinSelect
                value={targetMainStat ?? ""}
                onChange={(val) => setTargetMainStat(val === "" ? null : Number(val))}
                options={mainStatOptionsList}
                maxHeight="220px"
              />
            </Field>
          </>
        )}
      </div>
      <hr className="border-none border-t border-white/15 my-6" />
      <SubstatPriority priority={priority} setPriority={setPriority} />
    </section>
  )
}