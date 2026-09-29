import { AppHeader } from "./components/AppHeader"
import { ResinConfig } from "./components/ResinConfig"
import { SpeculatorConfig } from "./components/SpeculatorConfig"
import { ActionBar } from "./components/ActionBar"
import { ResultsView } from "./components/ResultsView"
import { RESIN_PER_RUN } from "./constants/resin"
import { useSimulationSettings } from "./hooks/useSimulationSettings"
import { useSimulationWorkers } from "./hooks/useSimulationWorkers"
import { APP_CSS } from "./styles/appStyles"

export default function App() {
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

  const { engineReady, engineError, loading, runError, result, ranMode, elapsedMs, run } =
    useSimulationWorkers()

  const canRun = engineReady && !loading && settings.resinBudget >= RESIN_PER_RUN
  const handleRun = () => {
    if (canRun) void run(settings)
  }

  return (
    <div className="app">
      <style>{APP_CSS}</style>

      <AppHeader engineReady={engineReady} engineError={engineError} />

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
        loading={loading}
        engineReady={engineReady}
        engineError={engineError}
        onRun={handleRun}
        onReset={resetSettings}
      />

      {runError && <p className="error" role="alert">{runError}</p>}

      {result && <ResultsView result={result} ranMode={ranMode} elapsedMs={elapsedMs} />}
    </div>
  )
}