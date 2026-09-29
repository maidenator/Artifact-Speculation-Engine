import { MAIN_STAT_NAMES, SLOT_NAMES, SUBSTAT_NAMES } from "../constants/artifactData"
import { fmtStat } from "../utils/format"
import { rvTier, cvTier, rollValue } from "../utils/scoring"
import type { ArtifactOutput, ScoreMode } from "../types/artifact"

const SLOT_ICONS: Record<number | string, string> = {
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
  
  return undefined; 
}

interface ArtifactCardProps {
  artifact: ArtifactOutput
  rank: number
  scoreMode: ScoreMode
  priority: number[]
}

export function ArtifactCard({ artifact: art, rank, scoreMode, priority }: ArtifactCardProps) {
  const mainStatName = MAIN_STAT_NAMES[art.mainStat.type] ?? art.mainStat.type;
  const mainStatIcon = getStatIcon(String(mainStatName));

  // Removed the dynamic card-tier class so the outer border stays clean, as requested
  return (
    <article className="artifact">
      <header>
        <span className="rank">#{rank}</span>
        
        <div className="slot-wrapper">
          {SLOT_ICONS[art.slot] && (
            <img 
              src={SLOT_ICONS[art.slot]} 
              alt="" 
              className="slot-icon" 
            />
          )}
          <strong>{SLOT_NAMES[art.slot] ?? "Piece"}</strong>
        </div>

        <span className="level">+{art.level}</span>
      </header>
      
      <div className="main" style={{ position: "relative", overflow: "hidden" }}>
        {mainStatIcon && (
          <img 
            src={mainStatIcon} 
            alt="" 
            style={{
              position: "absolute",
              left: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "80px",
              height: "80px",
              opacity: 0.05,
              objectFit: "contain",
              pointerEvents: "none",
              zIndex: 0
            }}
          />
        )}
        
        <span style={{ position: "relative", zIndex: 1 }}>{mainStatName}</span>
        <strong style={{ position: "relative", zIndex: 1 }}>{fmtStat(art.mainStat.type, art.mainStat.value)}</strong>
      </div>
      
      <ul>
        {art.subStats.map((sub, i) => {
          const subName = SUBSTAT_NAMES[sub.type] ?? sub.type;
          const subIcon = getStatIcon(String(subName));
          
          //Temp
          const rollHistory = (sub as typeof sub & { rollTiers?: string[] }).rollTiers 
          || Array(Math.min(sub.rolls, 6)).fill("min");
          
          return (
            <li key={i}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {subIcon && (
                  <img src={subIcon} alt="" style={{ width: "16px", height: "16px", objectFit: "contain" }} />
                )}
                {subName}
                
                {/* Roll Dots Container */}
                <i style={{ display: "inline-flex", gap: "4px", marginLeft: "6px" }}>
                  {rollHistory.map((tier: string, rIdx: number) => (
                    <span 
                      key={rIdx} 
                      className={`roll-dot tier-${tier}`} 
                      title={`Roll ${rIdx + 1}: ${tier}`}
                    />
                  ))}
                </i>
              </span>
              <span>{fmtStat(sub.type, sub.value)}</span>
            </li>
          )
        })}
      </ul>
      
      <footer className={`font-genshin ${scoreMode === "cv" ? cvTier(art.critValue) : rvTier(rollValue(art, priority))}`}>
        <span>{scoreMode === "cv" ? "Crit Value" : "Roll Value"}</span>
        <strong>
          {scoreMode === "cv" ? art.critValue.toFixed(1) : `${Math.round(rollValue(art, priority))}%`}
        </strong>
      </footer>
    </article>
  )
}