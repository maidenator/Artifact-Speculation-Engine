import { useMemo, useState } from "react"
import { ARTIFACT_DOMAINS } from "../constants/domains"

const SLOT_SUFFIX_MAP: Record<number, string> = { 0: "4", 1: "2", 2: "5", 3: "1", 4: "3" };

export function DomainSetIcon({ enkaId, fallbackName, className, slot = 0 }: { enkaId?: number; fallbackName: string; className?: string; slot?: number }) {
  const sources = useMemo(() => {
    const fallbackNames = ["GladiatorFlower", "GladiatorFeather", "GladiatorSands", "GladiatorGoblet", "GladiatorCirclet"];
    const fallbackName = fallbackNames[slot] || "GladiatorFlower";
    const fallback = `/icons/artifactset/${fallbackName}.png`;
    
    if (!enkaId) return [fallback];
    
    const suffix = SLOT_SUFFIX_MAP[slot] || "4";
    const iconName = `UI_RelicIcon_${enkaId}_${suffix}`;
    return [
      `/yatta-api/assets/UI/reliquary/${iconName}.png`,
      `/ambr-api/assets/UI/relic/${iconName}.png`,
      fallback,
    ];
  }, [enkaId, slot]);

  const [srcIndex, setSrcIndex] = useState(0);

  return (
    <img
      src={sources[srcIndex]}
      alt={fallbackName}
      title={fallbackName}
      onError={() => setSrcIndex(prev => Math.min(prev + 1, sources.length - 1))}
      className={`object-contain ${className || "w-[30px] h-[30px]"}`}
    />
  );
}

export function SplitDomainIcon({ domain, slot = 0, className = "w-[40px] h-[30px]", iconClassName = "w-[30px] h-[30px]" }: { domain: typeof ARTIFACT_DOMAINS[0], slot?: number, className?: string, iconClassName?: string }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className="absolute inset-0 z-10"
        style={{ clipPath: "polygon(0 0, 70% 0, 30% 100%, 0 100%)" }}
      >
        <div className="absolute left-0 top-0 w-[80%] h-full flex items-center justify-start overflow-visible">
          <DomainSetIcon enkaId={domain.sets[0].enkaId} fallbackName={domain.sets[0].name} className={`${iconClassName} -ml-[10%]`} slot={slot} />
        </div>
      </div>
      <div
        className="absolute inset-0 z-0"
        style={{ clipPath: "polygon(70% 0, 100% 0, 100% 100%, 30% 100%)" }}
      >
        <div className="absolute right-0 top-0 w-[80%] h-full flex items-center justify-end overflow-visible">
          <DomainSetIcon enkaId={domain.sets[1].enkaId} fallbackName={domain.sets[1].name} className={`${iconClassName} -mr-[10%]`} slot={slot} />
        </div>
      </div>
      <div className="absolute inset-0 z-20 pointer-events-none">
        <svg className="w-full h-full text-white/70" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="70" y1="0" x2="30" y2="100" />
        </svg>
      </div>
    </div>
  )
}

export const DOMAIN_OPTIONS = [
  { label: "Any", value: "" },
  ...ARTIFACT_DOMAINS.map((domain) => ({
    label: <SplitDomainIcon domain={domain} />,
    value: domain.id,
  })),
]
