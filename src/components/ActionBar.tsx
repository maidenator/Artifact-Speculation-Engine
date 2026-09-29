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
    <div className="actions">
      <button className="primary font-genshin" onClick={onRun} disabled={!canRun}>
        {loading ? "Running..." : "Run simulation"}
      </button>
      <button className="ghost font-genshin" onClick={onReset} disabled={loading}>
        Reset settings
      </button>
      {!engineReady && !engineError && <span className="hint font-genshin">Waiting for the engine to load</span>}
    </div>
  )
}