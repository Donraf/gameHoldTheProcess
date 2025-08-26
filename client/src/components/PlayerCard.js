import { Autocomplete, Box, Button, Card, Divider, Stack, TextField, Typography } from "@mui/material";
import { ChartData } from "../utils/ChartData";
import React, { useRef } from "react";
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
import AddIcon from "./icons/AddIcon";

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
    legend: false,
  },
};

function createChartData(parSet) {
  let chartData = new ChartData(0);
  chartData.setParSet(parSet);
  while (!chartData.isCrashed()) {
    chartData.generateNextPoint();
  }
  return chartData.fullData;
}

export default function PlayerCard({ player }) {
  const chartRef = useRef < ChartJS > null;
  let chartData = createChartData(player.par_sets.find((set) => set.id === player.cur_par_set_id));
  const [selectedParSetId, setSelectedParSetId] = React.useState(player.cur_par_set_id);
  const [filterInput, setFilterInput] = React.useState(player.cur_par_set_id);

  return (
    <Card sx={{ padding: "12px" }}>
      <Stack width={"100%"} direction="column">
        <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold" }} component="div">
          {player ? player.name : ""}
        </Typography>

        <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
          Логин: {player ? player.login : ""}
        </Typography>

        <Divider component="div" />
        <Stack width={"100%"} direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Stack width={"80%"} direction="column">
            <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
              Текущий набор параметров (№{player ? player.cur_par_set_id : ""}):
            </Typography>

            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Коэффициент помех:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                {player ? player.par_sets.find((set) => set.id === player.cur_par_set_id).noise_coef : ""}
              </Typography>
            </Stack>

            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Коэффициент усиления:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                {player ? player.par_sets.find((set) => set.id === player.cur_par_set_id).gain_coef : ""}
              </Typography>
            </Stack>

            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Константа времени:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                {player ? player.par_sets.find((set) => set.id === player.cur_par_set_id).time_const : ""}
              </Typography>
            </Stack>
          </Stack>
          <Button
            variant="outlined"
            sx={{
              color: "#FFFFFF",
              height: "50%",
              backgroundColor: COLORS.mainTheme,
              flexGrow: 1,
            }}
            onClick={() => {}}
            startIcon={<AddIcon />}
          >
            Изменить набор параметров
          </Button>
        </Stack>

        <Divider component="div" />

        <Stack paddingTop={2} width={"100%"} direction="row" gap={1}>
          <Typography sx={{ color: "#232E4A", fontSize: 16, fontWeight: "bold", flexGrow: 9 }} component="div">
            Статистика игрока
          </Typography>
          <Autocomplete
            options={player.par_sets}
            getOptionLabel={(parSet) => parSet.id.toString()}
            renderInput={(params) => <TextField {...params} label="Выберите набор параметров" />}
            value={player.par_sets.find((parSet) => parSet.id === selectedParSetId) || null}
            onChange={(_, newValue) => {
              const newSelectedParSetId = newValue ? newValue.id : 0;
              setSelectedParSetId(newSelectedParSetId);
              setFilterInput(newSelectedParSetId);
            }}
            disableClearable
            sx={{
              flexGrow: 9,
            }}
          />
        </Stack>
        {<Chart ref={chartRef} options={options} data={chartData} />}
        <Stack width={"100%"} direction="row">
          <Stack width={"100%"} direction="column">
            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Коэффициент помех:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                {player ? player.par_sets.find((set) => set.id === selectedParSetId).noise_coef : ""}
              </Typography>
            </Stack>

            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Коэффициент усиления:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                {player ? player.par_sets.find((set) => set.id === selectedParSetId).gain_coef : ""}
              </Typography>
            </Stack>

            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Константа времени:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                {player ? player.par_sets.find((set) => set.id === selectedParSetId).time_const : ""}
              </Typography>
            </Stack>

            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Вероятность ложной тревоги:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                0.05
              </Typography>
            </Stack>

            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Вероятность пропуска цели:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                0.1
              </Typography>
            </Stack>
          </Stack>

          <Stack width={"100%"} direction="column">
            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Сыграно игр:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                50
              </Typography>
            </Stack>

            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Останавливает после сигнала ИИ:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                0.85
              </Typography>
            </Stack>

            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Продолжает после сигнала ИИ:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                0.8
              </Typography>
            </Stack>

            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Останавливает без сигнала ИИ:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                0.86
              </Typography>
            </Stack>

            <Stack width={"100%"} direction="row" spacing={0.5}>
              <Typography sx={{ color: "#8390A3", fontSize: 14, fontWeight: "medium" }} component="div">
                Ставит на паузу:
              </Typography>
              <Typography sx={{ color: "#232E4A", fontSize: 14, fontWeight: "bold" }} component="div">
                0.83
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}
