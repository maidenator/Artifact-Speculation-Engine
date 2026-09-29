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
    <div style={{
      position: "fixed",
      bottom: "40px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 99999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      
      {/* 1. The Popup Menu (Appears above the button when arrow is clicked) */}
      {showMenu && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          marginBottom: "12px",
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          minWidth: "140px",
          maxHeight: "50px",
          display: "flex",
          flexDirection: "column"
        }}>
          <button 
            className="ghost font-genshin" 
            onClick={() => {
              onReset()
              setShowMenu(false)
            }}
            disabled={loading}
            style={{ 
              margin: 0, 
              padding: "10px 16px", 
              width: "100%", 
              textAlign: "center" 
            }}
          >
            Reset settings
          </button>
        </div>
      )}

      {/* 2. The Split Button Container */}
      <div style={{
        display: "flex",
        alignItems: "stretch",
        height: "48px",
        borderRadius: "12px", /* Kept your 12px setting */
        overflow: "hidden", /* Clips the inner square buttons into a pill shape */
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
        border: "1px solid var(--line)"
      }}>
        
        {/* Main Action Button */}
        <button 
          className="primary font-genshin" 
          onClick={onRun} 
          disabled={!canRun}
          style={{
            margin: 0,
            padding: "0 24px",
            border: "none",
            borderRadius: 0, /* Radius is handled by the wrapper */
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.05rem"
          }}
        >
          {loading ? "Running..." : "Run simulation"}
        </button>
        
        {/* Vertical Divider Line */}
        <div style={{ width: "1px", background: "rgba(0, 0, 0, 0.15)", zIndex: 2 }} />

        {/* Toggle Arrow Button */}
        <button 
          className="primary font-genshin" 
          onClick={() => setShowMenu(!showMenu)}
          style={{
            margin: 0,
            padding: "0 16px",
            border: "none",
            borderRadius: 0,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
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
            style={{
              transform: showMenu ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease"
            }}
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </div>

      {!engineReady && !engineError && (
        <span 
          className="hint font-genshin" 
          style={{ 
            position: "absolute", 
            top: "-30px", 
            whiteSpace: "nowrap",
            color: "var(--muted)",
            fontSize: "0.85em" 
          }}
        >
          Waiting for the engine to load
        </span>
      )}
    </div>
  )
}