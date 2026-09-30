import { MAIN_STAT_NAMES, SLOT_NAMES, SUBSTAT_NAMES } from "../constants/artifactData"
import { fmtStat } from "../utils/format"
import { rvTier, cvTier, rollValue, inferRollTiers } from "../utils/scoring"
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

/** Info about the substat roll that just happened, used for the upgrade animation */
export interface UpgradeAnimation {
  /** Index of the substat that was upgraded (or added) */
  substatIndex: number
  /** The delta value of the roll (e.g. 3.9 for a crit rate roll) */
  delta: number
  /** Roll quality tier: "max" | "high" | "mid" | "low" | "min" */
  rollTier: string
  /** Stat type id, used for formatting the delta */
  statType: number
  /** Unique key to re-trigger animation on consecutive upgrades */
  key: number
}

// ── Duration constant ──
// Adjust this single value to control how long the flash + delta-pop last (in ms).
// The CSS animations in index.css should match this value.
const ANIMATION_DURATION_MS = 600

interface ArtifactCardProps {
  artifact: ArtifactOutput
  rank: number
  scoreMode: ScoreMode
  priority: number[]
  /** Optional preview of the 4th substat (shown greyed out for 3-liner artifacts) */
  previewSubstat?: { type: number; value: number }
  /** When set, animates the upgraded substat row */
  upgradeAnimation?: UpgradeAnimation | null
}

const rollTierColors: Record<string, string> = {
  "max": "text-bad",
  "high": "text-gold",
  "mid": "text-[#65a30d]",
  "low": "text-[#0d9488]",
  "min": "text-muted"
};

