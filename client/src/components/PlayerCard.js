import {
  Button,
  Card,
  Divider,
  Modal,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ChartData } from "../utils/ChartData";
import React, { useContext, useEffect, useRef, useState } from "react";
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
import { COLORS, RESEARCHER_USER_ROUTE, USER_ROLE_ADMIN } from "../utils/constants";
import { useNavigate } from "react-router-dom";
import { ModalContent } from "./ModalContent";
import { getParSets, getParSetsPageCount } from "../http/graphAPI";
import { updateUserParSet } from "../http/userAPI";
import { useSnackbar } from "notistack";
import ChangeIcon from "./icons/ChangeIcon";
import StatisticsIcon from "./icons/StatisticsIcon";
import RadioCheckedIcon from "./icons/RadioCheckedIcon";
import RadioUncheckedIcon from "./icons/RadioUncheckedIcon";
import { computeStatistics, getStatistics } from "../http/statisticsAPI";
import { Context } from "..";

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
      beginAtZero: true,
      min: 0,
      max: 1,
    },
  },
  plugins: {
    legend: {},
  },
};

function createChartData(parSet) {
  let chartData = new ChartData(0);
  chartData.setParSet(parSet);
  while (!chartData.isCrashed() && chartData.points.length <= 200) {
    chartData.generateNextPoint();
  }
  return chartData.fullData;
}

function formChoiceChartData(choiceStats) {
  if (!choiceStats || choiceStats === "{}") return null;
  var jsCS = JSON.parse(choiceStats);
  const labels = Object.keys(jsCS[jsCS.length - 1]);
  const chunk = jsCS[jsCS.length - 1];
  const hintDS = { label: "Подсказка", type: "line", borderColor: "rgb(255,0,0)", spanGaps: true, data: [] };
  const contDS = { label: "Продолжение", type: "line", borderColor: "rgb(0,0,255)", spanGaps: true, data: [] };
  const stopDS = { label: "Остановка", type: "line", borderColor: "rgb(0,255,0)", spanGaps: true, data: [] };
  for (const j in chunk) {
    if (chunk[j].Hint + chunk[j].Cont + chunk[j].Stop === 0) {
      hintDS.data.push(NaN);
      contDS.data.push(NaN);
      stopDS.data.push(NaN);
    } else {
      hintDS.data.push(chunk[j].Hint);
      contDS.data.push(chunk[j].Cont);
      stopDS.data.push(chunk[j].Stop);
    }
  }

  return {
    chartTitle: "Все точки принятия решений",
    labels: labels,
    datasets: [hintDS, contDS, stopDS],
  };
}

