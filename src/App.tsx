import { useState } from "react"
import { AppHeader } from "./components/AppHeader"
import { ResinConfig } from "./components/ResinConfig"
import { SpeculatorConfig } from "./components/SpeculatorConfig"
import { ActionBar } from "./components/ActionBar"
import { ResultsView } from "./components/ResultsView"
import { RESIN_PER_RUN } from "./constants/resin"
import { useDockedScroll } from "./hooks/useDockedScroll"
import { useSimulationSettings } from "./hooks/useSimulationSettings"
import { useSimulationWorkers } from "./hooks/useSimulationWorkers"
import { APP_CSS } from "./styles/appStyles"

export default function App() {
  const appRef = useDockedScroll<HTMLDivElement>()
  const [isSimulating, setIsSimulating] = useState(false)

  const {
    settings,
    setMode,
    setResinBudget,
    setTopK,
    setUseStrongBox,
    setMinCritValue,
    setTargetMainStat,
    setPriority,
    changeSlot,
    resetSettings,
  } = useSimulationSettings()

  const { engineReady, engineError, loading, runError, result, ranMode, ranPriority, elapsedMs, run } =
    useSimulationWorkers()

  const canRun = engineReady && !loading && settings.resinBudget >= RESIN_PER_RUN
  
  const handleRun = async () => {
    if (!canRun) return
    setIsSimulating(true)
    try {
      await Promise.all([
        run(settings),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ])
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    /* We use a Fragment (<>) here so we can return both the App and the floating ActionBar */
    <>
      <div className="app font-genshin" ref={appRef}>
        <style>{APP_CSS}</style>

        <div className="sticky-header">
          <AppHeader engineReady={engineReady} engineError={engineError} />
        </div>

        <div className="layout">
          <aside className="sidebar">
            <ResinConfig
              mode={settings.mode}
              resinBudget={settings.resinBudget}
              useStrongBox={settings.useStrongBox}
              setMode={setMode}
              setResinBudget={setResinBudget}
              setUseStrongBox={setUseStrongBox}
            />

            <SpeculatorConfig
              mode={settings.mode}
              topK={settings.topK}
              minCritValue={settings.minCritValue}
              targetSlot={settings.targetSlot}
              targetMainStat={settings.targetMainStat}
              priority={settings.priority}
              setTopK={setTopK}
              setMinCritValue={setMinCritValue}
              setTargetMainStat={setTargetMainStat}
              setPriority={setPriority}
              onSlotChange={changeSlot}
            />
          </aside>

          <main>
            {runError && <p className="error font-genshin" role="alert">{runError}</p>}
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

      {/* 
        Moved completely outside the `.app` div!
        Now it will perfectly float over the screen, no matter how far you scroll.
      */}
      <ActionBar
        canRun={canRun}
        loading={loading || isSimulating}
        engineReady={engineReady}
        engineError={engineError}
        onRun={handleRun}
        onReset={resetSettings}
      />
    </>
  )
}