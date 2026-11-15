import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
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
import { useSnackbar } from "notistack";
import { ChartData } from "../utils/ChartData";
import { updateUserParSet } from "../http/userAPI";
import { ModalContent } from "./ModalContent";
import RadioCheckedIcon from "./icons/RadioCheckedIcon";
import RadioUncheckedIcon from "./icons/RadioUncheckedIcon";

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

const previewChartOptions = {
  animations: {
    x: { duration: 1000 },
    y: { duration: 0 },
  },
  scales: {
    y: { beginAtZero: true, min: 0, max: 1 },
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
  return chartData.getFullData();
}

// ChangeParSetModal — единая модалка смены набора параметров на странице.
export default function ChangeParSetModal({ player, parSets, onClose, onUpdated }) {
  const { enqueueSnackbar } = useSnackbar();
  const [selectedParSetId, setSelectedParSetId] = useState(player?.cur_par_set_id ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedParSetId(player?.cur_par_set_id ?? 0);
  }, [player]);

  const selectedParSet = useMemo(
    () => parSets.find((set) => set.id === selectedParSetId) ?? null,
    [parSets, selectedParSetId]
  );

  // Генерируем превью один раз на выбранный набор, а не на каждый рендер.
  const previewData = useMemo(
    () => (selectedParSet ? createChartData(selectedParSet) : null),
    [selectedParSet]
  );

  const handleUpdate = () => {
    if (!player) return;
    if (selectedParSetId === player.cur_par_set_id) {
      enqueueSnackbar("Игрок уже играет с этим набором параметров", {
        variant: "error",
        autoHideDuration: 3000,
        preventDuplicate: true,
      });
      return;
    }

    setSaving(true);
    updateUserParSet(player.id, selectedParSetId).then(
      () => {
        enqueueSnackbar("Набор параметров обновлен", {
          variant: "success",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        onUpdated(player.id, selectedParSetId);
        onClose();
      },
      () => {
        enqueueSnackbar("Ошибка при обновлении набора параметров", {
          variant: "error",
          autoHideDuration: 3000,
          preventDuplicate: true,
        });
        setSaving(false);
      }
    );
  };

  if (!player) {
    return null;
  }

  return (
    <Modal
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      open
      onClose={onClose}
    >
      <ModalContent sx={{ width: 800 }}>
        <Typography variant="h4" component="h2">
          Новый набор параметров для {player.name}
        </Typography>
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader sx={{ minWidth: 650 }} aria-label="parsets table">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>ID</TableCell>
                <TableCell>Название</TableCell>
                <TableCell>Коэф. a</TableCell>
                <TableCell>Коэф. b</TableCell>
                <TableCell>Мат. ожидание помехи</TableCell>
                <TableCell>Стандартное отклонение помехи</TableCell>
                <TableCell>Вероятность ложной тревоги</TableCell>
                <TableCell>Вероятность пропуска цели</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parSets.map((parSet) => (
                <TableRow
                  key={parSet.id}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 }, cursor: "pointer" }}
                  onClick={() => setSelectedParSetId(parSet.id)}
                >
                  <TableCell>
                    {parSet.id === player.cur_par_set_id ? (
                      <>Текущий</>
                    ) : parSet.id === selectedParSetId ? (
                      <RadioCheckedIcon />
                    ) : (
                      <RadioUncheckedIcon />
                    )}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {parSet.id}
                  </TableCell>
                  <TableCell>{parSet.name?.trim() || "—"}</TableCell>
                  <TableCell>{parSet.a}</TableCell>
                  <TableCell>{parSet.b}</TableCell>
                  <TableCell>{parSet.noise_mean}</TableCell>
                  <TableCell>{parSet.noise_stdev}</TableCell>
                  <TableCell>{parSet.false_warning_prob}</TableCell>
                  <TableCell>{parSet.missing_danger_prob}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {previewData && <Chart options={previewChartOptions} data={previewData} />}
        <Stack direction="row" spacing={2}>
          <Button
            sx={{ width: "fit-content", height: 40 }}
            variant="contained"
            disabled={saving}
            onClick={handleUpdate}
          >
            Обновить набор параметров
          </Button>
          <Button sx={{ width: "fit-content", height: 40 }} variant="outlined" onClick={onClose}>
            Отмена
          </Button>
        </Stack>
      </ModalContent>
    </Modal>
  );
}
