import { MAIN_STAT_NAMES, SLOT_NAMES, SUBSTAT_NAMES } from "../constants/artifactData"
import { fmtStat } from "../utils/format"
import { rvTier, cvTier, rollValue, inferRollTiers } from "../utils/scoring"
import type { ArtifactOutput, ScoreMode } from "../types/artifact"
import { useMemo, useState } from "react"
import { ARTIFACT_DOMAINS } from "../constants/domains"

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

  const setName = useMemo(() => {
    if (!art.setId) return "Gladiator's Finale";
    for (const domain of ARTIFACT_DOMAINS) {
      for (const set of domain.sets) {
        if (set.id === art.setId || set.enkaId === art.setId || set.name === art.setId) {
          return set.name;
        }
      }
    }
    return String(art.setId);
  }, [art.setId]);

  const tier = scoreMode === "cv" ? cvTier(art.critValue) : rvTier(rollValue(art, priority));
  const tierColors: Record<string, string> = {
    "cv-max": "[&_strong]:text-bad",
    "cv-top": "[&_strong]:text-gold",
    "cv-high": "[&_strong]:text-[#65a30d]",
    "cv-mid": "[&_strong]:text-[#0d9488]",
    "cv-low": "[&_strong]:text-muted"
  };

  const fallbackIcon = `/icons/artifactset/Gladiator${SLOT_NAMES[art.slot] ?? "Flower"}.png`;

  const sources = useMemo(() => {
    if (!art.iconUrl) return [fallbackIcon];
    const iconName = art.iconUrl.split("/").pop()?.replace(".png", "") || art.iconUrl;
    const yattaBase = import.meta.env.DEV ? "/yatta-api" : "https://gi.yatta.moe";
    return [
      `${yattaBase}/assets/UI/reliquary/${iconName}.png`,
      `https://api.ambr.top/assets/UI/relic/${iconName}.png`,
      fallbackIcon,
    ];
  }, [art.iconUrl, art.slot, fallbackIcon]);

  const [srcIndex, setSrcIndex] = useState(0);

  return (
    <article className="bg-[#e9e5dc] border border-line rounded-md overflow-hidden flex flex-col h-max shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-transform duration-200 hover:-translate-y-[2px]">
      {/* Top Section (Header + Main Stat) */}
      <div className="flex flex-col relative overflow-hidden">
        {/* Set Name Bar */}
        <div className="bg-[#b85b2e] flex justify-between items-center px-3 py-1.5 border-b-2 border-[#8a421f] text-white z-20 shadow-sm relative">
          <div className="flex items-center gap-2">
            <span className="bg-black/35 px-1.5 py-0.5 rounded text-[11.5px] font-bold">#{rank}</span>
            {setName && (
              <span className="font-genshin text-[13px] font-semibold tracking-wide drop-shadow-sm opacity-95">{setName}</span>
            )}
          </div>
        </div>

        {/* Main Stat Area with Background Image */}
        <div
          className="flex flex-col relative overflow-hidden bg-gradient-to-br from-[#a75727] to-[#d89643]"
        >
          {/* Background icon watermark (optional) */}
          {mainStatIcon && (
            <img
              src={mainStatIcon}
              alt=""
              className="absolute -left-4 top-1/2 -translate-y-1/2 w-32 h-32 opacity-[0.05] object-contain pointer-events-none z-0"
            />
          )}

          <div className="absolute top-1/2 -translate-y-1/2 right-0 pointer-events-none z-10">
            <img
              src={sources[srcIndex] || fallbackIcon}
              alt=""
              onError={() => setSrcIndex((prev) => Math.min(prev + 1, sources.length - 1))}
              className="w-[120px] h-[120px] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
            />
          </div>

          <div className="px-4 pt-2 text-white font-genshin text-[16px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] z-10 relative flex items-center gap-1.5">
            {SLOT_ICONS[art.slot] && (
              <img src={SLOT_ICONS[art.slot]} alt="" className="w-5 h-5 object-contain opacity-100" />
            )}
            <span>{SLOT_NAMES[art.slot] ?? "Piece"}</span>
          </div>

          <div className="flex justify-between items-end px-4 pb-3 pt-6 font-genshin relative z-10">
            <div className="flex flex-col gap-0">
              <span className="text-[#d6d3ce] text-[14px] font-bold tracking-[0.5px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {mainStatName}
              </span>
              <strong className="text-white text-[34px] font-bold leading-[1.05] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {fmtStat(art.mainStat.type, art.mainStat.value)}
              </strong>

              {/* Stars */}
              <div className="flex gap-[1px] mt-1">
                {[...Array(5)].map((_, idx) => (
                  <svg key={idx} className="w-[20px] h-[20px] text-[#f9c03b] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3">
        <span className="bg-[#3c4556] text-white px-1.5 py-0.5 rounded-[3px] text-[13px] font-bold inline-block mb-2 shadow-sm font-genshin leading-none">
          +{art.level}
        </span>
        <ul className="list-none m-0 flex flex-col gap-0 font-genshin text-[13.5px] tracking-[0.3px] font-normal transform-gpu">
          {art.subStats.map((sub, i) => {
            const subName = SUBSTAT_NAMES[sub.type] ?? sub.type;
            const subIcon = getStatIcon(String(subName));

            const isPriority = priority.includes(sub.type);

            const rollHistory = (sub as typeof sub & { rollTiers?: string[] }).rollTiers || inferRollTiers(sub.type, sub.value, sub.rolls);

            const isAnimating = upgradeAnimation?.substatIndex === i;

            return (
              <li
                key={`${i}-${upgradeAnimation?.key ?? 0}`}
                className={`flex justify-between items-center py-0 px-1 rounded-md text-[#495366] font-semibold relative ${isPriority ? "bg-black/5" : "bg-transparent"} ${isAnimating ? "anim-row-flash" : ""}`}
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  {subIcon && (
                    <img src={subIcon} alt="" className="w-4 h-4 object-contain invert opacity-60 shrink-0" />
                  )}
                  <span className="truncate">{subName}</span>

                  <i className="not-italic text-cyan tracking-[2px] ml-1.5 inline-flex gap-1 shrink-0">
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
                <span className="relative shrink-0 ml-2">
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
      </div>

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