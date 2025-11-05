import React, { useContext, useEffect, useRef, useState } from "react";
import { Box, Button, Container, CssBaseline, Modal, Stack, Toolbar, Typography } from "@mui/material";
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
import { COLORS } from "../utils/constants";
import "./Home.css";
import alertSound from "../components/sounds/alert.mp3";
import rightChoiceSound from "../components/sounds/rightChoice.mp3";
import wrongChoiceSound from "../components/sounds/wrongChoice.mp3";

import NavBarDrawer from "../components/NavBarDrawer";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import DecreaseSpeedIcon from "../components/icons/DecreaseSpeedIcon";
import IncreaseSpeedIcon from "../components/icons/IncreaseSpeedIcon";
import DangerIcon from "../components/icons/DangerIcon";
import { useSnackbar } from "notistack";
import { createGraph, fetchGraphs, getGraphsCount, getGraphsPageCount } from "../http/graphAPI";
import { ModalContent } from "../components/ModalContent";
import { fetchPointsByChartId } from "../http/pointAPI";
import { ChartData } from "../utils/ChartData";
import { transformToDbDateDayTime, transformToUiDateDayTime } from "../utils/transformDate";
import { getParSet, getUserParSet, updateUserUserParSet } from "../http/userAPI";
import useSound from "use-sound";
import PlayButtonIcon from "../components/icons/PlayButtonIcon";
import StopButtonIcon from "../components/icons/StopButtonIcon";
import TakeHintButtonIcon from "../components/icons/TakeHintButtonIcon";
import PauseButtonIcon from "../components/icons/PauseButtonIcon";
import { getRemTimeRaw, millisToMinutesAndSeconds } from "../utils/getTimeDiff";
import Timer from "../components/Timer";

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

async function chartToHintCharts(charts) {
  let hintCharts = [];
  for (let i in charts) {
    let points = await fetchPointsByChartId(charts[i].id);
    let hintChart = {
      id: charts[i].id,
      createdAt: charts[i].created_at,
      points: points,
    };
    hintCharts.push(hintChart);
  }
  return hintCharts;
}

export const options = {
  animations: {
    x: {
      duration: 1000,
    },
    y: {
      duration: 0,
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      min: 0.6,
    },
  },
  plugins: {
    legend: {
      onClick: () => {},
    },
  },
};

