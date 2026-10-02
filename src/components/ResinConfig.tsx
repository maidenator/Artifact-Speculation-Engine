import { Field } from "./Field"
import { GenshinSelect } from "./selection"
import { RESIN_PER_RUN, RESIN_SHORTCUTS } from "../constants/resin"
import { useSimulationSettings } from "../hooks/useSimulationSettings"
import { SimulationMode } from "../types/artifact"

export function ResinConfig() {
  const settings = useSimulationSettings((state) => state.settings)
  const setMode = useSimulationSettings((state) => state.setMode)
  const setResinBudget = useSimulationSettings((state) => state.setResinBudget)
  const setUseStrongBox = useSimulationSettings((state) => state.setUseStrongBox)

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
                const rawValue = e.target.value.replace(/\D/g, "");
                setResinBudget(rawValue === "" ? 0 : Number(rawValue));
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

        {/* Margin 0 here because the grid's 24px gap will handle the top and bottom spacing automatically */}
        <hr className="border-none border-t border-white/15 m-0" />

        <Field id="mode" label="How should the simulator spend resin?">
          <GenshinSelect
            value={settings.mode}
            onChange={(val) => setMode(Number(val) as SimulationMode)}
            options={[
              { label: "Set resin budget", value: SimulationMode.ResinBudget },
              { label: "Target specific artifact", value: SimulationMode.TargetPiece },
            ]}
          />
        </Field>


      </div>

      {/* Exactly 24px margin above and below the line to match the grid gap above */}
      <hr className="border-none border-t border-white/15 my-6" />

      {/* Removed marginTop completely, allowing the hr's 24px bottom margin to push this down perfectly */}
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