interface AppHeaderProps {
  engineReady: boolean
  engineError: string | null
}

export function AppHeader({ engineReady, engineError }: AppHeaderProps) {
  return (
    <header>
      <h1 className="font-genshin font-bold text-3xl">Artifact Speculation Engine</h1>
      <p className="lede">Simulate resin spending and see what you'd realistically get</p>
      <p className={`status ${engineError ? "bad" : engineReady ? "ok" : ""}`} role="status">
        <span className="dot" />
        {engineError ?? (engineReady ? "Engine ready" : "Loading engine...")}
      </p>
    </header>
  )
}