const trainingTimeLimitMs = 15 * 60 * 1000;
const gameTimeLimitMs = 60 * 60 * 1000;

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

  const containerRef = React.useRef(null);

  const speedOptions = [0.5, 1, 1.5, 2];

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
    setIsTimeUp(userParSet != null &&
      ((userParSet.is_training && getRemTimeRaw(userParSet.training_start_time, trainingTimeLimitMs) <= 0) ||
        (!userParSet.is_training && getRemTimeRaw(userParSet.game_start_time, gameTimeLimitMs) <= 0)))
  }, [userParSet]);

  useEffect(() => {
    if (hintCharts.length <= 0) {
      return;
    }
    let newCause = "";
    for (let i = 0; i < hintCharts[curLocalHintChartNum].points.length; i++) {
      if (hintCharts[curLocalHintChartNum].points[i].is_stop) {
        if (i - 1 < 0) {
          newCause = "Остановка без предупреждения от ИИ (неправильная)";
          break;
        }
        if (hintCharts[curLocalHintChartNum].points[i - 1].is_useful_ai_signal) {
          newCause = "Остановка после правильного предупреждения от ИИ";
        } else if (hintCharts[curLocalHintChartNum].points[i - 1].is_deceptive_ai_signal) {
          newCause = "Остановка после неправильного предупреждения от ИИ";
        } else {
          if (i + 1 >= hintCharts[curLocalHintChartNum].points.length) {
            break;
          }
          if (hintCharts[curLocalHintChartNum].points[i + 1].y >= chart.chartData.criticalValue) {
            newCause = "Остановка без предупреждения от ИИ (правильная)";
          } else {
            newCause = "Остановка без предупреждения от ИИ (неправильная)";
          }
        }
        break;
      }
      if (hintCharts[curLocalHintChartNum].points[i].is_crash) {
        if (i - 1 < 0) {
          newCause = "Взрыв без предупреждения от ИИ";
          break;
        }
        if (hintCharts[curLocalHintChartNum].points[i - 1].is_useful_ai_signal) {
          newCause = "Взрыв после отклонения правильного предупреждения от ИИ";
        } else {
          newCause = "Взрыв без предупреждения от ИИ";
        }
        break;
      }
    }
    setEndGameCause(newCause);
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

  const renderHintModal = (chosenVariant) => {
    switch (chosenVariant) {
      case "CurrentSession":
        return (
          <>
            <Typography
              sx={{
                userSelect: "none",
              }}
            >
              Вся текущая сессия
            </Typography>
            <Chart
              ref={fullChartRef}
              options={options}
              data={chart.chartData.formData(
                chart.chartData.points.slice(chart.chartData.maxPointsToShow, -chart.chartData.checkDangerNum)
              )}
            />
            <Button
              sx={{
                color: "#FFFFFF",
                backgroundColor: "#9356A0",
                flexGrow: 1,
              }}
              onClick={() => {
                setChosenHint("");
              }}
            >
              Назад
            </Button>
          </>
        );
      case "AllSessions":
        let chartData = new ChartData();
        if (hintModalDataFetched && hintCharts.length > 0) {
          chartData.restoreFromPoints(hintCharts[curLocalHintChartNum].points);
        }
        return (
          <>
            {hintModalDataFetched && hintCharts.length > 0 ? (
              <>
                <Typography
                  sx={{
                    userSelect: "none",
                  }}
                >
                  Все предыдущие сессии
                </Typography>
                <Typography
                  sx={{
                    userSelect: "none",
                  }}
                >
                  Игровая сессия {transformToUiDateDayTime(hintCharts[curLocalHintChartNum].createdAt)}
                </Typography>
                <Typography
                  sx={{
                    userSelect: "none",
                  }}
                >
                  Причина завершения: {endGameCause}
                </Typography>
                <Chart ref={fullChartRef} options={options} data={chartData.data} />
              </>
            ) : (
              <>
                {hintCharts.length <= 0 ? (
                  <Typography
                    sx={{
                      userSelect: "none",
                    }}
                  >
                    Предыдущих сессий нет
                  </Typography>
                ) : (
                  <></>
                )}
              </>
            )}
            <Stack display="flex" direction="row" spacing={1}>
              <Box
                sx={{
                  color: "#FFFFFF",
                  backgroundColor: "#9356A0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: "8px",
                  py: "12px",
                  borderRadius: "4px",
                }}
                onClick={() => {
                  moveToPrevHintChart();
                }}
              >
                <DecreaseSpeedIcon />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #000000",
                  borderRadius: "4px",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    userSelect: "none",
                  }}
                >
                  {curHintChartNum + "/" + countHintCharts}
                </Typography>
              </Box>
              <Box
                sx={{
                  color: "#FFFFFF",
                  backgroundColor: "#9356A0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: "8px",
                  py: "12px",
                  borderRadius: "4px",
                }}
                onClick={() => {
                  moveToNextHintChart();
                }}
              >
                <IncreaseSpeedIcon />
              </Box>
              <Button
                sx={{
                  color: "#FFFFFF",
                  backgroundColor: "#9356A0",
                  flexGrow: 1,
                }}
                onClick={() => {
                  setChosenHint("");
                }}
              >
                Назад
              </Button>
            </Stack>
          </>
        );
      case "CrashProbability":
        return (
          <>
            {hintModalDataFetched ? (
              <>
                <Typography
                  sx={{
                    userSelect: "none",
                  }}
                >
                  {crashProb}
                </Typography>
                <Button
                  sx={{
                    color: "#FFFFFF",
                    backgroundColor: "#9356A0",
                    flexGrow: 1,
                  }}
                  onClick={() => {
                    setChosenHint("");
                  }}
                >
                  Назад
                </Button>
              </>
            ) : (
              <>
                <Typography
                  sx={{
                    userSelect: "none",
                  }}
                >
                  Расчет вероятности...
                </Typography>
              </>
            )}
          </>
        );
      default:
        return (
          <>
            <Typography
              sx={{
                userSelect: "none",
              }}
            >
              Какую подсказку хотите купить?
            </Typography>
            {/* <Button
              sx={{
                color: "#FFFFFF",
                backgroundColor: COLORS.takeHintButton,
                flexGrow: 1,
              }}
              onClick={() => {
                setChosenHint("CurrentSession");
                chart.chartData.chartHintUsed(50);
                changeScore(-50);
              }}
            >
              Показать весь текущий гейм (50 очков)
            </Button>
            <Button
              sx={{
                color: "#FFFFFF",
                backgroundColor: COLORS.takeHintButton,
                flexGrow: 1,
              }}
              onClick={() => {
                setChosenHint("AllSessions");
                chart.chartData.chartHintUsed(200);
                changeScore(-200);
              }}
            >
              Показать все свои предыдущие геймы (200 очков)
            </Button> */}
            <Button
              sx={{
                color: "#FFFFFF",
                backgroundColor: COLORS.takeHintButton,
                flexGrow: 1,
              }}
              onClick={() => {
                setChosenHint("CrashProbability");
                chart.chartData.chartHintUsed(250, chart.chartData.getCrashProbApprox());
                changeScore(-250);
              }}
            >
              Показать рискованность продолжения (250 очков)
            </Button>
            <Button
              sx={{
                color: "#FFFFFF",
                backgroundColor: "#9356A0",
                flexGrow: 1,
              }}
              onClick={() => {
                handleCloseHintModal();
              }}
            >
              Назад
            </Button>
          </>
        );
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <NavBarDrawer />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar />
        {userParSet != null && userParSet.is_training ? (
          <>
            <Stack
              justifyContent="center"
              alignItems="center"
              display="flex"
              direction="row"
              gap={1}
              sx={{
                textAlign: "center",
                background: "orange",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "10px",
              }}
            >
              <Typography
                sx={{
                  textAlign: "center",
                }}
              >
                {" "}
                Тренировочный режим. Оставшееся время:
              </Typography>
              {userParSet.training_start_time != null ? (
                <>
                  <Timer
                    active={userParSet.training_start_time != null}
                    deadlineIntervalMs={getRemTimeRaw(userParSet.training_start_time, trainingTimeLimitMs)}
                    onDeadline={() => {
                      setShouldEndTime(true);
                    }}
                  />
                </>
              ) : (
                <>{millisToMinutesAndSeconds(trainingTimeLimitMs)}</>
              )}
              <Button
                sx={{
                  color: "#FFFFFF",
                  backgroundColor: "#9356A0",
                }}
                onClick={handleOpenTrainingWarnModal}
              >
                Закончить тренировку
              </Button>
            </Stack>
          </>
        ) : (
          <></>
        )}
        {userParSet != null && !userParSet.is_training ? (
          <>
            <Stack
              justifyContent="center"
              alignItems="center"
              display="flex"
              direction="row"
              gap={1}
              sx={{
                textAlign: "center",
                background: "green",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "10px",
              }}
            >
              <Typography
                sx={{
                  textAlign: "center",
                  color: "#ffffff",
                }}
              >
                {" "}
                Основной режим. Оставшееся время:
              </Typography>
              {userParSet.game_start_time != null ? (
                <>
                  <Timer
                    active={userParSet.game_start_time != null}
                    deadlineIntervalMs={getRemTimeRaw(userParSet.game_start_time, gameTimeLimitMs)}
                    onDeadline={() => {
                      setShouldEndTime(true);
                    }}
                    textClr="#ffffff"
                  />
                </>
              ) : (
                <Typography sx={{ color: "#ffffff" }}>{millisToMinutesAndSeconds(gameTimeLimitMs)}</Typography>
              )}
            </Stack>
          </>
        ) : (
          <></>
        )}
        <Stack justifyContent="space-between" alignContent="flex-start" display="flex" direction="row">
          <Stack display="flex" direction="column">
            <Box
              sx={{
                height: 50,
                overflow: "hidden",
                display: "flex",
                direction: "row",
                gap: "5px",
              }}
              ref={containerRef}
            >
              <Typography
                variant="h3"
                sx={{
                  userSelect: "none",
                }}
              >
                Очки за сет: {totalScore}
              </Typography>
              <Typography
                key={totalScoreChange.updateFlag}
                className="move-up"
                variant="h3"
                color={totalScoreChange.scoreChange < 0 ? "red" : "green"}
                sx={{
                  userSelect: "none",
                }}
              >
                {" "}
                {totalScoreChange.scoreChange > 0 ? "+" + totalScoreChange.scoreChange : ""}
                {totalScoreChange.scoreChange < 0 ? totalScoreChange.scoreChange : ""}
              </Typography>
            </Box>
            <Box
              sx={{
                height: 50,
                overflow: "hidden",
                display: "flex",
                direction: "row",
                gap: "5px",
              }}
              ref={containerRef}
            >
              <Typography
                variant="h3"
                sx={{
                  userSelect: "none",
                }}
              >
                Очки за гейм: {chart.chartData.score - chart.chartData.bonusStep * 2}
              </Typography>
              <Typography
                key={scoresChanges.updateFlag}
                className="move-up"
                variant="h3"
                color={scoresChanges.scoreChange < 0 ? "red" : "green"}
                sx={{
                  userSelect: "none",
                }}
              >
                {" "}
                {scoresChanges.scoreChange > 0 ? "+" + scoresChanges.scoreChange : ""}
                {scoresChanges.scoreChange < 0 ? scoresChanges.scoreChange : ""}
              </Typography>
            </Box>
          </Stack>
          <Button
            sx={{
              color: "#9356A0",
              border: "#9356A0 1px solid",
              height: 40,
            }}
            onClick={() => {
              handleOpenRuleModal();
            }}
          >
            Правила игры
          </Button>
        </Stack>
        <Modal
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          open={isRuleModalOpened}
          onClose={handleCloseRuleModal}
        >
          <ModalContent sx={{ height: "90%", width: 800, overflow: "scroll" }}>
            <Typography>Описание игры "Удержи процесс!"</Typography>
            <Typography>В чем цель игры?</Typography>
            <Typography>
              Вы будете наблюдать за динамическим процессом, значение которого постоянно меняется. Ваша задача – не
              допускать "взрыва процесса", то есть выхода его значения за верхнюю границу (коричневая линия). Для этого
              необходимо успевать завершать процесс до взрыва. В этом вам поможет система искусственного интеллекта
              (ИИ), которая предупредит, если посчитает, что вскоре процесс выйдет за допустимые рамки. Тем не менее
              изредка система может пропустить опасную ситуацию, а иногда наоборот – предупредит об опасности, которой
              на самом деле нет.
            </Typography>
            <Typography>Доступные действия</Typography>
            <Typography>
              Чтобы запустить процесс, нажмите на кнопку "Начать игру!". При помощи кнопок с иконками стрелочек, вы
              можете ускорять и замедлять процесс. Кнопка "Пауза" в любой момент позволит приостановить игру, чтобы у
              вас появилось время подумать, стоит ли завершить процесс или нет. Для того, чтобы завершить процесс надо
              нажать на одноименную кнопку. Вы можете сделать это, даже если система не подаст вам сигнала (то есть
              пропустит опасность). При возникновении предупреждения от ИИ, посередине экрана всплывет окно и процесс
              автоматически ставится на паузу. У вас есть три варианта действий:
              <Typography>• запросить подсказку для принятия решения (про подсказки см. ниже)</Typography>
              <Typography>
                • продолжить процесс, т.е. отклонить совет ИИ, если вы посчитаете, что он дает ложную тревогу
              </Typography>
              <Typography>• завершить процесс (принять совет ИИ).</Typography>
            </Typography>
            <Typography>Как проводится игра?</Typography>
            <Typography>
              Вначале вам доступна тренировочная сессия; ее результаты не идут в ваш зачет. В любой момент вы можете
              перейти к основной игре (она будет продолжаться 60 минут). Если вы не перейдете сами, игра начнется
              автоматически ровно через 15 минут после начала тренировки. Процесс начнется с нулевого значения и будет
              нарастать; при опасном (с точки зрения ИИ) приближении к верхней границе появится предупреждение ИИ, и вам
              приведется выбирать действие, как описано в предыдущем разделе. И после взрыва, и после вашего останова
              процесс будет перезапущен с нуля. Тоже произойдет и без сигнала ИИ, если вы остановите процесс или он
              взорвется. Период игры между установлением процесса в ноль и его остановкой/взрывом называется геймом. Все
              геймы, сыгранные в ходе текущего занятия, формируют сет. Очки, набранные за сет, являются вашей итоговой
              оценкой занятия. На других занятиях будут другие сеты.
            </Typography>
            <Typography>Как набирать очки?</Typography>
            Каждый гейм оценивается своими очками. В начале гейма у вас всегда ноль очков, по его окончании заработанные
            в нем очки прибавляются к очкам сета. За каждый шаг, пройденный процессом без взрыва, к оценке гейма
            добавляется 10 очков. За каждое использование паузы отнимается 50 очков. За каждое отклонение неправильного
            совета ИИ (ложной тревоги) добавляется 2000 очков. За использование подсказок отнимаются очки, равные их
            стоимости (см. ниже). Итоговая оценка гейма зависит не только от количества набранных в нем очков, но и от
            того, как он закончился (взрывом или остановкой).
            <Typography>Оценка гейма после взрыва процесса</Typography>
            <Typography>
              Если гейм закончился взрывом, то все очки, которые были в нем набраны аннулированы. Если предупреждения не
              было (т.е. ИИ пропустил опасность, и вы тоже ее не распознали), итоговая оценка гейма будет нулевая. Если
              же ИИ предупредил о взрыве, но вы проигнорировали это правильное предупреждение, то с вас дополнительно
              снимается 4000 очков, т.е. текущая оценка сета уменьшится на 4000 очков.
            </Typography>
            <Typography>Оценка гейма после остановки процесса</Typography>
            <Typography>
              Если гейм закончился остановкой процесса, то все очки, которые были набраны в течение этого гейма,
              сохраняются. Однако итоговая оценка гейма скорректируется в зависимости от типа установки (всего есть
              четыре типа):
            </Typography>
            <Typography>
              • правильная остановка* с правильным** предупреждением от ИИ – вам добавится 500 очков (вы приняли
              правильный совет);
            </Typography>
            <Typography>
              • правильная остановка* без предупреждения от ИИ – вам добавится 4000 очков (вы спасли объект без
              подсказки ИИ);
            </Typography>
            <Typography>
              • неправильная остановка при ложной тревоге*** от ИИ – у вас отнимается 1000 очков (вы поверили ложной
              тревоге);
            </Typography>
            <Typography>
              • неправильная остановка без предупреждения от ИИ – у вас отнимается 2000 очков (вы сами сформировали
              ложную тревогу).
            </Typography>
            <Typography>
              *: Правильная остановка - это завершение процесса при условии, что на следующем шаге произойдет взрыв.
            </Typography>
            <Typography>
              **: Правильное предупреждение - это предупреждение от ИИ при условии, что на следующем шаге произойдет
              взрыв.
            </Typography>
            <Typography>
              ***: Ложная тревога - это предупреждение от ИИ при условии, что на следующем шаге не будет взрыва.
            </Typography>
            <Typography>
              Итак, итоговая оценка гейма складывается из очков, заработанных за этот гейм, и дополнительных штрафов или
              бонусов в соответствии с типом остановки процесса.
            </Typography>
            <Typography>Подсказки</Typography>
            <Typography>В игре есть две подсказки:</Typography>
            <Typography>
              • Показать весь текущий гейм. Стоит 50 очков. Показывает все точки процесса в текущем гейме. Может
              пригодиться, если необходимо посмотреть на развитие процесса с нулевого значения до текущей точки с целью
              изучить возможное развитие процесса вблизи границы.
            </Typography>
            <Typography>
              • Показать все свои предыдущие геймы. Стоит 200 очков. Действует аналогично первой подсказке, но
              показывает все сыгранные вами геймы.
              гейма.
            </Typography>
            <Typography>
              Вы можете использовать подсказки, когда ставите игру на паузу или когда приходит предупреждение от ИИ.
              Стоимость использованных подсказок вычитается из очков текущего гейма.
            </Typography>
            <Typography>Удачной игры!</Typography>
            <Button
              sx={{
                color: "#FFFFFF",
                backgroundColor: "#9356A0",
                flexGrow: 1,
              }}
              onClick={handleCloseRuleModal}
            >
              К игре
            </Button>
          </ModalContent>
        </Modal>
        <Modal
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6500,
          }}
          open={isHintModalOpened}
          onClose={handleCloseHintModal}
        >
          <ModalContent sx={{ width: 800 }}>{renderHintModal(chosenHint)}</ModalContent>
        </Modal>
        <Modal
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6500,
          }}
          open={isTrainingWarnModalOpened}
          onClose={handleCloseTrainingWarnModal}
        >
          <ModalContent sx={{ width: 800 }}>
            <Typography>
              Вы уверены, что хотите перейти в обычный режим? После этого действия вернуться к тренировке будет нельзя.
            </Typography>
            <Stack direction="row" gap={2}>
              <Button
                sx={{
                  color: "#FFFFFF",
                  backgroundColor: COLORS.graphGradientLow,
                  width: "100%",
                }}
                onClick={handleCloseTrainingWarnModal}
              >
                Продолжить тренироваться
              </Button>
              <Button
                sx={{
                  color: "#FFFFFF",
                  backgroundColor: "orange",
                  width: "100%",
                }}
                onClick={() => {
                  setIsChartStopped(true);
                  setIsDanger(false);
                  handleCloseTrainingWarnModal();
                  setShouldEndTime(false);
                  setIsTimeUp(false);
                  updateUserParSetUi({ is_training: false });
                }}
              >
                Закончить тренировку
              </Button>
            </Stack>
          </ModalContent>
        </Modal>
        <Container sx={{ width: "95%" }}>
          <Chart
            onAnimationEnd={triggerWrongChoiceAnim}
            className={wrongChoiceAnim ? "crash" : ""}
            ref={chartRef}
            options={options}
            data={chart.chartData.data}
          />
          {user.isAuth ? (
            <>
              {(userParSet == null ||
                (userParSet.is_training && userParSet.training_start_time == null) ||
                (!userParSet.is_training && userParSet.game_start_time == null)) &&
              isChartPaused ? (
                <Button
                  sx={{
                    color: "#FFFFFF",
                    backgroundColor: "#9356A0",
                    width: "100%",
                  }}
                  onClick={() => {
                    if (userParSet != null) {
                      if (userParSet.is_training) {
                        updateUserParSetUi({ training_start_time: transformToDbDateDayTime(Date.now()) });
                      } else if (!userParSet.is_training) {
                        updateUserParSetUi({ game_start_time: transformToDbDateDayTime(Date.now()) });
                      }
                      setIsChartPaused(false);
                    }
                  }}
                >
                  Начать игру!
                </Button>
              ) : (
                <>
                  {/* userParSet != null && ((userParSet.is_training && getRemTimeRaw(userParSet.training_start_time, trainingTimeLimitMs) > 0) || (!userParSet.is_training && getRemTimeRaw(userParSet.game_start_time, gameTimeLimitMs) > 0) ) */}
                  {!isTimeUp ? (
                    <>
                      <Stack display="flex" direction="column" spacing={1}>
                        <Stack display="flex" direction="row" spacing={1}>
                          <Box
                            sx={{
                              color: "#FFFFFF",
                              backgroundColor: "#9356A0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              px: "8px",
                              py: "12px",
                              borderRadius: "4px",
                            }}
                            onClick={() => {
                              decreaseSpeed();
                            }}
                          >
                            <DecreaseSpeedIcon />
                          </Box>
                          <Box
                            sx={{
                              width: "60px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #000000",
                              borderRadius: "4px",
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                userSelect: "none",
                              }}
                            >
                              {"x" + curSpeed.toString()}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              color: "#FFFFFF",
                              backgroundColor: "#9356A0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              px: "8px",
                              py: "12px",
                              borderRadius: "4px",
                            }}
                            onClick={() => {
                              increaseSpeed();
                            }}
                          >
                            <IncreaseSpeedIcon />
                          </Box>
                          {isChartPaused ? (
                            <Button
                              sx={{
                                color: "#FFFFFF",
                                backgroundColor: COLORS.continueButton,
                                flexGrow: 1,
                              }}
                              disabled={isDanger}
                              onClick={() => {
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
                              }}
                              startIcon={<PlayButtonIcon />}
                            >
                              Продолжить
                            </Button>
                          ) : (
                            <Button
                              sx={{
                                color: "#FFFFFF",
                                backgroundColor: COLORS.takeHintButton,
                                flexGrow: 1,
                              }}
                              onClick={() => {
                                setIsChartPaused(true);
                                chart.chartData.chartPaused();
                                changeScore(-50);
                              }}
                              startIcon={<PauseButtonIcon />}
                            >
                              Пауза
                            </Button>
                          )}
                          {/* <Button
                            sx={{
                              color: "#FFFFFF",
                              backgroundColor: COLORS.stopButton,
                              flexGrow: 1,
                            }}
                            disabled={isDanger}
                            onClick={() => {
                              setIsChartStopped(true);
                              setIsDanger(false);
                            }}
                            startIcon={<StopButtonIcon />}
                          >
                            Завершить процесс
                          </Button> */}
                        </Stack>
                        {isChartPaused ? (
                          <Button
                            sx={{
                              color: "#FFFFFF",
                              backgroundColor: COLORS.takeHintButton,
                              flexGrow: 1,
                            }}
                            onClick={() => {
                              handleOpenHintModal();
                            }}
                            startIcon={<TakeHintButtonIcon />}
                          >
                            Купить подсказки
                          </Button>
                        ) : (
                          <></>
                        )}
                      </Stack>
                    </>
                  ) : (
                    <>
                      {userParSet.is_training ? (
                        <>
                          <Typography sx={{ textAlign: "center" }} variant="h2">
                            Время для тренировки истекло. Перейдите в основной режим.
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography sx={{ textAlign: "center" }} variant="h2">
                            Время основной игры истекло. Спасибо за игру!
                          </Typography>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <Typography sx={{ textAlign: "center" }} variant="h2">
              Войдите в аккаунт, чтобы начать игру
            </Typography>
          )}
        </Container>
      </Box>
      {isDanger ? (
        <Box
          className="alert-border"
          sx={{
            position: "fixed",
            zIndex: 5500,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            padding: "0.75rem",
            borderRadius: "12px",
            backgroundColor: "#FFFFFF",
            border: "black solid 4px",
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems={"center"}>
              <DangerIcon />
              <Typography
                variant="h5"
                sx={{
                  userSelect: "none",
                }}
              >
                Опасность взрыва! Решите, что делать.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                sx={{
                  color: "#FFFFFF",
                  backgroundColor: COLORS.continueButton,
                  flexGrow: 1,
                }}
                onClick={() => {
                  setIsChartPaused(false);
                  setIsDanger(false);
                  handleCloseHintModal();
                }}
                startIcon={<PlayButtonIcon />}
              >
                Продолжить процесс
              </Button>
              <Button
                sx={{
                  color: "#FFFFFF",
                  backgroundColor: COLORS.takeHintButton,
                  flexGrow: 1,
                }}
                onClick={() => {
                  handleOpenHintModal();
                }}
                startIcon={<TakeHintButtonIcon />}
              >
                Купить подсказки
              </Button>
              <Button
                sx={{
                  color: "#FFFFFF",
                  backgroundColor: COLORS.stopButton,
                  flexGrow: 1,
                }}
                onClick={() => {
                  setIsChartStopped(true);
                  setIsDanger(false);
                }}
                startIcon={<StopButtonIcon />}
              >
                Завершить процесс
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : (
        <></>
      )}
    </Box>
  );
});

export default Home;
