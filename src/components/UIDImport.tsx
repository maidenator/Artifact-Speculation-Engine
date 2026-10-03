import { useState, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import { CompactArtifactCard } from "./CompactArtifactCard"
import { SubstatPriority } from "./SubstatPriority"
import { parseEnkaData } from "@/utils/enka"
import { scoreArtifact, weightsFromPriority } from "@/utils/scoring"
import type { CharacterOutput, ScoreMode, PlayerProfile, SubstatWeight } from "@/types/artifact"

// --- Icons ---
const StatIcon = ({ type }: { type: number | string }) => {
  // 2000=HP, 2001=ATK, 2002=DEF, 28=EM, 20=CR, 22=CD, 23=ER
  const iconFiles: Record<string, string> = {
    "2000": "hp.png",
    "2001": "attack.png",
    "2002": "defense.png",
    "28": "elemental_mastery.png",
    "20": "crit_rate.png",
    "22": "crit_damage.png",
    "23": "energy_recharge.png",
  }
  const file = iconFiles[String(type)]
  if (!file) return <div className="w-4 h-4 bg-white/20 rounded-full" />
  return <img src={`/icons/stat/${file}`} alt="Stat Icon" className="w-4 h-4 object-contain opacity-80 mix-blend-screen" />
}

const formatStat = (val: number | undefined, isPercent: boolean) => {
  if (val === undefined) return "0"
  if (isPercent) return (val * 100).toFixed(1) + "%"
  return Math.round(val).toLocaleString()
}

// --- Draggable Modal Component ---
const DraggableModal = ({ 
  char, 
  close, 
  priority, 
  setPriority, 
  scoreMode, 
  setScoreMode, 
  substatWeights 
}: { 
  char: CharacterOutput, 
  close: () => void,
  priority: number[],
  setPriority: (p: number[]) => void,
  scoreMode: ScoreMode,
  setScoreMode: (m: ScoreMode) => void,
  substatWeights: SubstatWeight[]
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number, startY: number, initialX: number, initialY: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: offset.x,
      initialY: offset.y
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current) {
      setOffset({
        x: dragRef.current.initialX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.initialY + (e.clientY - dragRef.current.startY)
      })
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const sortedArtifacts = useMemo(() => {
    const arts = char.artifacts
    if (priority.length === 0) return arts
    return [...arts].sort((a, b) => scoreArtifact(b, substatWeights) - scoreArtifact(a, substatWeights))
  }, [char, priority, substatWeights])

  // Moved to top-level

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[150]" onClick={close} />
      
      {/* Draggable Window */}
      <div 
        className="fixed top-1/2 left-1/2 z-[200] bg-page border border-line rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.5)] w-[90vw] max-w-[900px] flex flex-col"
        style={{ transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`, maxHeight: '85vh' }}
      >
        {/* Title Bar */}
        <div 
          className="bg-card-inner border-b border-line p-3 flex justify-between items-center cursor-move touch-none select-none rounded-t-lg"
          onPointerDown={onPointerDown} 
          onPointerMove={onPointerMove} 
          onPointerUp={onPointerUp}
        >
          <div className="flex items-center gap-3">
            <img src={char.iconUrl} className="w-8 h-8 rounded-full border border-line" alt={char.name} draggable={false} />
            <span className="font-genshin font-bold text-gold">{char.name}</span>
          </div>
          <button 
            onPointerDown={(e) => { e.stopPropagation(); close(); }} 
            className="w-8 h-8 flex items-center justify-center rounded bg-transparent hover:bg-white/10 text-muted hover:text-white transition-colors cursor-pointer border-none" 
            aria-label="Close window"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row p-4 gap-6 custom-scrollbar">
          
          {/* Left Side: Stats and Config */}
          <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-6">
            
            {/* Stats Panel */}
            <div className="bg-card border border-line rounded-lg p-4">
              <h3 className="font-genshin font-bold text-white text-[15px] mb-4 border-b border-white/10 pb-2">Combat Stats</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-muted font-genshin flex items-center gap-2"><StatIcon type="2000"/> Max HP</span>
                  <span className="text-[14px] text-ink font-genshin font-bold">{formatStat(char.stats?.[2000], false)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-muted font-genshin flex items-center gap-2"><StatIcon type="2001"/> ATK</span>
                  <span className="text-[14px] text-ink font-genshin font-bold">{formatStat(char.stats?.[2001], false)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-muted font-genshin flex items-center gap-2"><StatIcon type="2002"/> DEF</span>
                  <span className="text-[14px] text-ink font-genshin font-bold">{formatStat(char.stats?.[2002], false)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-muted font-genshin flex items-center gap-2"><StatIcon type="28"/> Elemental Mastery</span>
                  <span className="text-[14px] text-ink font-genshin font-bold">{formatStat(char.stats?.[28], false)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-muted font-genshin flex items-center gap-2"><StatIcon type="20"/> Crit Rate</span>
                  <span className="text-[14px] text-ink font-genshin font-bold">{formatStat(char.stats?.[20], true)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-muted font-genshin flex items-center gap-2"><StatIcon type="22"/> Crit DMG</span>
                  <span className="text-[14px] text-ink font-genshin font-bold">{formatStat(char.stats?.[22], true)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-muted font-genshin flex items-center gap-2"><StatIcon type="23"/> Energy Recharge</span>
                  <span className="text-[14px] text-ink font-genshin font-bold">{formatStat(char.stats?.[23], true)}</span>
                </div>
              </div>
            </div>

            {/* Config Panel */}
            <div className="bg-card border border-line rounded-lg p-4">
               <div className="flex justify-between items-center mb-3">
                  <h3 className="font-genshin font-bold text-white text-[15px]">Sorting</h3>
                  <div className="font-genshin inline-flex border border-line rounded-md overflow-hidden bg-black/15">
                    <button
                      type="button"
                      onClick={() => setScoreMode("cv")}
                      className={`px-2 py-1 text-[11px] border-0 cursor-pointer ${scoreMode === "cv" ? "bg-gold text-[#121620] font-bold" : "bg-transparent text-muted hover:text-white"}`}
                    >
                      CV
                    </button>
                    <button
                      type="button"
                      onClick={() => setScoreMode("rv")}
                      className={`px-2 py-1 text-[11px] border-0 cursor-pointer ${scoreMode === "rv" ? "bg-gold text-[#121620] font-bold" : "bg-transparent text-muted hover:text-white"}`}
                    >
                      RV
                    </button>
                  </div>
               </div>
               <SubstatPriority priority={priority} setPriority={setPriority} />
            </div>
          </div>

          {/* Right Side: Artifacts */}
          <div className="flex-1">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] auto-rows-max gap-3 pb-10">
                {sortedArtifacts.map((art, idx) => (
                  <CompactArtifactCard
                    key={`${art.slot}-${art.mainStat.type}-${idx}`}
                    artifact={art}
                    priority={priority}
                    scoreMode={scoreMode}
                  />
                ))}
                {sortedArtifacts.length === 0 && (
                  <div className="col-span-full flex items-center justify-center min-h-[200px] text-muted font-genshin">
                    No 5-star artifacts equipped.
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}

export function UIDImport() {
  const [uid, setUid] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [characters, setCharacters] = useState<CharacterOutput[]>([])
  
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null)

  const [priority, setPriority] = useState<number[]>([])
  const [scoreMode, setScoreMode] = useState<ScoreMode>("cv")
  const substatWeights = useMemo(() => weightsFromPriority(priority), [priority])

  const handleImport = async () => {
    const trimmed = uid.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setProfile(null)
    setCharacters([])
    setSelectedCharId(null)

    try {
      const apiUrl = `https://enka.network/api/uid/${trimmed}`
      const res = await fetch(import.meta.env.DEV ? `/enka-api/api/uid/${trimmed}` : `https://api.codetabs.com/v1/proxy?quest=${apiUrl}`)
      if (!res.ok) {
        if (res.status === 400) throw new Error("Invalid UID format")
        if (res.status === 404) throw new Error("Player not found")
        if (res.status === 424) throw new Error("Enka API is under maintenance")
        if (res.status === 429) throw new Error("Rate limited by Enka API")
        if (res.status === 500) throw new Error("Enka API server error")
        throw new Error(`Enka API returned ${res.status}`)
      }

      const data = await res.json()
      const parsed = parseEnkaData(data)
      if (parsed) {
        setProfile(parsed.profile)
        setCharacters(parsed.characters)
      } else {
        setError("Invalid response from Enka API")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const selectedChar = useMemo(() => characters.find(c => c.avatarId === selectedCharId) || null, [characters, selectedCharId])

  // --- View 1: Entry Point (Centered Input) ---
  if (!profile && !loading && !error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-5 relative overflow-hidden bg-page">
        <div className="z-10 bg-card/60 backdrop-blur-xl border border-white/10 p-10 rounded-2xl shadow-2xl flex flex-col items-center max-w-md w-full">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img src="/icons/speculation.png" alt="Logo" className="w-14 h-14 object-contain drop-shadow-md shrink-0" />
            <h1 className="font-genshin font-bold text-[32px] text-gold tracking-wide leading-[1.2] text-left">Artifact<br/>Speculation</h1>
          </div>
          <p className="font-genshin text-muted text-center text-[14px] mb-8 mt-4">Enter your Genshin Impact UID to fetch your showcased characters and their artifacts via Enka.Network.</p>
          
          <div className="flex flex-col w-full gap-4">
            <input
              type="text"
              placeholder="Enter UID..."
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              className="font-genshin w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl text-white text-[18px] text-center focus:outline-none focus:border-gold/50 transition-colors placeholder:text-white/20"
            />
            <button
              onClick={handleImport}
              disabled={!uid.trim()}
              className="font-genshin font-bold text-[#211c14] bg-gradient-to-b from-[#d3a352] to-[#b88636] w-full py-4 rounded-xl cursor-pointer hover:brightness-115 active:translate-y-[2px] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed border-none text-[16px] transition-all shadow-lg"
            >
              Fetch Profile
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- View 2: Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-8">
        <img src="/icons/sumeru.png" alt="Loading Element" className="w-48 h-48 object-contain animate-shimmer-mask" />
        <div className="font-genshin text-gold text-[24px] animate-shimmer-mask tracking-widest">Connecting to Irminsul...</div>
      </div>
    )
  }

  // --- View 3: Error State ---
  if (error && !profile) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-5">
        <div className="bg-card border border-red-500/30 p-8 rounded-xl max-w-md w-full text-center">
           <h2 className="font-genshin text-red-400 text-xl mb-4">Error</h2>
           <p className="font-genshin text-white/70 mb-6">{error}</p>
           <button onClick={() => setError(null)} className="font-genshin px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer border-none">Try Again</button>
        </div>
      </div>
    )
  }

  // --- View 4: Profile & Character Cards ---
  return (
    <div className="font-genshin max-w-[1200px] mx-auto px-5 pt-12 pb-24 min-h-screen box-border flex flex-col items-center">
      
      {/* Profile Header */}
      {profile && (
        <div className="w-full flex flex-col items-center mb-16 animate-fade-in">
          <div className="relative">
            {profile.profilePicture ? (
              <div className="w-24 h-24 rounded-full bg-card border-2 border-gold flex items-center justify-center text-[12px] text-muted overflow-hidden shadow-[0_0_20px_rgba(211,163,82,0.2)]">
                 Avatar {profile.profilePicture}
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-card border-2 border-gold flex items-center justify-center text-gold text-3xl font-bold shadow-[0_0_20px_rgba(211,163,82,0.2)]">
                {profile.nickname.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-page border border-gold text-gold text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-md">
              Lv. {profile.level}
            </div>
          </div>
          
          <h1 className="text-[32px] text-white font-bold mt-6 mb-2">{profile.nickname}</h1>
          {profile.signature && <p className="text-muted text-[14px] max-w-[500px] text-center mb-6 italic">"{profile.signature}"</p>}
          
          <div className="flex gap-8 mt-2 text-[14px]">
             <div className="flex flex-col items-center">
               <span className="text-muted mb-1 text-[11px] uppercase tracking-widest">Achievements</span>
               <span className="text-gold font-bold text-[18px]">{profile.achievementCount}</span>
             </div>
             <div className="w-px h-10 bg-white/10" />
             <div className="flex flex-col items-center">
               <span className="text-muted mb-1 text-[11px] uppercase tracking-widest">Spiral Abyss</span>
               <span className="text-gold font-bold text-[18px]">{profile.abyssFloor}-{profile.abyssChamber}</span>
             </div>
             {profile.worldLevel !== undefined && (
               <>
                 <div className="w-px h-10 bg-white/10" />
                 <div className="flex flex-col items-center">
                   <span className="text-muted mb-1 text-[11px] uppercase tracking-widest">World Level</span>
                   <span className="text-gold font-bold text-[18px]">{profile.worldLevel}</span>
                 </div>
               </>
             )}
          </div>
        </div>
      )}

      {/* Character Cards Grid */}
      <div className="w-full">
        <h2 className="text-[20px] text-white/90 font-bold mb-6 text-center border-b border-white/10 pb-4">Showcased Characters</h2>
        
        {characters.length === 0 ? (
          <div className="text-center text-muted py-10 bg-card rounded-xl border border-white/5">
            No characters found on profile. Make sure "Show Character Details" is enabled in-game.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-w-3xl mx-auto w-full">
            {characters.map(char => (
              <div 
                key={char.avatarId}
                onClick={() => setSelectedCharId(char.avatarId)}
                className="group bg-[#161821] border-l-4 border-l-transparent hover:border-l-gold border-y border-r border-white/5 rounded-r-xl rounded-l-sm pl-4 pr-5 py-3.5 flex items-center gap-5 cursor-pointer hover:bg-white/[0.04] transition-all shadow-lg"
              >
                {/* Zone 1: Portrait */}
                <div className="relative shrink-0">
                  <img src={char.iconUrl} alt={char.name} className="w-14 h-14 sm:w-[68px] sm:h-[68px] rounded-full border-2 border-white/10 group-hover:border-gold/30 object-cover bg-black/40 transition-colors" />
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#0d0f17] border border-white/15 text-white text-[9px] px-1.5 py-px rounded-full font-bold whitespace-nowrap">
                    Lv. {char.level}
                  </div>
                </div>

                {/* Zone 2: Identity — fixed width so cards align */}
                <div className="shrink-0 w-[90px] sm:w-[110px]">
                  <h3 className="font-bold text-[15px] sm:text-[17px] text-white truncate leading-tight">{char.name}</h3>
                  <div className="text-[12px] text-gold font-bold mt-1">C{char.constellation}</div>
                </div>

                {/* Zone 3: Stats — fills all remaining space */}
                {char.stats && (
                  <div className="hidden md:flex flex-1 items-center justify-center min-w-0">
                    <div className="grid grid-cols-4 gap-x-5 gap-y-1.5 w-full max-w-[420px]">
                      <div className="flex items-center gap-1.5" title="Max HP">
                        <StatIcon type="2000" />
                        <span className="text-white/60 text-[11px] font-medium tabular-nums">{formatStat(char.stats[2000], false)}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="ATK">
                        <StatIcon type="2001" />
                        <span className="text-white/60 text-[11px] font-medium tabular-nums">{formatStat(char.stats[2001], false)}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Crit Rate">
                        <StatIcon type="20" />
                        <span className="text-white text-[11px] font-bold tabular-nums">{formatStat(char.stats[20], true)}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Energy Recharge">
                        <StatIcon type="23" />
                        <span className="text-white/60 text-[11px] font-medium tabular-nums">{formatStat(char.stats[23], true)}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="DEF">
                        <StatIcon type="2002" />
                        <span className="text-white/60 text-[11px] font-medium tabular-nums">{formatStat(char.stats[2002], false)}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Elemental Mastery">
                        <StatIcon type="28" />
                        <span className="text-white/60 text-[11px] font-medium tabular-nums">{formatStat(char.stats[28], false)}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Crit DMG">
                        <StatIcon type="22" />
                        <span className="text-white text-[11px] font-bold tabular-nums">{formatStat(char.stats[22], true)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="w-px self-stretch bg-white/8 hidden sm:block shrink-0" />

                {/* Zone 4: Weapon */}
                {char.weapon && (
                  <div className="flex items-center gap-3 shrink-0 min-w-[85px]">
                    <img src={char.weapon.iconUrl} className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-md" alt="Weapon" />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-muted leading-tight whitespace-nowrap">Lv. {char.weapon.level}</span>
                      <span className="text-[11px] text-gold font-bold leading-tight mt-0.5 whitespace-nowrap">R{char.weapon.refinement}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Modal for Character Details */}
      {selectedChar && (
        <DraggableModal 
          char={selectedChar} 
          close={() => setSelectedCharId(null)}
          priority={priority}
          setPriority={setPriority}
          scoreMode={scoreMode}
          setScoreMode={setScoreMode}
          substatWeights={substatWeights}
        />
      )}

      {/* Another Search Button */}
      <div className="mt-16">
         <button onClick={() => { setProfile(null); setCharacters([]); setUid(""); }} className="font-genshin px-6 py-2 border border-white/20 hover:bg-white/10 rounded-full text-muted transition-colors cursor-pointer text-[13px]">
           Search Another UID
         </button>
      </div>

    </div>
  )
}

