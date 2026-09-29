import { Field } from "./Field"
import { RESIN_PER_RUN, RESIN_SHORTCUTS } from "../constants/resin"
import type { StateSetter } from "../types/artifact"
import { GenshinSelect } from "./selection";

interface ResinConfigProps {
  mode: number
  resinBudget: number
  useStrongBox: boolean
  setMode: StateSetter<number>
  setResinBudget: StateSetter<number>
  setUseStrongBox: StateSetter<boolean>
}

export function ResinConfig({
  mode,
  resinBudget,
  useStrongBox,
  setMode,
  setResinBudget,
  setUseStrongBox,
}: ResinConfigProps) {

  return (
    <section className="card">
      {/* 24px space below title */}
      <h2 className="font-genshin font-bold text-3xl" style={{ marginBottom: "24px" }}>Resin Config</h2>
      
      {/* Set gap to exactly 24px so the space between fields and lines is uniform */}
      <div className="grid" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Field id="resin" label={mode === 0 ? "Resin to spend" : "Maximum Resin to spend"}>
          <div 
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--input-bg, rgba(15, 23, 42, 0.6))",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "6px",
              padding: "8px 12px",
            }}
          >
            <img src="/icons/resin.png" alt="Resin" style={{ width: "18px", height: "18px", flexShrink: 0, opacity: 0.9 }} />
            <input
              id="resin" 
              type="text" 
              inputMode="numeric" 
              className="font-genshin"
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                boxShadow: "none",
                color: "inherit",
                fontSize: "0.95rem",
                padding: 0
              }}
              value={resinBudget ? resinBudget.toLocaleString() : ""}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");
                setResinBudget(rawValue === "" ? 0 : Number(rawValue));
              }}
              onBlur={() => setResinBudget((prev) => Math.max(RESIN_PER_RUN, Math.floor(prev / RESIN_PER_RUN) * RESIN_PER_RUN))}
            />
          </div>

          <div className="chips" style={{ marginTop: "12px" }}>
            {RESIN_SHORTCUTS.map((s) => (
              <button key={s.label} type="button" className="chip font-genshin" onClick={() => setResinBudget(s.resin)}>
                {s.label}
              </button>
            ))}
          </div>
        </Field>
        
        {/* Margin 0 here because the grid's 24px gap will handle the top and bottom spacing automatically */}
        <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.15)", margin: 0 }} />
        
        <Field id="mode" label="How should the simulator spend resin?">
          <GenshinSelect
            value={mode}
            onChange={(val) => setMode(Number(val))}
            options={[
              { label: "Set resin budget", value: 0 },
              { label: "Target specific artifact", value: 1 },
            ]}
          />
        </Field>
      </div>
      
      {/* Exactly 24px margin above and below the line to match the grid gap above */}
      <hr style={{ border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.15)", margin: "24px 0" }} />
      
      {/* Removed marginTop completely, allowing the hr's 24px bottom margin to push this down perfectly */}
      <label className="check font-genshin" style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
        <input 
          type="checkbox" 
          checked={useStrongBox} 
          onChange={(e) => setUseStrongBox(e.target.checked)} 
          style={{ display: "none" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img 
            src="/icons/strongbox.webp" 
            alt="Strongbox" 
            style={{ 
              width: "50px",
              height: "50px", 
              transition: "opacity 0.2s, filter 0.2s",
              opacity: useStrongBox ? 1 : 0.35,
              filter: useStrongBox ? "none" : "grayscale(100%)"
            }} 
          />
          <div>
            <span>Use Strongbox?</span>
            <small style={{ display: "block", opacity: 0.7, fontSize: "0.85em" }}>Turns 3 unwanted pieces into 1 extra Artifact</small>
          </div>
        </div>
      </label>
    </section>
  )
}