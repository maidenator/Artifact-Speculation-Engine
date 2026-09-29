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

  const tier = scoreMode === "cv" ? cvTier(art.critValue) : rvTier(rollValue(art, priority));
  const tierColors: Record<string, string> = {
    "cv-max": "border-bad [&_strong]:text-bad",
    "cv-top": "border-gold [&_strong]:text-gold",
    "cv-high": "border-ok [&_strong]:text-ok",
    "cv-mid": "border-cyan [&_strong]:text-cyan",
    "cv-low": "border-line [&_strong]:text-muted"
  };

  const rollTierColors: Record<string, string> = {
    "max": "text-bad",
    "high": "text-gold",
    "mid": "text-ok",
    "low": "text-cyan",
    "min": "text-muted"
  };

  return (
    <article className="bg-card-inner border border-line rounded-md overflow-hidden flex flex-col h-max shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-transform duration-200 hover:-translate-y-[2px]">
      <header className="bg-gradient-to-br from-[#a75727] to-[#d89643] px-3 py-1.5 flex justify-between items-center text-white border-b-2 border-[#eab05f] gap-1.5">
        <span className="bg-black/35 px-1.5 py-0.5 rounded text-[11.5px] font-bold text-white">#{rank}</span>
        
        <div className="flex items-center gap-1.5">
          {SLOT_ICONS[art.slot] && (
            <img 
              src={SLOT_ICONS[art.slot]} 
              alt="" 
              className="w-[22px] h-[22px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" 
            />
          )}
          <strong className="font-genshin">{SLOT_NAMES[art.slot] ?? "Piece"}</strong>
        </div>

        <span className="bg-[#1e2330] text-gold px-2 py-0.5 rounded-full text-[12px] font-bold border border-gold ml-auto">+{art.level}</span>
      </header>
      
      <div className="flex flex-col gap-0.5 m-0 px-3 pt-4 pb-3 border-b border-white/5 font-genshin relative overflow-hidden">
        {mainStatIcon && (
          <img 
            src={mainStatIcon} 
            alt="" 
            className="absolute left-2 top-1/2 -translate-y-1/2 w-20 h-20 opacity-5 object-contain pointer-events-none z-0"
          />
        )}
        
        <span className="text-muted text-[14px] font-semibold tracking-[0.5px] relative z-10">{mainStatName}</span>
        <strong className="text-white text-[28px] font-semibold leading-[1.1] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10">{fmtStat(art.mainStat.type, art.mainStat.value)}</strong>
      </div>
      
      <ul className="list-none m-0 p-3 flex flex-col gap-2 font-genshin text-[12px] tracking-[0.3px] font-normal transform-gpu">
        {art.subStats.map((sub, i) => {
          const subName = SUBSTAT_NAMES[sub.type] ?? sub.type;
          const subIcon = getStatIcon(String(subName));
          
          const isPriority = priority.includes(sub.type);
          
          const rollHistory = (sub as typeof sub & { rollTiers?: string[] }).rollTiers 
          || Array(Math.min(sub.rolls, 6)).fill("min");
          
          return (
            <li 
              key={i}
              className={`flex justify-between items-center py-[1px] px-2 my-0.5 rounded-md text-[#ece5d8] ${isPriority ? "bg-white/10" : "bg-transparent"}`}
            >
              <span className="flex items-center gap-1.5">
                {subIcon && (
                  <img src={subIcon} alt="" className="w-4 h-4 object-contain" />
                )}
                <span>{subName}</span>
                
                <i className="not-italic text-cyan tracking-[2px] ml-1.5 inline-flex gap-1">
                  {rollHistory.map((tier: string, rIdx: number) => (
                    <span 
                      key={rIdx} 
                      className={`w-1.5 h-1.5 rounded-full inline-block bg-current ${rollTierColors[tier] ?? "text-muted"}`} 
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
      
      <footer 
        className={`flex justify-between mt-auto mx-2 mb-2 px-3 py-2 bg-black/20 border rounded-md font-genshin text-gold ${tierColors[tier] || "border-line text-muted"}`}
      >
        <span>{scoreMode === "cv" ? "Crit Value" : "Roll Value"}</span>
        <strong>
          {scoreMode === "cv" ? art.critValue.toFixed(1) : `${Math.round(rollValue(art, priority))}%`}
        </strong>
      </footer>
    </article>
  )
}