export default function PlayerCard({ player }) {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [stats, setStats] = useState(null);
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);

  const chartRef = useRef < ChartJS > null;
  const [selectedParSetId, setSelectedParSetId] = React.useState(player.cur_par_set_id);

  const [chunkData, setChunkData] = useState(null);

  let chartData = isDataFetched ? createChartData(filteredData.find((set) => set.id === selectedParSetId)) : null;

  const [isChangeParSetModalOpened, setIsChangeParSetModalOpened] = React.useState(false);
  const handleOpenChangeParSetModal = () => setIsChangeParSetModalOpened(true);
  const handleCloseChangeParSetModal = () => setIsChangeParSetModalOpened(false);

  const [snackErrTexts, setSnackErrTexts] = React.useState([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    snackErrTexts.map((text) =>
      enqueueSnackbar(text, {
        variant: "error",
        autoHideDuration: 3000,
        preventDuplicate: true,
      })
    );
  }, [snackErrTexts]);

  useEffect(() => {
    setIsDataFetched(false);
    getParSetsUI().then(() => {
      setIsDataFetched(true);
    });
  }, [page]);

  useEffect(() => {
    const newSelectedParSetId = player.cur_par_set_id;
    getStatistics(player.id, newSelectedParSetId).then((stats) => {
      setStats(stats);
    });
    setSelectedParSetId(player.cur_par_set_id);
  }, [player]);

  useEffect(() => {
    setChunkData(formChoiceChartData(stats?.choice_stats));
  }, [stats]);

  const getParSetsUI = async () => {
    const filteredDataFromQuery = await getParSets();
    const newPageCount = await getParSetsPageCount();
    setPageCount(newPageCount);
    setFilteredData(filteredDataFromQuery);
  };

  const updateUserUi = () => {
    let snackErrors = [];
    if (selectedParSetId === player.cur_par_set_id) {
      snackErrors.push("Игрок уже играет с этим набором параметров");
    }
    if (snackErrors.length !== 0) {
      setSnackErrTexts(snackErrors);
      return;
    }

    updateUserParSet(player.id, selectedParSetId).then(
      (_) => {
        enqueueSnackbar("Набор параметров обновлен", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        player.cur_par_set_id = selectedParSetId;
      },
      (_) => {
        enqueueSnackbar("Ошибка при обновлении набора параметров", {
          variant: "error",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
      }
    );
  };

  const computeStats = async () => {
    computeStatistics(player.id, selectedParSetId).then((stats) => {
      setStats(stats);
    });
  };

  return (
    <Card sx={{ padding: "12px" }}>
      <Stack width={"100%"} direction="column">
        <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
          {player ? player.name : ""}
        </Typography>

        <Typography sx={{ color: "#8390A3", fontSize: 16, fontWeight: "medium" }} component="div">
          Логин: {player ? player.login : ""}
        </Typography>

        <Divider component="div" />

        <Stack width={"80%"} direction="column">
          <Stack width={"100%"} direction="row" spacing={0.5}>
            <Typography sx={{ color: "#8390A3", fontSize: 16, fontWeight: "medium" }} component="div">
              Текущий набор параметров:
            </Typography>
            <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
              №{player ? player.cur_par_set_id : ""}
            </Typography>
          </Stack>

          <Stack width={"100%"} direction="row" spacing={0.5}>
            <Typography sx={{ color: "#8390A3", fontSize: 16, fontWeight: "medium" }} component="div">
              Геймов:
            </Typography>
            <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
              {stats?.games_num != null ? stats?.games_num : "???"}
            </Typography>
            <Typography sx={{ color: "#8390A3", fontSize: 16, fontWeight: "medium" }} component="div">
              Остановок:
            </Typography>
            <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
              {stats?.stops_num != null ? stats?.stops_num : "???"}
            </Typography>
            <Typography sx={{ color: "#8390A3", fontSize: 16, fontWeight: "medium" }} component="div">
              Взрывов:
            </Typography>
            <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
              {stats?.crashes_num != null ? stats?.crashes_num : "???"}
            </Typography>
            <Typography sx={{ color: "#8390A3", fontSize: 16, fontWeight: "medium" }} component="div">
              Счёт:
            </Typography>
            <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
              {stats?.total_score != null ? stats?.total_score : "???"}
            </Typography>
          </Stack>

          <Stack width={"100%"} direction="row" spacing={0.5}>
            <Typography sx={{ color: "#8390A3", fontSize: 16, fontWeight: "medium" }} component="div">
              Остановка по сигналу:
            </Typography>
            <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
              n={stats?.stop_on_signal_num != null ? stats?.stop_on_signal_num : "???"} μ=
              {stats?.mean_stop_on_signal != null ? stats?.mean_stop_on_signal.toFixed(3) : "???"} σ=
              {stats?.stdev_stop_on_signal != null ? stats?.stdev_stop_on_signal.toFixed(3) : "???"}
            </Typography>
          </Stack>

          <Stack width={"100%"} direction="row" spacing={0.5}>
            <Typography sx={{ color: "#8390A3", fontSize: 16, fontWeight: "medium" }} component="div">
              Запрос информации по сигналу:
            </Typography>
            <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
              n={stats?.hint_on_signal_num != null ? stats?.hint_on_signal_num : "???"} μ=
              {stats?.mean_hint_on_signal != null ? stats?.mean_hint_on_signal.toFixed(3) : "???"} σ=
              {stats?.stdev_hint_on_signal != null ? stats?.stdev_hint_on_signal.toFixed(3) : "???"}
            </Typography>
          </Stack>

          <Stack width={"100%"} direction="row" spacing={0.5}>
            <Typography sx={{ color: "#8390A3", fontSize: 16, fontWeight: "medium" }} component="div">
              Запрос информации без сигнала:
            </Typography>
            <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
              n={stats?.hint_without_signal_num != null ? stats?.hint_without_signal_num : "???"} μ=
              {stats?.mean_hint_without_signal != null ? stats?.mean_hint_without_signal.toFixed(3) : "???"} σ=
              {stats?.stdev_hint_without_signal != null ? stats?.stdev_hint_without_signal.toFixed(3) : "???"}
            </Typography>
          </Stack>

          <Stack width={"100%"} direction="row" spacing={0.5}>
            <Typography sx={{ color: "#8390A3", fontSize: 16, fontWeight: "medium" }} component="div">
              Продолжение после сигнала:
            </Typography>
            <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
              n={stats?.continue_after_signal_num != null ? stats?.continue_after_signal_num : "???"} μ=
              {stats?.mean_continue_after_signal != null ? stats?.mean_continue_after_signal.toFixed(3) : "???"} σ=
              {stats?.stdev_continue_after_signal != null ? stats?.stdev_continue_after_signal.toFixed(3) : "???"}
            </Typography>
          </Stack>
        </Stack>

        {chunkData ? (
          <Stack>
            <Typography>{chunkData.chartTitle}</Typography>
            <Chart ref={chartRef} options={options} data={chunkData} />
          </Stack>
        ) : (
          <></>
        )}

        <Stack width={"100%"} direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Button
            variant="outlined"
            sx={{
              color: "#FFFFFF",
              height: "50%",
              backgroundColor: COLORS.mainTheme,
              flexGrow: 1,
            }}
            onClick={() => {
              navigate(RESEARCHER_USER_ROUTE, { state: { player: player } });
            }}
            startIcon={<StatisticsIcon />}
          >
            Посмотреть статистику
          </Button>
          <Button
            variant="outlined"
            sx={{
              color: "#FFFFFF",
              height: "50%",
              backgroundColor: COLORS.mainTheme,
              flexGrow: 1,
            }}
            onClick={() => {
              handleOpenChangeParSetModal();
            }}
            startIcon={<ChangeIcon />}
          >
            Изменить набор параметров
          </Button>
        </Stack>
      </Stack>

      {user.isAuth && user.user.role === USER_ROLE_ADMIN ? (
        <Button
          variant="outlined"
          sx={{
            color: "#FFFFFF",
            height: "50%",
            backgroundColor: COLORS.mainTheme,
            flexGrow: 1,
          }}
          onClick={() => {
            computeStats();
          }}
          startIcon={<StatisticsIcon />}
        >
          Рассчитать статистику
        </Button>
      ) : (
        <></>
      )}

      <Modal
        sx={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        open={isChangeParSetModalOpened}
        onClose={handleCloseChangeParSetModal}
      >
        <ModalContent sx={{ width: 800 }}>
          <Typography variant="h4" noWrap component="div">
            Выберите новый набор параметров
          </Typography>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>ID</TableCell>
                  <TableCell>Коэф. a</TableCell>
                  <TableCell>Коэф. b</TableCell>
                  <TableCell>Мат. ожидание помехи</TableCell>
                  <TableCell>Стандартное отклонение помехи</TableCell>
                  <TableCell>Вероятность ложной тревоги</TableCell>
                  <TableCell>Вероятность пропуска цели</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isDataFetched ? (
                  filteredData.map((parSet) => (
                    <TableRow
                      key={parSet.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      onClick={() => {
                        setSelectedParSetId(parSet.id);
                      }}
                    >
                      <TableCell>
                        {(() => {
                          if (parSet.id === player.cur_par_set_id) {
                            return <>Текущий</>;
                          } else if (parSet.id === selectedParSetId) {
                            return <RadioCheckedIcon />;
                          } else {
                            return <RadioUncheckedIcon />;
                          }
                        })()}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {parSet.id}
                      </TableCell>
                      <TableCell>{parSet.a}</TableCell>
                      <TableCell>{parSet.b}</TableCell>
                      <TableCell>{parSet.noise_mean}</TableCell>
                      <TableCell>{parSet.noise_stdev}</TableCell>
                      <TableCell>{parSet.false_warning_prob}</TableCell>
                      <TableCell>{parSet.missing_danger_prob}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <></>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {isDataFetched ? (
            <Pagination
              sx={{ pt: "16px" }}
              count={pageCount}
              page={page}
              onChange={(event, value) => {
                setPage(value);
              }}
              variant="outlined"
              shape="rounded"
            />
          ) : (
            <></>
          )}
          {isDataFetched ? <Chart ref={chartRef} options={options} data={chartData} /> : <></>}
          <Button
            sx={{ width: "fit-content", height: "40px" }}
            variant="contained"
            onClick={() => {
              updateUserUi();
            }}
          >
            Обновить набор параметров
          </Button>
        </ModalContent>
      </Modal>
    </Card>
  );
}
