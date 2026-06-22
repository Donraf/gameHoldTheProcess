import { useCallback, useState } from "react";
import { speedOptions } from "../constants";

export function useGameSession() {
  const [isChartPaused, setIsChartPaused] = useState(true);
  const [isChartStopped, setIsChartStopped] = useState(false);
  const [isDanger, setIsDanger] = useState(false);
  const [curSpeed, setCurSpeed] = useState(speedOptions[1]);
  const [wrongChoiceAnim, setWrongChoiceAnim] = useState(false);
  const [scoresChanges, setScoresChanges] = useState({
    scoreChange: null,
    updateFlag: false,
  });
  const [totalScore, setTotalScore] = useState(0);
  const [totalScoreChange, setTotalScoreChange] = useState({
    scoreChange: 0,
    updateFlag: false,
  });

  const changeScore = useCallback((newScore) => {
    setScoresChanges((v) => ({
      scoreChange: newScore,
      updateFlag: !v.updateFlag,
    }));
  }, []);

  const changeTotalScore = useCallback((diff) => {
    setTotalScore((score) => score + diff);
    setTotalScoreChange((v) => ({
      scoreChange: diff,
      updateFlag: !v.updateFlag,
    }));
  }, []);

  const increaseSpeed = useCallback(() => {
    setCurSpeed((speed) => {
      const curIndex = speedOptions.findIndex((value) => value === speed);
      if (curIndex < speedOptions.length - 1) {
        return speedOptions[curIndex + 1];
      }
      return speed;
    });
  }, []);

  const decreaseSpeed = useCallback(() => {
    setCurSpeed((speed) => {
      const curIndex = speedOptions.findIndex((value) => value === speed);
      if (curIndex > 0) {
        return speedOptions[curIndex - 1];
      }
      return speed;
    });
  }, []);

  const triggerWrongChoiceAnim = useCallback(() => {
    setWrongChoiceAnim((prevState) => !prevState);
  }, []);

  return {
    isChartPaused,
    setIsChartPaused,
    isChartStopped,
    setIsChartStopped,
    isDanger,
    setIsDanger,
    curSpeed,
    wrongChoiceAnim,
    scoresChanges,
    totalScore,
    setTotalScore,
    totalScoreChange,
    changeScore,
    changeTotalScore,
    increaseSpeed,
    decreaseSpeed,
    triggerWrongChoiceAnim,
  };
}