export function ArtifactCard({ artifact: art, rank, scoreMode, priority, previewSubstat, upgradeAnimation }: ArtifactCardProps) {
  const mainStatName = MAIN_STAT_NAMES[art.mainStat.type] ?? art.mainStat.type;
  const mainStatIcon = getStatIcon(String(mainStatName));

  const tier = scoreMode === "cv" ? cvTier(art.critValue) : rvTier(rollValue(art, priority));
  const tierColors: Record<string, string> = {
    "cv-max": "[&_strong]:text-bad",
    "cv-top": "[&_strong]:text-gold",
    "cv-high": "[&_strong]:text-[#65a30d]",
    "cv-mid": "[&_strong]:text-[#0d9488]",
    "cv-low": "[&_strong]:text-muted"
  };

  return (
    <article className="bg-[#e9e5dc] border border-line rounded-md overflow-hidden flex flex-col h-max shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-transform duration-200 hover:-translate-y-[2px]">
      {/* Top Section (Header + Main Stat) with Gold Gradient */}
      <div className="bg-gradient-to-br from-[#a75727] to-[#d89643] border-b-2 border-[#eab05f] flex flex-col relative overflow-hidden">
        
        {/* Background icon behind main stat */}
        {mainStatIcon && (
          <img 
            src={mainStatIcon} 
            alt="" 
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-32 h-32 opacity-[0.07] object-contain pointer-events-none z-0"
          />
        )}

        <header className="px-3 py-1.5 flex justify-between items-center text-white gap-1.5 z-10">
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

          <span className="bg-black/25 text-[#f0ebe1] px-1.5 py-0.5 rounded text-[11.5px] font-bold ml-auto">+{art.level}</span>
        </header>
        
        <div className="flex justify-between items-end px-3 pt-2 pb-3 font-genshin relative z-10">
          <div className="flex flex-col gap-0.5">
            <span className="text-[#f0ebe1] text-[14px] font-semibold tracking-[0.5px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{mainStatName}</span>
            <strong className="text-white text-[28px] font-semibold leading-[1.1] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              {fmtStat(art.mainStat.type, art.mainStat.value)}
            </strong>
          </div>

          {/* Artifact Set Piece Image */}
          <img 
            src={`/icons/artifactset/Gladiator${SLOT_NAMES[art.slot] ?? "Flower"}.png`}
            alt=""
            className="w-20 h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] transform scale-[1.3] origin-right"
          />
        </div>
      </div>
      
      <ul className="list-none m-0 p-3 flex flex-col gap-2 font-genshin text-[12px] tracking-[0.3px] font-normal transform-gpu">
        {art.subStats.map((sub, i) => {
          const subName = SUBSTAT_NAMES[sub.type] ?? sub.type;
          const subIcon = getStatIcon(String(subName));
          
          const isPriority = priority.includes(sub.type);
          
          const rollHistory = (sub as typeof sub & { rollTiers?: string[] }).rollTiers || inferRollTiers(sub.type, sub.value, sub.rolls);
          
          const isAnimating = upgradeAnimation?.substatIndex === i;
          
          return (
            <li 
              key={`${i}-${upgradeAnimation?.key ?? 0}`}
              className={`flex justify-between items-center py-[1px] px-2 my-0.5 rounded-md text-[#495366] font-semibold relative ${isPriority ? "bg-black/5" : "bg-transparent"} ${isAnimating ? "anim-row-flash" : ""}`}
            >
              <span className="flex items-center gap-1.5">
                {subIcon && (
                  <img src={subIcon} alt="" className="w-4 h-4 object-contain invert opacity-60" />
                )}
                <span>{subName}</span>
                
                <i className="not-italic text-cyan tracking-[2px] ml-1.5 inline-flex gap-1">
                  {rollHistory.map((tier: string, rIdx: number) => {
                    // Animate the newest dot (last one) when this row is upgrading
                    const isNewDot = isAnimating && rIdx === rollHistory.length - 1;
                    return (
                      <span 
                        key={`${rIdx}-${upgradeAnimation?.key ?? 0}`}
                        className={`w-1.5 h-1.5 rounded-full inline-block bg-current ${rollTierColors[tier] ?? "text-muted"} ${isNewDot ? "anim-dot-pop" : ""}`} 
                        title={`Roll ${rIdx + 1}: ${tier}`}
                      />
                    );
                  })}
                </i>
              </span>
              <span className="relative">
                {fmtStat(sub.type, sub.value)}
                {/* Floating delta value */}
                {isAnimating && upgradeAnimation && (
                  <span
                    key={upgradeAnimation.key}
                    className={`anim-delta-pop absolute right-0 -top-3.5 text-[11px] font-bold whitespace-nowrap pointer-events-none ${rollTierColors[upgradeAnimation.rollTier] ?? "text-muted"}`}
                  >
                    {fmtStat(upgradeAnimation.statType, upgradeAnimation.delta)}
                  </span>
                )}
              </span>
            </li>
          )
        })}
        {previewSubstat && art.subStats.length < 4 && (() => {
          const prevName = SUBSTAT_NAMES[previewSubstat.type] ?? previewSubstat.type;
          const prevIcon = getStatIcon(String(prevName));
          return (
            <li className="flex justify-between items-center py-[1px] px-2 my-0.5 rounded-md opacity-30 text-[#495366] font-semibold">
              <span className="flex items-center gap-1.5">
                {prevIcon && (
                  <img src={prevIcon} alt="" className="w-4 h-4 object-contain invert opacity-60" />
                )}
                <span>{prevName}</span>
              </span>
              <span>{fmtStat(previewSubstat.type, previewSubstat.value)}</span>
            </li>
          );
        })()}
      </ul>
      
      <div className="mt-auto px-4 pb-2 pt-1">
        <div className="h-px bg-black/10 w-full mb-2 opacity-50" />
        <footer 
          className={`flex justify-between px-1 font-genshin text-[#495366] font-semibold ${tierColors[tier] || ""}`}
        >
          <span>{scoreMode === "cv" ? "Crit Value" : "Roll Value"}</span>
          <strong>
            {scoreMode === "cv" ? art.critValue.toFixed(1) : `${Math.round(rollValue(art, priority))}%`}
          </strong>
        </footer>
      </div>
    </article>
  )
}

export { ANIMATION_DURATION_MS }