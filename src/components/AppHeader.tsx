interface AppHeaderProps {
  engineReady: boolean
  engineError: string | null
}

export function AppHeader({ engineReady, engineError }: AppHeaderProps) {
  return (
    <header>
      <h1 className="font-genshin font-bold text-[28px] text-gold mb-1.5 leading-[1.2] tracking-[0.5px]">Artifact Speculation Engine</h1>
      <p className="font-genshin text-muted max-w-[60ch] mb-2.5">Simulate resin spending and see what you'd realistically get</p>
      <p className={`font-genshin inline-flex items-center gap-2 mb-[22px] text-[13px] ${engineError ? "text-bad" : "text-muted"}`} role="status">
        <span className={`w-2 h-2 rounded-full ${engineError ? "bg-bad" : engineReady ? "bg-ok" : "bg-muted"}`} />
        {engineError ?? (engineReady ? "Engine ready" : "Loading engine...")}
      </p>
    </header>
  )
}