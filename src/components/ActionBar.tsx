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
      <button className="primary" onClick={onRun} disabled={!canRun}>
        {loading ? "Running..." : "Run simulation"}
      </button>
      <button className="ghost" onClick={onReset} disabled={loading}>Reset settings</button>
      {!engineReady && !engineError && <span className="hint">Waiting for the engine to load</span>}
    </div>
  )
}