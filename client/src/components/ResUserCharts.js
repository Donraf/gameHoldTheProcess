import {
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
import React, { useRef } from "react";
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

function formChartData(choiceStats) {
  try {
    if (!choiceStats || choiceStats === "{}") return null;
    var chunksData = [];
    var jsCS = JSON.parse(choiceStats);
    const labels = Object.keys(jsCS[0].ChunkChoiceStat);
    for (const i in jsCS) {
      const chunk = jsCS[i];
      const hintDS = { label: "Подсказка", type: "line", borderColor: "rgb(255,0,0)", spanGaps: true, data: [] };
      const contDS = { label: "Продолжение", type: "line", borderColor: "rgb(0,0,255)", spanGaps: true, data: [] };
      const stopDS = { label: "Остановка", type: "line", borderColor: "rgb(0,255,0)", spanGaps: true, data: [] };
      for (const j in chunk.ChunkChoiceStat) {
        if (
          chunk.ChunkChoiceStat[j].HintRel + chunk.ChunkChoiceStat[j].ContRel + chunk.ChunkChoiceStat[j].StopRel ===
          0
        ) {
          hintDS.data.push(NaN);
          contDS.data.push(NaN);
          stopDS.data.push(NaN);
        } else {
          hintDS.data.push(chunk.ChunkChoiceStat[j].HintRel);
          contDS.data.push(chunk.ChunkChoiceStat[j].ContRel);
          stopDS.data.push(chunk.ChunkChoiceStat[j].StopRel);
        }
      }
      chunksData.push({
        chartTitle: chunk.Title,
        labels: labels,
        datasets: [hintDS, contDS, stopDS],
      });
    }
    return chunksData; 
  } catch {
    return null
  }
}

function formTableData(choiceStats) {
  if (!choiceStats || choiceStats === "{}") return [];
  var tableData = [];
  var jsCS = JSON.parse(choiceStats);
  for (const i in jsCS) {
    const chunk = jsCS[i];
    const chunkData = [];
    for (var j in chunk.ChunkChoiceStat) {
      chunkData.push([j, chunk.ChunkChoiceStat[j]]);
    }
    tableData.push(chunkData);
  }
  return tableData;
}

export default function ResUserCharts({ choiceStats }) {
  const chartRef = useRef < ChartJS > null;
  const chunksData = formChartData(choiceStats);
  const tableData = formTableData(choiceStats);
  return (
    <Grid container spacing={2}>
      {chunksData ? (
        chunksData.map((cd, ind) => {
          return (
            <Grid size={4}>
              <Stack>
                <Typography>{cd.chartTitle}</Typography>
                <Chart ref={chartRef} options={options} data={cd} />
                <TableContainer component={Paper}>
                  <Table aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Y</TableCell>
                        <TableCell>Подсказка</TableCell>
                        <TableCell>Продолжение</TableCell>
                        <TableCell>Остановка</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {true ? (
                        tableData[ind].map((rowNum) => (
                          <TableRow>
                            <TableCell>{rowNum[0]}</TableCell>
                            {rowNum[1].HintAbs + rowNum[1].ContAbs + rowNum[1].StopAbs !== 0 ? (
                              <>
                                <TableCell>
                                  {rowNum[1].HintAbs} ({(rowNum[1].HintRel * 100).toFixed(1)}%)
                                </TableCell>
                                <TableCell>
                                  {rowNum[1].ContAbs} ({(rowNum[1].ContRel * 100).toFixed(1)}%)
                                </TableCell>
                                <TableCell>
                                  {rowNum[1].StopAbs} ({(rowNum[1].StopRel * 100).toFixed(1)}%)
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
                        ))
                      ) : (
                        <></>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </Grid>
          );
        })
      ) : (
        <></>
      )}
    </Grid>
  );
}
