import React from "react";
import GameModal from "../GameModal";
import AllSessionsHint from "./AllSessionsHint";
import CrashProbabilityHint from "./CrashProbabilityHint";
import CurrentSessionHint from "./CurrentSessionHint";
import HintMenu from "./HintMenu";

export default function HintModal({
  open,
  onClose,
  chosenHint,
  onBack,
  chartData,
  chartRef,
  hintCharts,
  hintModalDataFetched,
  endGameCause,
  crashProb,
  curHintChartNum,
  countHintCharts,
  curLocalHintChartNum,
  onPrevHintChart,
  onNextHintChart,
  onSelectCrashProbability,
}) {
  const renderContent = () => {
    switch (chosenHint) {
      case "CurrentSession":
        return <CurrentSessionHint chartData={chartData} chartRef={chartRef} onBack={onBack} />;
      case "AllSessions":
        return (
          <AllSessionsHint
            chartRef={chartRef}
            hintCharts={hintCharts}
            hintModalDataFetched={hintModalDataFetched}
            curLocalHintChartNum={curLocalHintChartNum}
            endGameCause={endGameCause}
            curHintChartNum={curHintChartNum}
            countHintCharts={countHintCharts}
            onPrev={onPrevHintChart}
            onNext={onNextHintChart}
            onBack={onBack}
          />
        );
      case "CrashProbability":
        return (
          <CrashProbabilityHint
            crashProb={crashProb}
            hintModalDataFetched={hintModalDataFetched}
            onBack={onBack}
          />
        );
      default:
        return <HintMenu onSelectCrashProbability={onSelectCrashProbability} onClose={onClose} />;
    }
  };

  return (
    <GameModal open={open} onClose={onClose} zIndex={6500} contentSx={{ width: 800 }}>
      {renderContent()}
    </GameModal>
  );
}
