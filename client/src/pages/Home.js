import React, { useContext, useEffect, useRef, useState } from "react";
import { Box, Container, CssBaseline, Toolbar } from "@mui/material";
import {
  Chart as ChartJS,
  LineController,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "./Home.css";
import alertSound from "../components/sounds/alert.mp3";
import rightChoiceSound from "../components/sounds/rightChoice.mp3";
import wrongChoiceSound from "../components/sounds/wrongChoice.mp3";
import NavBarDrawer from "../components/NavBarDrawer";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import { useSnackbar } from "notistack";
import { createGraph, fetchGraphs, getGraphsCount, getGraphsPageCount } from "../http/graphAPI";
import HintModal from "../features/game/components/modals/HintModal/HintModal";
import RulesModal from "../features/game/components/modals/RulesModal";
import TrainingEndModal from "../features/game/components/modals/TrainingEndModal";
import DangerOverlay from "../features/game/components/DangerOverlay";
import GameControls from "../features/game/components/GameControls";
import ModeBanner from "../features/game/components/ModeBanner";
import ScorePanel from "../features/game/components/ScorePanel";
import {
  chartOptions,
  gameTimeLimitMs,
  speedOptions,
  trainingTimeLimitMs,
} from "../features/game/constants";
import { inferEndGameCause } from "../features/game/services/endGameCause";
import { chartToHintCharts } from "../features/game/services/hintChartsService";
import { transformToDbDateDayTime } from "../utils/transformDate";
import { getParSet, getUserParSet, updateUserUserParSet } from "../http/userAPI";
import useSound from "use-sound";
import { getRemTimeRaw } from "../utils/getTimeDiff";

ChartJS.register(
  LineController,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  Filler
);

const Home = observer(() => {
  const chartRef = useRef < ChartJS > null;
  const fullChartRef = useRef < ChartJS > null;
  const { user, chart } = useContext(Context);

  const [playAlertSound] = useSound(alertSound);
  const [playRightChoiceSound] = useSound(rightChoiceSound);
  const [playWrongChoiceSound] = useSound(wrongChoiceSound);

  const [isRuleModalOpened, setIsRuleModalOpened] = React.useState(true);
  const handleOpenRuleModal = () => setIsRuleModalOpened(true);
  const handleCloseRuleModal = () => setIsRuleModalOpened(false);

  const [isHintModalOpened, setIsHintModalOpened] = React.useState(false);
  const handleOpenHintModal = () => setIsHintModalOpened(true);
  const handleCloseHintModal = () => {
    setIsHintModalOpened(false);
    setChosenHint("");
  };
  const [chosenHint, setChosenHint] = React.useState("");
  const [hintCharts, setHintCharts] = React.useState([]);
  const [countHintCharts, setCountHintCharts] = React.useState(0);
  const [curHintChartNum, setCurHintChartNum] = React.useState(1);
  const [countPageHintCharts, setCountPageHintCharts] = React.useState(0);
  const [curPageHintChartsNum, setCurPageHintChartsNum] = React.useState(1);
  const [curLocalHintChartNum, setCurLocalHintChartNum] = React.useState(1);
  const [hintModalDataFetched, setHintModalDataFetched] = React.useState(false);
  const [crashProb, setCrashProb] = React.useState("");
  const [endGameCause, setEndGameCause] = React.useState("");

  const [isTrainingWarnModalOpened, setIsTrainingWarnModalOpened] = React.useState(false);
  const handleOpenTrainingWarnModal = () => setIsTrainingWarnModalOpened(true);
  const handleCloseTrainingWarnModal = () => setIsTrainingWarnModalOpened(false);

  const [userParSet, setUserParSet] = React.useState(null);

  const [isTimeUp, setIsTimeUp] = React.useState(false);
  const [shouldEndTime, setShouldEndTime] = React.useState(false);
  const [updateParSet, setUpdateParSet] = React.useState(true);

  const [wrongChoiceAnim, setWrongChoiceAnim] = React.useState(false);

  const [time, setTime] = useState(Date.now());
  const [isChartPaused, setIsChartPaused] = useState(true);
  const [isChartStopped, setIsChartStopped] = useState(false);
  const [isDanger, setIsDanger] = useState(false);
  const [curSpeed, setCurSpeed] = useState(speedOptions[1]);
  const [scoresChanges, setScoresChanges] = useState({
    scoreChange: null,
    updateFlag: false,
  });
  const changeScore = (newScore) =>
    setScoresChanges((v) => {
      return {
        scoreChange: newScore,
        updateFlag: !v.updateFlag,
      };
    });
  const [totalScore, setTotalScore] = useState(0);
  const [totalScoreChange, setTotalScoreChange] = useState({
    scoreChange: 0,
    updateFlag: false,
  });
  const changeTotalScore = (diff) => {
    setTotalScore((totalScore) => {
      return totalScore + diff;
    });
    setTotalScoreChange((v) => {
      return {
        scoreChange: diff,
        updateFlag: !v.updateFlag,
      };
    });
  };

  const { enqueueSnackbar } = useSnackbar();

  const increaseSpeed = () => {
    const curIndex = speedOptions.findIndex((value) => {
      return value === curSpeed;
    });
    if (curIndex < speedOptions.length - 1) {
      setCurSpeed(speedOptions[curIndex + 1]);
    }
  };

  const decreaseSpeed = () => {
    const curIndex = speedOptions.findIndex((value) => {
      return value === curSpeed;
    });
    if (curIndex > 0) {
      setCurSpeed(speedOptions[curIndex - 1]);
    }
  };

  const triggerWrongChoiceAnim = () => {
    setWrongChoiceAnim((prevState) => {
      return !prevState;
    });
  };

  const triggerUpdateParSet = () => {
    setUpdateParSet((prevState) => {
      return !prevState;
    });
  };

  useEffect(() => {
    if (!isChartPaused) {
      const interval = setInterval(() => {
        let oldScore = chart.chartData.score;
        chart.chartData.generateNextPoint();
        setTime(Date.now());
        if (chart.chartData.isCrashed()) {
          chart.chartData.chartCrashed();
          const totalScoreDiff = chart.chartData.computeEndGameScore();
          if (userParSet != null) {
            createGraph(
              chart.chartData.points.slice(chart.chartData.maxPointsToShow),
              user.user.user_id,
              chart.chartData.parSet.id,
              totalScore + totalScoreDiff,
              userParSet.is_training
            );
          }
          changeTotalScore(totalScoreDiff);
          setIsChartPaused(true);
          setIsHintModalOpened(false);
          if (!isTimeUp) {
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
        if (!isDanger && chart.chartData.isDanger()) {
          playAlertSound();
          setIsChartPaused(true);
          setIsDanger(true);
        }
        if (chart.chartData.score !== oldScore) {
          changeScore(chart.chartData.score - oldScore);
          if (!isTimeUp) {
            if (chart.chartData.score - chart.chartData.bonusStep > oldScore) {
              playRightChoiceSound();
            } else if (chart.chartData.score - chart.chartData.bonusStep < oldScore) {
              triggerWrongChoiceAnim();
              playWrongChoiceSound();
            }
          }
        }
      }, 1000 / curSpeed);
      return () => {
        clearInterval(interval);
      };
    }
  }, [isChartPaused, curSpeed]);

  useEffect(() => {
    if (isChartStopped) {
      const isStopNeeded = chart.chartData.chartStopped();
      const totalScoreDiff = chart.chartData.computeEndGameScore();
      if (userParSet != null && !isTimeUp) {
        createGraph(
          chart.chartData.points.slice(chart.chartData.maxPointsToShow),
          user.user.user_id,
          chart.chartData.parSet.id,
          totalScore + totalScoreDiff,
          userParSet.is_training
        );
      }
      chart.chartData.generateNextPoint(false);
      changeTotalScore(totalScoreDiff);
      setIsHintModalOpened(false);
      setIsChartPaused(true);
      if (!isTimeUp) {
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
    }
  }, [isChartStopped]);

  useEffect(() => {
    if (chosenHint === "AllSessions") {
      setHintModalDataFetched(false);
      const fetchData = async () => {
        let chartCount = await getGraphsCount("user_id", user.user.user_id);
        setCountHintCharts(chartCount);
        let pageCount = await getGraphsPageCount("user_id", user.user.user_id);
        setCountPageHintCharts(pageCount);
        let charts = await fetchGraphs("user_id", user.user.user_id, pageCount);
        let hintCharts = await chartToHintCharts(charts);
        setHintCharts(hintCharts);
        setCurLocalHintChartNum(charts.length - 1);
        setCurPageHintChartsNum(pageCount);
        setCurHintChartNum(1);
      };
      fetchData().then(() => {
        setHintModalDataFetched(true);
      });
    } else if (chosenHint === "CrashProbability") {
      setHintModalDataFetched(false);
      let crashProb = chart.chartData.getCrashProbApprox();
      setCrashProb(crashProb);
      setHintModalDataFetched(true);
    }
  }, [chosenHint]);

  useEffect(() => {
    if (user.isAuth) {
      const oldUps = userParSet;
      let oldScore = chart.chartData.score;
      async function fetchParSet() {
        const parSet = await getParSet(user.user.user_id);
        chart.chartData.setParSet(parSet);
        return parSet;
      }
      fetchParSet().then((parSet) => {
        async function fetchParSetInfo() {
          const newUserParSet = await getUserParSet(user.user.user_id, parSet.id);
          return newUserParSet;
        }
        fetchParSetInfo().then((ups) => {
          if (
            oldUps == null ||
            oldUps.is_training !== ups.is_training ||
            oldUps.training_start_time !== ups.training_start_time ||
            oldUps.game_start_time !== ups.game_start_time
          ) {
            if (ups.score !== oldScore) {
              if (ups !== null && !ups.is_training) {
                setTotalScore(0);
                changeTotalScore(ups.score);
              }
            }
            setUserParSet(ups);
          }
        });
      });
    }
  }, [updateParSet]);

  useEffect(() => {
    setIsTimeUp(
      userParSet != null &&
        ((userParSet.is_training && getRemTimeRaw(userParSet.training_start_time, trainingTimeLimitMs) <= 0) ||
          (!userParSet.is_training && getRemTimeRaw(userParSet.game_start_time, gameTimeLimitMs) <= 0))
    );
  }, [userParSet]);

  useEffect(() => {
    if (hintCharts.length <= 0) {
      return;
    }
    setEndGameCause(
      inferEndGameCause(hintCharts[curLocalHintChartNum].points, chart.chartData.criticalValue)
    );
  }, [curLocalHintChartNum]);

  const moveToNextHintChart = async () => {
    if (curHintChartNum >= countHintCharts) return;
    setCurHintChartNum(curHintChartNum + 1);
    if (curLocalHintChartNum <= 0 && curPageHintChartsNum > 1) {
      setHintModalDataFetched(false);
      let charts = await fetchGraphs("user_id", user.user.user_id, curPageHintChartsNum - 1);
      let hintCharts = await chartToHintCharts(charts);
      setHintCharts(hintCharts);
      setCurPageHintChartsNum(curPageHintChartsNum - 1);
      setCurLocalHintChartNum(charts.length - 1);
      setHintModalDataFetched(true);
      return;
    }
    setCurLocalHintChartNum(curLocalHintChartNum - 1);
  };

  const moveToPrevHintChart = async () => {
    if (curHintChartNum <= 1) return;
    setCurHintChartNum(curHintChartNum - 1);
    if (curLocalHintChartNum >= hintCharts.length - 1 && curPageHintChartsNum < countPageHintCharts) {
      setHintModalDataFetched(false);
      let charts = await fetchGraphs("user_id", user.user.user_id, curPageHintChartsNum + 1);
      let hintCharts = await chartToHintCharts(charts);
      setHintCharts(hintCharts);
      setCurPageHintChartsNum(curPageHintChartsNum + 1);
      setCurLocalHintChartNum(0);
      setHintModalDataFetched(true);
      return;
    }
    setCurLocalHintChartNum(curLocalHintChartNum + 1);
  };

  const updateUserParSetUi = (updateInfo) => {
    updateInfo.par_set_id = chart.chartData.parSet.id;
    updateUserUserParSet(user.user.user_id, updateInfo).then(() => {
      triggerUpdateParSet();
    });
  };

  const handleSelectCrashProbabilityHint = () => {
    setChosenHint("CrashProbability");
    chart.chartData.chartHintUsed(250, chart.chartData.getCrashProbApprox());
    changeScore(-250);
  };

  const handleConfirmEndTraining = () => {
    setIsChartPaused(true);
    chart.chartData.restart();
    setIsDanger(false);
    handleCloseTrainingWarnModal();
    setShouldEndTime(false);
    setIsTimeUp(false);
    updateUserParSetUi({ is_training: false });
  };

  const handleStartGame = () => {
    if (userParSet != null) {
      if (userParSet.is_training) {
        updateUserParSetUi({ training_start_time: transformToDbDateDayTime(Date.now()) });
      } else if (!userParSet.is_training) {
        updateUserParSetUi({ game_start_time: transformToDbDateDayTime(Date.now()) });
      }
      setIsChartPaused(false);
    }
  };

  const handleContinue = () => {
    if (chart.chartData.isCrashed()) {
      chart.chartData.restart();
      if (shouldEndTime) {
        setIsTimeUp(true);
      }
    }
    if (isChartStopped) {
      chart.chartData.restart();
      setIsChartStopped(false);
      if (shouldEndTime) {
        setIsTimeUp(true);
      }
    }
    if (shouldEndTime) {
      setIsChartPaused(true);
    } else {
      setIsChartPaused(false);
    }
    setIsDanger(false);
  };

  const handlePause = () => {
    setIsChartPaused(true);
    chart.chartData.chartPaused();
    changeScore(-50);
  };

  const handleDangerContinue = () => {
    setIsChartPaused(false);
    setIsDanger(false);
    handleCloseHintModal();
  };

  const handleDangerStop = () => {
    setIsChartStopped(true);
    setIsDanger(false);
  };

  const gameScore =
    isChartStopped || chart.chartData.isCrashed()
      ? chart.chartData.score
      : chart.chartData.score - chart.chartData.bonusStep * 2;

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        <ModeBanner
          userParSet={userParSet}
          onDeadline={() => setShouldEndTime(true)}
          onEndTraining={handleOpenTrainingWarnModal}
        />
        <ScorePanel
          totalScore={totalScore}
          totalScoreChange={totalScoreChange}
          gameScore={gameScore}
          scoresChanges={scoresChanges}
          onOpenRules={handleOpenRuleModal}
        />
        <RulesModal open={isRuleModalOpened} onClose={handleCloseRuleModal} />
        <HintModal
          open={isHintModalOpened}
          onClose={handleCloseHintModal}
          chosenHint={chosenHint}
          onBack={() => setChosenHint("")}
          chartData={chart.chartData}
          chartRef={fullChartRef}
          hintCharts={hintCharts}
          hintModalDataFetched={hintModalDataFetched}
          endGameCause={endGameCause}
          crashProb={crashProb}
          curHintChartNum={curHintChartNum}
          countHintCharts={countHintCharts}
          curLocalHintChartNum={curLocalHintChartNum}
          onPrevHintChart={moveToPrevHintChart}
          onNextHintChart={moveToNextHintChart}
          onSelectCrashProbability={handleSelectCrashProbabilityHint}
        />
        <TrainingEndModal
          open={isTrainingWarnModalOpened}
          onClose={handleCloseTrainingWarnModal}
          onConfirmEndTraining={handleConfirmEndTraining}
        />
        <Container sx={{ width: "95%" }}>
          <Chart
            onAnimationEnd={triggerWrongChoiceAnim}
            className={wrongChoiceAnim ? "crash" : ""}
            ref={chartRef}
            options={chartOptions}
            data={chart.chartData.data}
          />
          <GameControls
            isAuth={user.isAuth}
            userParSet={userParSet}
            isChartPaused={isChartPaused}
            isTimeUp={isTimeUp}
            isDanger={isDanger}
            curSpeed={curSpeed}
            onStartGame={handleStartGame}
            onDecreaseSpeed={decreaseSpeed}
            onIncreaseSpeed={increaseSpeed}
            onContinue={handleContinue}
            onPause={handlePause}
          />
        </Container>
      </Box>
      <DangerOverlay
        isDanger={isDanger}
        onContinue={handleDangerContinue}
        onOpenHints={handleOpenHintModal}
        onStop={handleDangerStop}
      />
    </Box>
  );
});

export default Home;
