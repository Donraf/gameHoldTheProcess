import {
  Button,
  Card,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
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
import { RESEARCHER_USER_ROUTE, USER_ROLE_ADMIN } from "../utils/constants";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import ChangeIcon from "./icons/ChangeIcon";
import StatisticsIcon from "./icons/StatisticsIcon";
import { computeStatistics, getStatistics } from "../http/statisticsAPI";
import { parSetLabel } from "../utils/parSet";
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

function formChoiceChartData(choiceStats) {
  try {
    if (!choiceStats || choiceStats === "{}") return null;
    const jsCS = JSON.parse(choiceStats);
    const labels = Object.keys(jsCS[jsCS.length - 1].ChunkChoiceStat);
    const chunk = jsCS[jsCS.length - 1];
    const hintDS = { label: "Подсказка", type: "line", borderColor: "rgb(255,0,0)", spanGaps: true, data: [] };
    const contDS = { label: "Продолжение", type: "line", borderColor: "rgb(0,0,255)", spanGaps: true, data: [] };
    const stopDS = { label: "Остановка", type: "line", borderColor: "rgb(0,255,0)", spanGaps: true, data: [] };
    for (const j in chunk.ChunkChoiceStat) {
      if (chunk.ChunkChoiceStat[j].HintRel + chunk.ChunkChoiceStat[j].ContRel + chunk.ChunkChoiceStat[j].StopRel === 0) {
        hintDS.data.push(NaN);
        contDS.data.push(NaN);
        stopDS.data.push(NaN);
      } else {
        hintDS.data.push(chunk.ChunkChoiceStat[j].HintRel);
        contDS.data.push(chunk.ChunkChoiceStat[j].ContRel);
        stopDS.data.push(chunk.ChunkChoiceStat[j].StopRel);
      }
    }

    return {
      chartTitle: "Все точки принятия решений",
      labels: labels,
      datasets: [hintDS, contDS, stopDS],
    };
  } catch {
    return {
      chartTitle: "Ошибка",
      labels: [],
      datasets: [],
    };
  }
}

export default function PlayerCard({ player, parSets = [], onChangeParSet }) {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [stats, setStats] = useState(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [chunkData, setChunkData] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setStatsLoaded(false);
    getStatistics(player.id, player.cur_par_set_id)
      .then((stats) => {
        setStats(stats);
      })
      .finally(() => {
        setStatsLoaded(true);
      });
  }, [player]);

  useEffect(() => {
    setChunkData(formChoiceChartData(stats?.choice_stats));
  }, [stats]);

  const computeStats = async () => {
    computeStatistics(player.id, player.cur_par_set_id).then((newStats) => {
      setStats(newStats);
    });
  };

  const currentParSet = parSets.find((set) => set.id === player.cur_par_set_id);
  const hasGameData = stats != null && stats.games_num > 0;

  return (
    <Card sx={{ p: 1.5, height: "100%" }}>
      <Stack width={"100%"} height={"100%"} direction="column">
        <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
          {player ? player.name : ""}
        </Typography>

        <Typography sx={{ color: "text.secondary", fontSize: 16, fontWeight: "medium" }} component="div">
          Логин: {player ? player.login : ""}
        </Typography>

        <Divider component="div" />

        <Stack width={"80%"} direction="column">
          <Stack width={"100%"} direction="row" spacing={0.5}>
            <Typography sx={{ color: "text.secondary", fontSize: 16, fontWeight: "medium" }} component="div">
              Текущий набор параметров:
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
              {player
                ? currentParSet
                  ? parSetLabel(currentParSet)
                  : `№${player.cur_par_set_id}`
                : ""}
            </Typography>
          </Stack>

          {hasGameData ? (
            <>
              <Stack width={"100%"} direction="row" spacing={0.5}>
                <Typography sx={{ color: "text.secondary", fontSize: 16, fontWeight: "medium" }} component="div">
                  Геймов:
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
                  {stats.games_num}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 16, fontWeight: "medium" }} component="div">
                  Остановок:
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
                  {stats.stops_num}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 16, fontWeight: "medium" }} component="div">
                  Взрывов:
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
                  {stats.crashes_num}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 16, fontWeight: "medium" }} component="div">
                  Счёт:
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
                  {stats.total_score}
                </Typography>
              </Stack>

              <Stack width={"100%"} direction="row" spacing={0.5}>
                <Typography sx={{ color: "text.secondary", fontSize: 16, fontWeight: "medium" }} component="div">
                  Остановка по сигналу:
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
                  n={stats.stop_on_signal_num} μ=
                  {stats.mean_stop_on_signal != null ? stats.mean_stop_on_signal.toFixed(3) : "—"} σ=
                  {stats.stdev_stop_on_signal != null ? stats.stdev_stop_on_signal.toFixed(3) : "—"}
                </Typography>
              </Stack>

              <Stack width={"100%"} direction="row" spacing={0.5}>
                <Typography sx={{ color: "text.secondary", fontSize: 16, fontWeight: "medium" }} component="div">
                  Запрос информации по сигналу:
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
                  n={stats.hint_on_signal_num} μ=
                  {stats.mean_hint_on_signal != null ? stats.mean_hint_on_signal.toFixed(3) : "—"} σ=
                  {stats.stdev_hint_on_signal != null ? stats.stdev_hint_on_signal.toFixed(3) : "—"}
                </Typography>
              </Stack>

              <Stack width={"100%"} direction="row" spacing={0.5}>
                <Typography sx={{ color: "text.secondary", fontSize: 16, fontWeight: "medium" }} component="div">
                  Продолжение после сигнала:
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: "bold" }} component="div">
                  n={stats.continue_after_signal_num} μ=
                  {stats.mean_continue_after_signal != null ? stats.mean_continue_after_signal.toFixed(3) : "—"} σ=
                  {stats.stdev_continue_after_signal != null ? stats.stdev_continue_after_signal.toFixed(3) : "—"}
                </Typography>
              </Stack>
            </>
          ) : null}
        </Stack>

        {!hasGameData && statsLoaded && (
          <Stack
            flexGrow={1}
            alignItems="center"
            justifyContent="center"
            sx={{ py: 4 }}
          >
            <Typography
              sx={{ color: "text.secondary", fontSize: 20, textAlign: "center" }}
              component="div"
            >
              Данные по игре с этим набором параметров отсутствуют
            </Typography>
          </Stack>
        )}

        {hasGameData && chunkData ? (
          <Stack>
            <Typography>{chunkData.chartTitle}</Typography>
            <Chart options={options} data={chunkData} />
          </Stack>
        ) : (
          <></>
        )}

        <Stack width={"100%"} direction="row" spacing={2} sx={{ alignItems: "center", mt: "auto", pt: 1 }}>
          <Button
            variant="contained"
            sx={{ flexGrow: 1 }}
            onClick={() => {
              navigate(`${RESEARCHER_USER_ROUTE}/${player.id}`);
            }}
            startIcon={<StatisticsIcon />}
          >
            Посмотреть расширенную статистику
          </Button>
          {user.isAuth && user.user.role === USER_ROLE_ADMIN && (
            <Button
              variant="contained"
              sx={{ flexGrow: 1 }}
              onClick={() => onChangeParSet?.(player)}
              startIcon={<ChangeIcon />}
            >
              Изменить набор параметров
            </Button>
          )}
        </Stack>

        {user.isAuth && user.user.role === USER_ROLE_ADMIN && (
          <Button
            variant="contained"
            sx={{ mt: 1 }}
            onClick={() => {
              computeStats();
            }}
            startIcon={<StatisticsIcon />}
          >
            Рассчитать статистику
          </Button>
        )}
      </Stack>
    </Card>
  );
}
