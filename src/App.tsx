import { useState } from "react"
import { SideNav, type AppPage } from "./components/SideNav"
import { AppHeader } from "./components/AppHeader"
import { ResinConfig } from "./components/ResinConfig"
import { HuntListPanel } from "./components/HuntListPanel"
import { ActionBar } from "./components/ActionBar"
import { ResultsView } from "./components/ResultsView"
import { ArtifactSandbox } from "./components/ArtifactSandbox"
import { UIDImport } from "./components/UIDImport"
import { RESIN_PER_RUN } from "./constants/resin"
import { useDockedScroll } from "./hooks/useDockedScroll"
import { useSimulationSettings } from "./hooks/useSimulationSettings"
import { useSimulationWorkers } from "./hooks/useSimulationWorkers"
import { useHuntList } from "./hooks/useHuntList"


export default function App() {
  const appRef = useDockedScroll<HTMLDivElement>()
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentPage, setCurrentPage] = useState<AppPage>("speculator")

  const settings = useSimulationSettings(state => state.settings)
  const resetSettings = useSimulationSettings(state => state.resetSettings)
  const huntItems = useHuntList(state => state.items)

  const { engineReady, engineError, loading, runError, result, huntResult, ranMode, ranPriority, elapsedMs, run, runHuntList } =
    useSimulationWorkers()

  const canRun = engineReady && !loading && settings.resinBudget >= RESIN_PER_RUN
  
  const handleRun = async () => {
    if (!canRun) return
    setIsSimulating(true)
    try {
      if (huntItems.length > 0) {
        await runHuntList(huntItems, settings)
      } else {
        await run(settings)
      }
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <>
      <SideNav currentPage={currentPage} onNavigate={setCurrentPage} />

      <div className="ml-[72px]">
        {currentPage === "speculator" && (
          <>
          <div className="font-genshin max-w-[1800px] mx-auto px-5 pt-9 pb-[72px] min-h-screen text-[15px] leading-relaxed box-border lg:h-auto" ref={appRef}>
            <div className="relative bg-page z-[100] pt-9 pb-4 mb-3">
              <AppHeader engineReady={engineReady} engineError={engineError} />
            </div>

            <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 lg:h-auto items-start">
              <div className="flex flex-col lg:flex-row gap-4 shrink-0">
                <aside className="lg:h-auto lg:max-h-[calc(100vh-72px)] lg:overflow-y-auto custom-scrollbar pr-1.5 w-full lg:w-[320px]">
                  <ResinConfig />
                  <ActionBar
                    canRun={canRun}
                    loading={loading || isSimulating}
                    engineReady={engineReady}
                    engineError={engineError}
                    onRun={handleRun}
                    onReset={resetSettings}
                  />
                </aside>
                <aside className="lg:h-auto lg:max-h-[calc(100vh-72px)] lg:overflow-y-auto custom-scrollbar pr-1.5 w-full lg:w-[360px]">
                  <HuntListPanel />
                </aside>
              </div>

              <main className="lg:h-auto lg:overflow-visible w-full min-w-0 flex-1">
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
                  huntResult={huntResult}
                  loading={loading || isSimulating}
                  ranMode={ranMode} 
                  ranPriority={ranPriority} 
                  elapsedMs={elapsedMs} 
                />
              </main>
            </div>
          </div>
        </>
      )}

      {currentPage === "sandbox" && <ArtifactSandbox />}
      {currentPage === "uid" && <UIDImport />}
      </div>
    </>
  )
}