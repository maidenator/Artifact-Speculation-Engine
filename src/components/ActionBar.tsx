import { useState } from "react"

interface ActionBarProps {
  canRun: boolean
  loading: boolean
  engineReady: boolean
  engineError: string | null
  onRun: () => void
  onReset: () => void
}

export function ActionBar({ canRun, loading, engineReady, engineError, onRun, onReset }: ActionBarProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="relative z-[90] flex flex-col w-full mt-4">
      
      {showMenu && (
        <div className="absolute bottom-full mb-3 bg-card border border-line rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] min-w-[140px] max-h-[50px] flex flex-col left-0 w-full">
          <button 
            className="font-genshin px-4 py-2.5 text-muted bg-transparent border border-transparent rounded-md cursor-pointer transition-all hover:text-[#ff5c5c] hover:border-[#ff5c5c] hover:bg-[#ff5c5c]/10 m-0 w-full text-center" 
            onClick={() => {
              onReset()
              setShowMenu(false)
            }}
            disabled={loading}
          >
            Reset settings
          </button>
        </div>
      )}

      {/* 2. The Split Button Container */}
      <div className="flex items-stretch h-12 rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-line w-full">
        
        {/* Main Action Button */}
        <button 
          className={`font-genshin font-bold text-[#211c14] bg-gradient-to-b from-[#d3a352] to-[#b88636] cursor-pointer hover:brightness-115 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed m-0 px-6 border-none rounded-none h-full flex flex-1 items-center justify-center text-[1.05rem] transition-all duration-200 ease-out ${loading ? "animate-glow-pulse" : ""}`} 
          onClick={onRun} 
          disabled={!canRun}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Simulating...
            </span>
          ) : "Run simulation"}
        </button>
        
        {/* Vertical Divider Line */}
        <div className="w-[1px] bg-black/15 z-[2]" />

        {/* Toggle Arrow Button */}
        <button 
          className="font-genshin font-bold text-[#211c14] bg-gradient-to-b from-[#d3a352] to-[#b88636] cursor-pointer hover:brightness-115 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed m-0 px-4 border-none rounded-none h-full flex items-center justify-center transition-all duration-200 ease-out" 
          onClick={() => setShowMenu(!showMenu)}
        >
          {/* SVG Chevron for a perfectly centered '^' shape that flips when opened */}
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={`transition-transform duration-50 ease-in-out ${showMenu ? "rotate-180" : ""}`}
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </div>

      {!engineReady && !engineError && (
        <span className="font-genshin absolute -top-[30px] whitespace-nowrap text-muted text-[0.85em]">
          Waiting for the engine to load
        </span>
      )}
    </div>
  )
}