import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import React, { useMemo, useRef } from "react";
import Grid from "@mui/material/Grid2";
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

function parseChunks(choiceStats) {
  try {
    if (!choiceStats || choiceStats === "{}") return null;
    const chunks = JSON.parse(choiceStats);
    if (!Array.isArray(chunks) || chunks.length === 0) return null;
    return chunks;
  } catch {
    return null;
  }
}

function formChartData(chunks) {
  const labels = Object.keys(chunks[0].ChunkChoiceStat);
  return chunks.map((chunk) => {
    const hintDS = { label: "Подсказка", type: "line", borderColor: "rgb(255,0,0)", spanGaps: true, data: [] };
    const contDS = { label: "Продолжение", type: "line", borderColor: "rgb(0,0,255)", spanGaps: true, data: [] };
    const stopDS = { label: "Остановка", type: "line", borderColor: "rgb(0,255,0)", spanGaps: true, data: [] };
    for (const j in chunk.ChunkChoiceStat) {
      const stat = chunk.ChunkChoiceStat[j];
      if (stat.HintRel + stat.ContRel + stat.StopRel === 0) {
        hintDS.data.push(NaN);
        contDS.data.push(NaN);
        stopDS.data.push(NaN);
      } else {
        hintDS.data.push(stat.HintRel);
        contDS.data.push(stat.ContRel);
        stopDS.data.push(stat.StopRel);
      }
    }
    return {
      chartTitle: chunk.Title,
      labels: labels,
      datasets: [hintDS, contDS, stopDS],
    };
  });
}

/**
 * Графики долей реакций по значениям процесса с таблицей абсолютных
 * чисел под каждым графиком. Единая реализация для статистик
 * Аникина (choice_stats) и Венгера (choice_stats_venger_charts).
 */
export default function ResUserChoiceCharts({ choiceStats }) {
  const chartRef = useRef(null);
  const chunks = useMemo(() => parseChunks(choiceStats), [choiceStats]);
  const chunksData = useMemo(() => (chunks ? formChartData(chunks) : null), [chunks]);

  if (chunks == null) {
    return null;
  }

  return (
    <Grid container spacing={2}>
      {chunksData.map((cd, ind) => (
        <Grid key={cd.chartTitle} size={{ xs: 12, md: 4 }}>
          <Stack>
            <Typography>{cd.chartTitle}</Typography>
            <Chart ref={chartRef} options={options} data={cd} />
            <Accordion disableGutters>
              <AccordionSummary
                expandIcon={<Typography sx={{ fontSize: 18, lineHeight: 1 }}>▾</Typography>}
              >
                <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Таблица значений</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <TableContainer component={Paper}>
                  <Table size="small" aria-label="reaction counts table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Y</TableCell>
                        <TableCell>Подсказка</TableCell>
                        <TableCell>Продолжение</TableCell>
                        <TableCell>Остановка</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(chunks[ind].ChunkChoiceStat).map(([y, stat]) => (
                        <TableRow key={y}>
                          <TableCell>{y}</TableCell>
                          {stat.HintAbs + stat.ContAbs + stat.StopAbs !== 0 ? (
                            <>
                              <TableCell>
                                {stat.HintAbs} ({(stat.HintRel * 100).toFixed(1)}%)
                              </TableCell>
                              <TableCell>
                                {stat.ContAbs} ({(stat.ContRel * 100).toFixed(1)}%)
                              </TableCell>
                              <TableCell>
                                {stat.StopAbs} ({(stat.StopRel * 100).toFixed(1)}%)
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>-</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>-</TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Grid>
      ))}
    </Grid>
  );
}
