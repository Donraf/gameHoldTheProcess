import { Box, Card, Stack, Typography } from "@mui/material";
import { ChartData } from "../utils/ChartData";
import React, { useContext, useEffect, useRef, useState } from "react";
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
  if (!choiceStats || choiceStats === "{}") return null;
  const chunkLen = 20;
  var chunksData = [];
  var jsCS = JSON.parse(choiceStats);
  const labels = Object.keys(jsCS[0]);
  for (const i in jsCS) {
    const chunk = jsCS[i];
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
    chunksData.push({
      chartTitle:
        i == jsCS.length - 1
          ? "Все точки принятия решений"
          : "Точки принятия решений " + (i * 20 + 1) + "-" + (i * 1 + 1) * 20,
      labels: labels,
      datasets: [hintDS, contDS, stopDS],
    });
  }
  return chunksData;
}

export default function ResUserCharts({ choiceStats }) {
  const chartRef = useRef < ChartJS > null;
  const chunksData = formChartData(choiceStats);

  return (
    <Grid container spacing={2}>
      {chunksData ? (
        chunksData.map((cd, ind) => {
          return (
            <Grid size={4}>
              <Stack>
                <Typography>{cd.chartTitle}</Typography>
                <Chart ref={chartRef} options={options} data={cd} />
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
