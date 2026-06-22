import { useEffect, useRef } from "react";
import { createGraph } from "../../../http/graphAPI";

export function useGameLoop({
  chartData,
  isChartPaused,
  curSpeed,
  isChartStopped,
  isDanger,
  isTimeUp,
  userParSet,
  userId,
  totalScore,
  changeScore,
  changeTotalScore,
  setIsChartPaused,
  setIsDanger,
  setIsHintModalOpened,
  triggerWrongChoiceAnim,
  playAlertSound,
  playRightChoiceSound,
  playWrongChoiceSound,
  enqueueSnackbar,
}) {
  const isTimeUpRef = useRef(isTimeUp);
  const isDangerRef = useRef(isDanger);
  const userParSetRef = useRef(userParSet);
  const totalScoreRef = useRef(totalScore);

  useEffect(() => {
    isTimeUpRef.current = isTimeUp;
  }, [isTimeUp]);

  useEffect(() => {
    isDangerRef.current = isDanger;
  }, [isDanger]);

  useEffect(() => {
    userParSetRef.current = userParSet;
  }, [userParSet]);

  useEffect(() => {
    totalScoreRef.current = totalScore;
  }, [totalScore]);

  useEffect(() => {
    if (isChartPaused) {
      return;
    }

    const interval = setInterval(() => {
      const oldScore = chartData.score;
      chartData.generateNextPoint();

      if (chartData.isCrashed()) {
        chartData.chartCrashed();
        const totalScoreDiff = chartData.computeEndGameScore();
        const currentUserParSet = userParSetRef.current;

        if (currentUserParSet != null) {
          createGraph(
            chartData.points.slice(chartData.maxPointsToShow),
            userId,
            chartData.parSet.id,
            totalScoreRef.current + totalScoreDiff,
            currentUserParSet.is_training
          );
        }

        changeTotalScore(totalScoreDiff);
        setIsChartPaused(true);
        setIsHintModalOpened(false);

        if (!isTimeUpRef.current) {
          triggerWrongChoiceAnim();
          playWrongChoiceSound();
          enqueueSnackbar("Критическое значение процесса превышено. Процесс перезапущен.", {
            variant: "error",
            autoHideDuration: 5000,
            preventDuplicate: true,
            style: {
              fontSize: "18pt",
            },
          });
        }
      }

      if (!isDangerRef.current && chartData.isDanger()) {
        playAlertSound();
        setIsChartPaused(true);
        setIsDanger(true);
      }

      if (chartData.score !== oldScore) {
        changeScore(chartData.score - oldScore);

        if (!isTimeUpRef.current) {
          if (chartData.score - chartData.bonusStep > oldScore) {
            playRightChoiceSound();
          } else if (chartData.score - chartData.bonusStep < oldScore) {
            triggerWrongChoiceAnim();
            playWrongChoiceSound();
          }
        }
      }
    }, 1000 / curSpeed);

    return () => {
      clearInterval(interval);
    };
  }, [
    isChartPaused,
    curSpeed,
    chartData,
    userId,
    changeScore,
    changeTotalScore,
    setIsChartPaused,
    setIsDanger,
    setIsHintModalOpened,
    triggerWrongChoiceAnim,
    playAlertSound,
    playRightChoiceSound,
    playWrongChoiceSound,
    enqueueSnackbar,
  ]);

  useEffect(() => {
    if (!isChartStopped) {
      return;
    }

    const isStopNeeded = chartData.chartStopped();
    const totalScoreDiff = chartData.computeEndGameScore();
    const currentUserParSet = userParSetRef.current;

    if (currentUserParSet != null && !isTimeUpRef.current) {
      createGraph(
        chartData.points.slice(chartData.maxPointsToShow),
        userId,
        chartData.parSet.id,
        totalScoreRef.current + totalScoreDiff,
        currentUserParSet.is_training
      );
    }

    chartData.generateNextPoint(false);
    changeTotalScore(totalScoreDiff);
    setIsHintModalOpened(false);
    setIsChartPaused(true);

    if (!isTimeUpRef.current) {
      if (!isStopNeeded) {
        triggerWrongChoiceAnim();
        playWrongChoiceSound();
        enqueueSnackbar("Остановка процесса не была необходима. Часть баллов потеряна.", {
          variant: "error",
          autoHideDuration: 5000,
          preventDuplicate: true,
          style: {
            fontSize: "18pt",
          },
        });
      } else {
        playRightChoiceSound();
        enqueueSnackbar("Остановка процесса была верным решением!", {
          variant: "success",
          autoHideDuration: 5000,
          preventDuplicate: true,
          style: {
            fontSize: "18pt",
          },
        });
      }
    }
  }, [
    isChartStopped,
    chartData,
    userId,
    changeTotalScore,
    setIsHintModalOpened,
    setIsChartPaused,
    triggerWrongChoiceAnim,
    playWrongChoiceSound,
    playRightChoiceSound,
    enqueueSnackbar,
  ]);
}
