import { useState } from "react" // 1. Make sure useState is imported
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
  const [isSimulating, setIsSimulating] = useState(false) // 2. Add local loading state

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
      // Forces a guaranteed 2-second minimum window for the skeleton animation
      await Promise.all([
        run(settings),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ])
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <div className="app font-genshin" ref={appRef}>
      <style>{APP_CSS}</style>

      {/* 1. Header scrolls away with the page */}
      <div className="sticky-header">
        <AppHeader engineReady={engineReady} engineError={engineError} />
      </div>

      {/* 2. Two panes, together exactly one screen tall */}
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

          <ActionBar
            canRun={canRun}
            loading={loading || isSimulating}
            engineReady={engineReady}
            engineError={engineError}
            onRun={handleRun}
            onReset={resetSettings}
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
  )
}