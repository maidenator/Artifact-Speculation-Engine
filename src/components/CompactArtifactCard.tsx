import { useMemo, useState, useEffect } from "react"
import { MAIN_STAT_NAMES, SLOT_NAMES, SUBSTAT_NAMES } from "../constants/artifactData"
import { fmtStat } from "../utils/format"
import { inferRollTiers, inferRollCount, cvTier, rvTier, rollValue } from "../utils/scoring"
import type { ArtifactOutput, ScoreMode } from "../types/artifact"



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

const rollTierColors: Record<string, string> = {
  "max": "text-bad",
  "high": "text-gold",
  "mid": "text-[#65a30d]",
  "low": "text-[#0d9488]",
  "min": "text-muted"
};

export function CompactArtifactCard({ artifact: art, priority = [], scoreMode = "cv" }: { artifact: ArtifactOutput, priority?: number[], scoreMode?: ScoreMode }) {
  const tier = scoreMode === "cv" ? cvTier(art.critValue) : rvTier(rollValue(art, priority));
  const tierColors: Record<string, string> = {
    "cv-max": "text-bad",
    "cv-top": "text-gold",
    "cv-high": "text-[#65a30d]",
    "cv-mid": "text-[#0d9488]",
    "cv-low": "text-muted"
  };

  const mainStatName = MAIN_STAT_NAMES[art.mainStat.type] ?? art.mainStat.type;
  const mainStatIcon = getStatIcon(String(mainStatName));

  const fallbackIcon = `/icons/artifactset/Gladiator${SLOT_NAMES[art.slot] ?? "Flower"}.png`;

  const sources = useMemo(() => {
    if (!art.iconUrl) return [fallbackIcon];
    const iconName = art.iconUrl.split("/").pop()?.replace(".png", "") || art.iconUrl;
    return [
      `/yatta-api/assets/UI/reliquary/${iconName}.png`,
      `/ambr-api/assets/UI/relic/${iconName}.png`,
      fallbackIcon,
    ];
  }, [art.iconUrl, art.slot, fallbackIcon]);

  const [srcIndex, setSrcIndex] = useState(0);

  useEffect(() => {
    setSrcIndex(0);
  }, [art.iconUrl]);

  return (
    <article className="flex bg-[#e9e5dc] rounded-md overflow-hidden border border-line shadow-sm hover:border-gold/50 transition-colors w-full h-[110px]">

      {/* Left Box (Image & Main Stat) */}
      <div className="w-[150px] shrink-0 bg-gradient-to-br from-[#a75727] to-[#d89643] relative overflow-hidden flex flex-col p-2 border-r border-[#8a421f]/30">
        <img
          src={sources[srcIndex] || fallbackIcon}
          alt=""
          onError={() => setSrcIndex((prev) => Math.min(prev + 1, sources.length - 1))}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-contain opacity-90 drop-shadow-md mix-blend-luminosity"
          style={{ mixBlendMode: 'normal' }}
        />

        {/* Main stat icon */}
        {mainStatIcon && (
          <div className="absolute top-1.5 right-1.5 bg-black/30 rounded-full p-1 backdrop-blur-sm shadow-sm z-20">
            <img src={mainStatIcon} alt={String(mainStatName)} className="w-5 h-5 object-contain opacity-90" />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-start w-full text-white font-genshin drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-auto">
          <strong className="text-[26px] font-bold leading-none tracking-tight mb-1">
            {fmtStat(art.mainStat.type, art.mainStat.value).startsWith('+') ? fmtStat(art.mainStat.type, art.mainStat.value) : `+${fmtStat(art.mainStat.type, art.mainStat.value)}`}
          </strong>
          <div className="flex items-center justify-between w-full gap-1">
            <div className="flex gap-[0.5px]">
              {[...Array(5)].map((_, idx) => (
                <svg key={idx} className="w-3.5 h-3.5 text-[#f9c03b] drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="bg-[#3c4556] text-white px-1 py-0.5 rounded-[3px] text-[10px] font-bold shadow-sm leading-none">
              +{art.level}
            </span>
          </div>
        </div>
      </div>

      {/* Right Box (Substats List) */}
      <div className="flex-1 flex flex-col justify-center px-2 py-1 gap-[2px]">
        {art.subStats.map((sub, i) => {
          const subName = SUBSTAT_NAMES[sub.type] ?? sub.type;
          const subIcon = getStatIcon(String(subName));
          const effectiveRolls = sub.rolls > 1 ? sub.rolls : inferRollCount(sub.type, sub.value);
          const rollHistory = (sub as typeof sub & { rollTiers?: string[] }).rollTiers || inferRollTiers(sub.type, sub.value, effectiveRolls);
          const formattedVal = fmtStat(sub.type, sub.value);
          const isPriority = priority.includes(sub.type);

          return (
            <div key={i} className={`flex items-center justify-between w-full px-1.5 py-[5px] rounded-md transition-colors ${isPriority ? "bg-black/10" : ""}`}>
              <div className="flex items-center gap-1.5 min-w-0">
                {subIcon && (
                  <img src={subIcon} alt="" className="w-3.5 h-3.5 object-contain invert opacity-60 shrink-0" />
                )}
                <span className={`text-[13px] font-genshin font-bold leading-none whitespace-nowrap ${isPriority ? "text-[#3b4354]" : "text-[#495366]/90"}`}>
                  {subName}
                </span>
                <div className="flex items-center gap-[3px] ml-0.5">
                  {rollHistory.map((tier: string, rIdx: number) => (
                    <span
                      key={rIdx}
                      className={`w-1.5 h-1.5 rounded-full bg-current ${rollTierColors[tier] ?? "text-muted"}`}
                    />
                  ))}
                </div>
              </div>
              <span className={`text-[14px] font-genshin font-bold text-right leading-none ${isPriority ? "text-[#3b4354]" : "text-[#495366]"}`}>
                {formattedVal.startsWith('+') ? formattedVal : `+${formattedVal}`}
              </span>
            </div>
          )
        })}
      </div>

      <div className="w-px bg-black/10 my-2 opacity-50 shrink-0" />

      {/* Rightmost Box (CV / RV) */}
      <div className="w-[60px] shrink-0 flex flex-col items-center justify-center font-genshin px-1">
        <span className="text-[#495366]/80 text-[11px] font-bold mb-1">
          {scoreMode === "cv" ? "CV" : "RV"}
        </span>
        <strong className={`text-[16px] font-bold leading-none ${tierColors[tier] || "text-[#495366]"}`}>
          {scoreMode === "cv" ? art.critValue.toFixed(1) : `${Math.round(rollValue(art, priority))}%`}
        </strong>
      </div>

    </article>
  )
}
