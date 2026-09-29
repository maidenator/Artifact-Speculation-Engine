interface ActionBarProps {
  canRun: boolean
  loading: boolean
  engineReady: boolean
  engineError: string | null
  onRun: () => void
  onReset: () => void
}

export function ActionBar({ canRun, loading, engineReady, engineError, onRun, onReset }: ActionBarProps) {
  return (
    <div style={{
      position: "fixed",
      bottom: "40px", /* Distance from the bottom of your screen */
      left: "50%",
      transform: "translateX(-50%)", /* Perfectly centers the pill horizontally */
      display: "flex",
      alignItems: "center",
      gap: "12px",
      background: "var(--card)", /* Uses your global dark card theme */
      border: "1px solid var(--line)", 
      padding: "6px 20px 6px 6px", /* Tight on the left, extra space on the right for text */
      borderRadius: "8px", /* Perfect rounded pill shape */
      boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)", /* Strong shadow to force it forward visually */
      zIndex: 99999 /* Guarantees it stays in front of everything */
    }}>
      <button 
        className="primary font-genshin" 
        onClick={onRun} 
        disabled={!canRun}
        style={{ margin: 0, padding: "12px 24px", borderRadius: "8px" }}
      >
        {loading ? "Running..." : "Run simulation"}
      </button>
      
      <button 
        className="ghost font-genshin" 
        onClick={onReset} 
        disabled={loading}
        style={{ margin: 0, padding: "12px 8px" }}
      >
        Reset settings
      </button>

      {!engineReady && !engineError && (
        <span 
          className="hint font-genshin" 
          style={{ 
            position: "absolute", 
            top: "-30px", 
            left: "50%", 
            transform: "translateX(-50%)", 
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