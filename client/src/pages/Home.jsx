import React, { useContext, useEffect, useRef } from "react";
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
import { fetchGraphs, getGraphsCount, getGraphsPageCount } from "../http/graphAPI";
import HintModal from "../features/game/components/modals/HintModal/HintModal";
import RulesModal from "../features/game/components/modals/RulesModal";
import TrainingEndModal from "../features/game/components/modals/TrainingEndModal";
import DangerOverlay from "../features/game/components/DangerOverlay";
import GameControls from "../features/game/components/GameControls";
import ModeBanner from "../features/game/components/ModeBanner";
import ScorePanel from "../features/game/components/ScorePanel";
import { chartOptions } from "../features/game/constants";
import { useGameLoop } from "../features/game/hooks/useGameLoop";
import { useGameSession } from "../features/game/hooks/useGameSession";
import { useUserParSet } from "../features/game/hooks/useUserParSet";
import { inferEndGameCause } from "../features/game/services/endGameCause";
import { chartToHintCharts } from "../features/game/services/hintChartsService";
import useSound from "use-sound";

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
  const chartRef = useRef(null);
  const fullChartRef = useRef(null);
  const { user, chart } = useContext(Context);

  const [playAlertSound] = useSound(alertSound);
  const [playRightChoiceSound] = useSound(rightChoiceSound);
  const [playWrongChoiceSound] = useSound(wrongChoiceSound);
  const { enqueueSnackbar } = useSnackbar();

  const {
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
  } = useGameSession();

  const { userParSet, isTimeUp, setIsTimeUp, shouldEndTime, setShouldEndTime, updateUserParSetUi, startSession } =
    useUserParSet({
      isAuth: user.isAuth,
      userId: user.user.user_id,
      chartData: chart.chartData,
      setTotalScore,
      changeTotalScore,
    });

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

  // Счётчик запросов подсказок: применяем результат только последнего,
  // чтобы параллельные загрузки не рассинхронизировали hintCharts и индексы.
  const hintFetchSeq = useRef(0);

  const handleSessionExpired = () => {
    setShouldEndTime(true);
    setIsTimeUp(true);
    enqueueSnackbar("Время игровой сессии истекло. Результаты не учтены.", {
      variant: "warning",
      autoHideDuration: 6000,
      preventDuplicate: true,
    });
  };

  useGameLoop({
    chartData: chart.chartData,
    isChartPaused,
    curSpeed,
    isChartStopped,
    isDanger,
    isTimeUp,
    userParSet,
    userId: user.user.user_id,
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
    onSessionExpired: handleSessionExpired,
  });

  useEffect(() => {
    if (chosenHint === "AllSessions") {
      setHintModalDataFetched(false);
      const seq = ++hintFetchSeq.current;
      const fetchData = async () => {
        let chartCount = await getGraphsCount("user_id", user.user.user_id);
        let pageCount = await getGraphsPageCount("user_id", user.user.user_id);
        let charts = await fetchGraphs("user_id", user.user.user_id, pageCount);
        let hintCharts = await chartToHintCharts(charts);
        if (seq !== hintFetchSeq.current) {
          return;
        }
        setCountHintCharts(chartCount);
        setCountPageHintCharts(pageCount);
        setHintCharts(hintCharts);
        setCurLocalHintChartNum(charts.length - 1);
        setCurPageHintChartsNum(pageCount);
        setCurHintChartNum(1);
      };
      fetchData().then(() => {
        if (seq !== hintFetchSeq.current) {
          return;
        }
        setHintModalDataFetched(true);
      });
    } else if (chosenHint === "CrashProbability") {
      setHintModalDataFetched(false);
      let crashProb = chart.chartData.getCrashProbApprox();
      setCrashProb(crashProb);
      setHintModalDataFetched(true);
    }
  }, [chosenHint, chart.chartData, user.user.user_id]);

  useEffect(() => {
    if (hintCharts.length <= 0) {
      return;
    }
    setEndGameCause(
      inferEndGameCause(hintCharts[curLocalHintChartNum].points, chart.chartData.criticalValue)
    );
  }, [curLocalHintChartNum, hintCharts, chart.chartData.criticalValue]);

  const moveToNextHintChart = async () => {
    if (curHintChartNum >= countHintCharts) return;
    setCurHintChartNum(curHintChartNum + 1);
    if (curLocalHintChartNum <= 0 && curPageHintChartsNum > 1) {
      setHintModalDataFetched(false);
      const seq = ++hintFetchSeq.current;
      let charts = await fetchGraphs("user_id", user.user.user_id, curPageHintChartsNum - 1);
      let hintCharts = await chartToHintCharts(charts);
      if (seq !== hintFetchSeq.current) {
        return;
      }
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
      const seq = ++hintFetchSeq.current;
      let charts = await fetchGraphs("user_id", user.user.user_id, curPageHintChartsNum + 1);
      let hintCharts = await chartToHintCharts(charts);
      if (seq !== hintFetchSeq.current) {
        return;
      }
      setHintCharts(hintCharts);
      setCurPageHintChartsNum(curPageHintChartsNum + 1);
      setCurLocalHintChartNum(0);
      setHintModalDataFetched(true);
      return;
    }
    setCurLocalHintChartNum(curLocalHintChartNum + 1);
  };

  const handleSelectCrashProbabilityHint = () => {
    const hintCost = chart.chartData.hintCost;
    setChosenHint("CrashProbability");
    chart.chartData.chartHintUsed(hintCost, chart.chartData.getCrashProbApprox());
    changeScore(-hintCost);
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
      startSession().catch(() => {
        enqueueSnackbar("Не удалось начать сессию. Обновите страницу.", { variant: "error", preventDuplicate: true });
      });
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
    changeScore(-chart.chartData.penaltyPause);
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
        <RulesModal
          open={isRuleModalOpened}
          onClose={handleCloseRuleModal}
          rulesText={chart.chartData.parSet?.rules_text}
          parSet={chart.chartData.parSet}
        />
        <HintModal
          open={isHintModalOpened}
          onClose={handleCloseHintModal}
          chosenHint={chosenHint}
          onBack={() => setChosenHint("")}
          chartData={chart.chartData}
          hintCost={chart.chartData.hintCost}
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
