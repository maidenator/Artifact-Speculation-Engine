import { useState } from "react"
import { SideNav, type AppPage } from "./components/SideNav"
import { AppHeader } from "./components/AppHeader"
import { ResinConfig } from "./components/ResinConfig"
import { SpeculatorConfig } from "./components/SpeculatorConfig"
import { ActionBar } from "./components/ActionBar"
import { ResultsView } from "./components/ResultsView"
import { ArtifactSandbox } from "./components/ArtifactSandbox"
import { RESIN_PER_RUN } from "./constants/resin"
import { useDockedScroll } from "./hooks/useDockedScroll"
import { useSimulationSettings } from "./hooks/useSimulationSettings"
import { useSimulationWorkers } from "./hooks/useSimulationWorkers"


export default function App() {
  const appRef = useDockedScroll<HTMLDivElement>()
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentPage, setCurrentPage] = useState<AppPage>("speculator")

  const settings = useSimulationSettings(state => state.settings)
  const resetSettings = useSimulationSettings(state => state.resetSettings)

  const { engineReady, engineError, loading, runError, result, ranMode, ranPriority, elapsedMs, run } =
    useSimulationWorkers()

  const canRun = engineReady && !loading && settings.resinBudget >= RESIN_PER_RUN
  
  const handleRun = async () => {
    if (!canRun) return
    setIsSimulating(true)
    try {
      await run(settings)
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <>
      <SideNav currentPage={currentPage} onNavigate={setCurrentPage} />

      {currentPage === "speculator" && (
        <>
          <div className="font-genshin max-w-[1400px] mx-auto px-5 pt-9 pb-[72px] min-h-screen text-[15px] leading-relaxed box-border lg:h-auto" ref={appRef}>
            <div className="relative bg-page z-[100] pt-9 pb-4 mb-3">
              <AppHeader engineReady={engineReady} engineError={engineError} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 lg:h-auto">
              <aside className="lg:h-auto lg:max-h-[calc(100vh-72px)] lg:overflow-y-auto">
                <ResinConfig />
                <SpeculatorConfig />
              </aside>

              <main className="lg:h-auto lg:overflow-visible">
                {runError && <p className="font-genshin text-bad border border-bad rounded-md px-3.5 py-2.5 mb-4" role="alert">{runError}</p>}
                <ResultsView 
                  result={result || { 
                    topArtifacts: [], 
                    totalResinSpent: 0, 
                    equivalentDays: 0, 
                    totalFiveStarsFound: 0, 
                    domainRunsCompleted: 0, 
                    strongboxRollsCompleted: 0, 
                    targetAchieved: false 
                  }} 
                  loading={loading || isSimulating}
                  ranMode={ranMode} 
                  ranPriority={ranPriority} 
                  elapsedMs={elapsedMs} 
                />
              </main>
            </div>
          </div>

          <ActionBar
            canRun={canRun}
            loading={loading || isSimulating}
            engineReady={engineReady}
            engineError={engineError}
            onRun={handleRun}
            onReset={resetSettings}
          />
        </>
      )}

      {currentPage === "sandbox" && <ArtifactSandbox />}
    </>
  )
}